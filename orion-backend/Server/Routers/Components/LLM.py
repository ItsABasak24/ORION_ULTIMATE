
import os
from asyncio import Lock
from google.genai import Client
import dotenv
import logging


# program configurations
dotenv.load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

# API Key Configuration
APIKEYS: list[str] = os.getenv("GeminiApiKeyList").split(",")
NUMBEROFKEYS: int = int(os.getenv('NumberOfGeminiKeys'))
if APIKEYS and NUMBEROFKEYS:
    logger.info("Api keys configure successfully.")
KEYPOSE = 0
keyLock = Lock()

class Gemini:
    """ 
    Gemini is a class that provides an interface to interact with the Gemini API for generating content.
    It manages API keys and handles the generation of content based on the provided task.
    """

    @staticmethod
    async def _geminiWrapper(apiKey: str, task: str) -> str:
        """_ This method is a wrapper around the Gemini API client to generate content based on the provided task.
        Args:
            apiKey (str): The API key to authenticate with the Gemini API.
            task (str): The task or prompt for which content needs to be generated.
        Returns:
            str: The generated content from the Gemini API.
        """
        async with Client(api_key=apiKey).aio as aclient:
            response = await aclient.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=task
            )
            return f"{response.text}"
    
    @staticmethod
    async def geminiAi(task: str) -> str:
        """
        This method manages the API keys and calls the Gemini API wrapper to generate content based on the provided task.
        It ensures that the API keys are used in a round-robin fashion to avoid hitting rate limits.
        Args:
            task (str): The task or prompt for which content needs to be generated.
        Returns:
            str: The generated content from the Gemini API.
        """
        global KEYPOSE
        async with keyLock:
            KEYPOSE = KEYPOSE % NUMBEROFKEYS
            apiKey: str = APIKEYS[KEYPOSE]
            KEYPOSE += 1
        response: str = await Gemini._geminiWrapper(apiKey=apiKey, task=task)
        return response 