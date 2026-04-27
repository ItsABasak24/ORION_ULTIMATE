from Server.Routers.SecurityUtils import AccessesController, UserManager, User
from Server.Schemas.RequestResponseModel import (
    SearchRequest, UserCreateReq, UserCreateRes,
    uplodeReq, UserLoginReq, UserLoginRes, uplodeStatusReq
)
from Server.RedisCache.RedisConfig import getRedisObject, Redis
from sentence_transformers import SentenceTransformer
from Server.Routers.Components.LLM import Gemini
from fastapi import status, HTTPException
from upstash_vector import Index
import logging
import asyncio
import dotenv
import asyncio
import aiohttp
import fitz
import httpx
import uuid
import json
import time
import os

dotenv.load_dotenv()

logging.basicConfig(level=logging.INFO)
logger: logging = logging.getLogger("uvicorn")

BASE_DIR: str = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR: str = os.path.join(BASE_DIR, "VactorModels")
URL: str = os.getenv("UPSTASH_SEARCH_REST_URL")
TOKEN: str = os.getenv("UPSTASH_SEARCH_REST_TOKEN")
PDFDATA: str = os.path.join(BASE_DIR, "pdfData")

if not URL or not TOKEN:
    raise HTTPException(
        status_code=status.HTTP_424_FAILED_DEPENDENCY, 
        detail="Upstash credentials missing in .env"
    )

model: SentenceTransformer = SentenceTransformer("all-MiniLM-L6-v2", cache_folder=MODEL_DIR)
index: Index = Index(url=URL, token=TOKEN)
logger.info(f"Vactor Data Base Index Info: {index.info()}")
SearchQuery = os.getenv("SearchQuery")

class AppController:
    """ AppController is the main controller class for handling all the operations related to user management, 
        PDF processing, vector database interactions, and search functionality. It serves as the central point for 
        orchestrating various tasks and ensuring smooth communication between different components of the application.
    """

    @staticmethod
    async def _upload(payload: uplodeReq) -> dict:
        """ Uploads a PDF file for processing and returns session information. 
            This method generates a unique session ID, stores the upload request in Redis, and queues the task for processing.
            
            Args:
                payload (uplodeReq): The request payload containing user ID and PDF URL.
            
            Returns:   
                dict: A dictionary containing user ID, session ID, and status of the upload request.
        """
        redis: Redis = getRedisObject()
        sessionid: str = str(uuid.uuid4())
        payload.sessionid = sessionid
        redis.set(sessionid, json.dumps(payload.model_dump()))
        redis.rpush("jobQueue", sessionid)
        return {"userid": payload.userid, "sessionid": sessionid, "status": "Queued"}
    
    @staticmethod
    async def _uploadStatus(payload: uplodeStatusReq) -> bool:
        """ Checks the status of a PDF upload and processing task based on the session ID. This method retrieves the 
            processing status from Redis using the session ID and returns whether the task is completed or still in progress.
            
            Args:
                payload (uplodeStatusReq): The request payload containing the session ID to check the status for.
            
            Returns:    
                bool: A boolean value indicating whether the PDF processing is completed (True) or still in progress (False).
        """
        redis: Redis = getRedisObject()
        sessionid: str = payload.sessionid
        value: bool = redis.get(key=f"{sessionid}status")
        if value is None:
            return False
        return value

    @staticmethod
    async def _search(payload: SearchRequest) -> dict:
        """ Performs a search query against the vector database and returns relevant results. This method first checks if 
            the search query result is cached in Redis. If cached, it returns the cached result. If not, it performs 
            a vector search using the query, retrieves relevant text and page information, generates a response using Gemini AI, 
            caches the result in Redis for future requests, and returns the final response containing relevant pages and the generated answer.
            
            Args:
                payload (SearchRequest): The request payload containing the search query and session ID.
            
            Returns:    
                dict: A dictionary containing the relevant pages and the generated response based on the search query.
        """
        redis: Redis = getRedisObject()
        cache: dict = redis.get(key=payload.query)
        if cache:
            return json.loads(cache)
        result: list = await AppController.VectorHandler.searchVector(query=payload.query, sessionid=payload.sessionid)
        texts: list = [item.metadata['text'] for item in result if item.metadata]
        pages: list = [item.metadata['pagenumber'] for item in result if item.metadata]
        finalTextData: str = " ".join(" ".join(t.split()) for t in texts)
        respose: str = await Gemini.geminiAi(task=f"{SearchQuery} paragraph: {finalTextData} UserQuestion: {payload.query}")
        finalDictData: dict = {
            "pages" : pages,
            "result": respose
        } 
        redis.set(key=payload.query, value=finalDictData, ex=60*30)
        return finalDictData

    @staticmethod
    def _signup(UserIn: UserCreateReq) -> UserCreateRes:
        """ Registers a new user in the system. This method checks if the email provided in the registration request is already 
            associated with an existing user. If the email is already registered, it raises an HTTP exception indicating that the 
            email is already in use. If the email is not registered, it creates a new user using the UserManager, hashes the password, 
            and returns a response containing the user's ID, name, email, and account creation timestamp.
            
            Args:
                UserIn (UserCreateReq): The request payload containing the user's name, email, and password for registration.
            
            Returns:
                UserCreateRes: A response object containing the newly created user's ID, name, email, and account creation timestamp.
        """
        if UserManager.getUserByEmail(UserIn.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        user: User = UserManager.createUser(UserIn.name, UserIn.email, UserIn.password)
        return UserCreateRes(id=str(user.id), name=user.name, email=user.email, createdAt=user.createdAt)

    @staticmethod
    def _login(UserIn: UserLoginReq) -> UserLoginRes:
        """ Authenticates a user and generates an access token for authorized access. This method retrieves the user based on the 
            email provided in the login request. If the user does not exist or the password is incorrect, it raises an HTTP exception 
            indicating unauthorized access. If the authentication is successful, it generates an access token using the AccessesController 
            and returns a response containing the user's ID, name, email, account creation timestamp, access token, and token type.
            
            Args:
                UserIn (UserLoginReq): The request payload containing the user's email and password for authentication.
            
            Returns:   
                UserLoginRes: A response object containing the authenticated user's ID, name, email, account creation timestamp, 
                access token, and token type.
        """
        user: User = UserManager.getUserByEmail(UserIn.email)
        if not user or not AccessesController.verifyPassword(UserIn.password, user.hashedPassword):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        accessToken: str = AccessesController.createAccessToken(subject=user.email)
        res: UserLoginRes = {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "createdAt": user.createdAt,
            "accessToken": accessToken, 
            "tokenType": "bearer"
        }
        return res

    class VectorHandler:
        """ VectorHandler is a utility class responsible for handling all operations related to vector embeddings and interactions 
            with the vector database. It provides methods for generating vector embeddings from text, inserting vectors into the
            database, and performing vector searches based on user queries.
        """

        @staticmethod
        async def embed(text: str) -> list:
            """ Generates a vector embedding for the given text using the SentenceTransformer model. This method takes a string of text as 
                input, generates a vector representation of the text using the pre-trained model, and returns the vector as a list of 
                floating-point numbers.
                
                Args:
                    text (str): The input text for which to generate the vector embedding.
                
                Returns:
                    list: A list of floating-point numbers representing the vector embedding of the input text.
            """
            if text is None:
                return []
            vector = await asyncio.to_thread(model.encode, text)
            return vector.tolist()

        @staticmethod
        async def insertVector(data: dict) -> None:
            """ Inserts a vector into the vector database. This method takes a dictionary containing the text, metadata, and ID for 
                the vector, generates the vector embedding for the text, and upserts the vector into the database with the associated
                metadata. It also includes error handling to log any exceptions that occur during the upsert operation.
                
                Args:
                    data (dict): A dictionary containing the text, metadata, and ID for the vector to
                    be inserted into the database. The dictionary should have the following structure:
                    {
                        "id": str,  # Unique identifier for the vector
                        "text": str,  # The text to be embedded and stored as a vector
                        "metadata": dict  # Additional metadata to be associated with the vector
                    }
                
                Returns: None    
            """
            vector: list = await AppController.VectorHandler.embed(data.get("text"))
            try:
                await asyncio.to_thread(
                    index.upsert,
                    vectors=[
                        (
                            data.get("id"),
                            vector,
                            data.get("metadata")
                        )
                    ]
                )
                logger.info(f"Inserted: {data.get('id')}")
            except Exception as e:
                logger.exception(f"Vector upsert error for {data.get('id')}: {e}")
        
        @staticmethod
        async def searchVector(query: str, sessionid: str, top_k: int = 3) -> list:
            """ Performs a vector search in the database based on the user's query and session ID. This method generates a vector embedding 
                for the search query, performs a search in the vector database to retrieve the top K most relevant results that match the 
                session ID, and returns the search results along with their associated metadata. It also includes error handling to log 
                any exceptions that occur during the search operation.
                
                Args:
                    query (str): The search query input by the user for which to perform the vector search
                    sessionid (str): The session ID to filter the search results and ensure that only relevant 
                    vectors associated with the session are retrieved.
                    top_k (int, optional): The number of top relevant results to retrieve from the vector database. Defaults to 3.
                
                Returns:
                    list: A list of search results containing the most relevant vectors and their associated metadata 
                    based on the search query and session ID.
            """
            queryVector = await AppController.VectorHandler.embed(query)
            results = index.query(
                vector=queryVector,
                top_k=top_k,
                include_metadata=True,
                filter=f"sessionid = '{sessionid}'"
            )
            return results

    class PdfHandler:
        """ PdfHandler is a utility class responsible for handling all operations related to PDF processing, including downloading PDF files,
            extracting text from PDF pages, and upserting the extracted text as vectors into the vector database. It provides methods for 
            downloading PDFs, processing the PDF content, and managing the lifecycle of PDF files during processing.
        """

        @staticmethod
        async def PDFdownloder(Data: dict) -> str | None:
            """ Downloads a PDF file from a given URL and saves it locally for processing. This method takes a dictionary containing the 
                session ID and the URL of the PDF to be downloaded. It creates a local file path based on the session ID, performs an 
                asynchronous download of the PDF file using aiohttp, and saves it to the specified location. If the download is successful, 
                it returns the file path of the downloaded PDF. If there is an error during the download process, it logs the exception and 
                returns None.
                
                Args:
                    Data (dict): A dictionary containing the session ID and the URL of the PDF to be downloaded. 
                    The dictionary should have the following structure:
                    {
                        "sessionid": str,  # Unique identifier for the session associated with the PDF
                        "url": str  # The URL from which to download the PDF file
                    }
                
                Returns:
                    str | None: The file path of the downloaded PDF if the download is successful, or
                    None if there is an error during the download process.
            """
            sessionid: str = Data.get("sessionid")
            url: str = Data.get("url")
            
            if not sessionid or not url:
                logger.error("Session ID or URL missing")
                return None

            os.makedirs(PDFDATA, exist_ok=True)
            filePath: str = os.path.join(PDFDATA, f"{sessionid}.pdf")
            logger.info(f"Downloading PDF from: {url}")

            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as response:
                        if response.status != 200:
                            raise RuntimeError(f"Download failed. Status code: {response.status}")

                        with open(filePath, "wb") as f:
                            async for chunk in response.content.iter_chunked(64 * 1024):
                                f.write(chunk)
                                
                logger.info("PDF downloaded successfully")
                return filePath
            except Exception as e:
                logger.exception(f"PDF download error: {e}")
                return None

        @staticmethod
        async def fileToVactorUpsert(Data: dict, filePath: str) -> None:
            """ Processes a PDF file by extracting text from its pages and upserting the extracted text as vectors into the vector database. 
                This method takes a dictionary containing the session ID and the file path of the PDF to be processed. It checks if the PDF 
                file exists, extracts text from each page of the PDF using fitz, generates vector embeddings for the extracted text, 
                and upserts the vectors into the database with associated metadata. After processing, it sets a status in Redis to indicate 
                completion and removes the local PDF file. If there is an error during processing, it logs the exception.
                
                Args:
                    Data (dict): A dictionary containing the session ID for which the PDF is being processed. The dictionary should have 
                    the following structure:
                    {
                        "sessionid": str  # Unique identifier for the session associated with the PDF processing
                    }
                    filePath (str): The file path of the PDF to be processed.       
                
                Returns: None
            """
            if not os.path.exists(filePath):
                logger.error(f"PDF file not found: {filePath}")
                return
            try:
                sessionid: str = Data.get('sessionid')
                ttl: float = time.time() + 3600
                redis: Redis = getRedisObject()
                
                def _extractText():
                    extracted_pages = []
                    with fitz.open(filePath) as doc:
                        for i, page in enumerate(doc, start=1):
                            text: str = page.get_text() or ""
                            extracted_pages.append((i, text))
                    return extracted_pages

                pagesData = await asyncio.to_thread(_extractText)
                upsertTasks: list = []
                for i, text in pagesData:
                    docid: str = f"{sessionid}-{i}"
                    record: dict = {
                        "id": docid,
                        "text": text,
                        "metadata": {
                            "sessionid": sessionid,
                            "ttl": ttl,
                            "pagenumber": i,
                            "text": text
                        }
                    }
                    upsertTasks.append(AppController.VectorHandler.insertVector(record))
                    
                await asyncio.gather(*upsertTasks)
                logger.info("PDF vector upsert completed")
                redis.set(key=f"{sessionid}status", value=True, ex=300)
                os.remove(filePath) 
            except Exception as e:
                logger.exception(f"PDF processing error: {e}")
            
    @staticmethod
    async def orchestrator(Data: dict) -> bool:
        """ Orchestrates the entire process of handling a PDF upload, including downloading the PDF, processing its content, and upserting 
            vectors into the database. This method serves as the main workflow for processing a PDF upload. It takes a dictionary containing 
            the session ID and PDF URL, initiates the download of the PDF, processes the PDF content to extract text and generate vectors, 
            upserts the vectors into the database, and manages the status of the processing task in Redis. If any step in the process fails, 
            it logs the error and returns False. If the entire process is successful, it returns True.
            
            Args:
                Data (dict): A dictionary containing the session ID and the URL of the PDF to be processed. The dictionary should have t
                he following structure:
                {   
                    "sessionid": str,  # Unique identifier for the session associated with the PDF processing
                    "url": str  # The URL from which to download the PDF file
                }
            
            Returns:
                bool: A boolean value indicating whether the PDF processing was successful (True) or if there was an error during 
                the process (False).
        """
        filePath: str | None = await AppController.PdfHandler.PDFdownloder(Data=Data)
        if filePath is None:
            logger.error("Error: Could not download the pdf file.")
            return False
        else:
            await AppController.PdfHandler.fileToVactorUpsert(Data=Data, filePath=filePath)
            logger.info("Pdf process successfully all the data stored to the vector database.")
            redis: Redis = getRedisObject()
            redis.delete(Data.get('sessionid'))
            return True

    @staticmethod
    async def broker() -> None:
        """ Continuously listens for tasks in the Redis job queue and processes them using the orchestrator method. This method serves as 
            the main loop for handling background tasks related to PDF processing. It connects to Redis, listens for new tasks in the 
            "jobQueue", retrieves the task details from Redis, and calls the orchestrator method to process each task. If there are no tasks
            in the queue, it waits for a specified interval before checking again. If there is an error connecting to Redis or processing a
            task, it logs the error and continues to listen for new tasks.
            
            Args: None
            Returns: None   
            """
        redis: Redis = getRedisObject()
        if redis is None:
            logger.error("Error: No broker available")
            return

        while True:
            try:
                taskref: str = redis.lpop("jobQueue")
                if taskref:
                    logger.info("Task received. Going to further processing")
                    task_json = redis.get(taskref)
                    
                    if not task_json:
                        logger.error(f"Task reference {taskref} found in queue but redis.get returned empty.")
                    else:
                        try:
                            task: dict | None = json.loads(task_json)
                        except Exception as e:
                            logger.exception(f"Failed to parse task JSON for ref {taskref}: {e}")
                            task = None

                        if task:
                            await AppController.orchestrator(Data=task)
                else:
                    await asyncio.sleep(10)

            except Exception as e:
                logger.error(f"Broker error: {e}")
                await asyncio.sleep(10)
    
    class Schedulers:
        """ Schedulers is a utility class responsible for managing background tasks that need to run periodically, such as cleaning 
            up expired vectors from the database and sending keep-alive pings to ensure the application remains active. 
            It provides methods for scheduling these tasks to run at specified intervals.
        """
        
        @staticmethod
        async def vectorCleaner():
            """ Periodically cleans up expired vectors from the vector database. This method runs in an infinite loop, checking for vectors
                that have expired based on their TTL (time-to-live) and deleting them from the database. It calculates the current time, 
                constructs a filter to identify expired vectors, and deletes them from the database. It also includes error handling to log 
                any exceptions that occur during the cleanup process. The method sleeps for a specified interval before checking for expired
                vectors again.
                
                Args: None
                Returns: None
            """
            while True:
                try:
                    now = time.time()
                    index.delete(filter=f"ttl < {now}")
                    logger.info(f"Background Cleanup: Removed vectors expired before {now}")
                except Exception as e:
                    logger(f"Cleanup Error: {e}")
                    
                await asyncio.sleep(3700)
        
        @staticmethod
        async def pingMan():
            """ Periodically sends a keep-alive ping to a specified URL to ensure the application remains active. This method runs in an 
                infinite loop, sending a GET request to the specified URL at regular intervals. It logs the status of the ping and any 
                exceptions that occur during the process. The method sleeps for a specified interval before sending the next ping.
                
                Args: None
                Returns: None
            """
            URL = os.getenv('pingMan')
            async with httpx.AsyncClient() as client:
                while True:
                    try:
                        response = await client.get(URL, timeout=10)
                        if response.status_code == 200:
                            logger.info("Application and background task is running status healthy")
                        else:
                            logger.info(f"Status code: {response.status_code}")
                    except Exception as e:
                        logger.error(f"Keep-alive ping failed: {e}")

                    await asyncio.sleep(600)