from fastapi import APIRouter, status, Depends, HTTPException
from Server.Routers.Components.RateLimiter import RateLimiter
from Server.Routers.SecurityUtils import UserManager
from Server.Routers.Controller import AppController
from Server.Schemas.RequestResponseModel import (
    SearchRequest, SearchResponse, UserCreateReq,
    UserLoginRes, UserCreateRes, UserLoginReq, uplodeReq,
    uplodeRes, uplodeStatusReq, uplodeStatusRes
)
from Server.Model.models import User
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")
router = APIRouter(prefix="/orion/api/v1", tags=["ORION"])

@router.post("/signup", response_model=UserCreateRes, status_code=status.HTTP_201_CREATED)
def signup(UserIn: UserCreateReq) -> UserCreateRes:
    """ Endpoint for user registration. It accepts a UserCreateReq object containing the user's name, email, and password.
        It calls the AppController's _signup method to handle the registration logic, which includes hashing the password and 
        saving the user to the database. If the registration is successful, it returns a UserCreateRes object containing the 
        user's id, name, email, and creation timestamp. If there is an error during registration, it raises an HTTPException with 
        a 400 status code.
    
        Args:
            UserIn (UserCreateReq): The request body containing the user's name, email, and password for registration.
        
        Returns:
            UserCreateRes: The response model containing the user's id, name, email, and creation timestamp if registration is successful. 
            Raises HTTPException if there is an error during registration.
    """
    return AppController._signup(UserIn=UserIn)

@router.post("/login", response_model=UserLoginRes, status_code=status.HTTP_200_OK)
def login(UserIn: UserLoginReq) -> UserLoginRes:
    """ Endpoint for user login. It accepts a UserLoginReq object containing the user's email and password. It calls the AppController's 
        _login method to handle the login logic, which includes verifying the user's credentials and generating a JWT access token if the 
        credentials are valid. If the login is successful, it returns a UserLoginRes object containing the access token and token type. If 
        there is an error during login (e.g., invalid credentials), it raises an HTTPException with a 401 status code.
    
        Args:
            UserIn (UserLoginReq): The request body containing the user's email and password for login.
        
        Returns:
            UserLoginRes: The response model containing the access token and token type if login is successful. 
            Raises HTTPException if there is an error during login.
    """
    return AppController._login(UserIn=UserIn)

@router.get("/users/me", response_model=UserCreateRes)
def userMe(currentUser: User = Depends(UserManager.getCurrentUser), signal: bool = Depends(UserManager.requestValidator)) -> UserCreateRes:
    """ Endpoint to retrieve the current user's information. It uses the getCurrentUser method from UserManager to get the current user 
        based on the access token provided in the request header. It also uses the requestValidator method to validate the access token.
        If the token is valid, it returns a UserCreateRes object containing the user's id, name, email, and creation timestamp. 
        If the token is invalid or expired, it raises an HTTPException with a 401 status code.
    
         Args:
            currentUser (User): The current user object retrieved using the getCurrentUser method. This is automatically injected by 
            FastAPI's dependency injection system.
            signal (bool): A boolean value indicating whether the access token is valid, obtained from the requestValidator method.
        
         Returns:
            UserCreateRes: The response model containing the user's id, name, email, and creation timestamp if the token is valid. 
            Raises HTTPException if the token is invalid or expired.
    """
    if signal:
        return UserCreateRes(id=str(currentUser.id), name=currentUser.name, email=currentUser.email, createdAt=currentUser.createdAt)
    else:
         raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail="Toke Expired login again!")

@router.post("/upload", response_model=uplodeRes, status_code=status.HTTP_201_CREATED)
async def Upload(paylode: uplodeReq, signal: bool = Depends(UserManager.requestValidator)):
    """ Endpoint for uploading data. It accepts an uplodeReq object containing the data to be uploaded. It uses the requestValidator 
        method to validate the access token provided in the request header. If the token is valid, it checks the upload rate limit
        using the RateLimiter's uploadRateLimiter method. If the rate limit is not exceeded, it calls the AppController's _upload method 
        to handle the upload logic and returns an uplodeRes object containing the session id and a success message. If the rate limit is 
        exceeded, it raises an HTTPException with a 429 status code. If the token is invalid or expired, it raises an HTTPException with 
        a 401 status code.
    
         Args:
            paylode (uplodeReq): The request body containing the data to be uploaded.
            signal (bool): A boolean value indicating whether the access token is valid, obtained from the requestValidator method.
        
         Returns:
            uplodeRes: The response model containing the session id and a success message if the upload
            is successful. Raises HTTPException if the rate limit is exceeded or if the token is invalid or expired.
    """
    if signal:
        if await RateLimiter.uploadRateLimiter(payload=paylode):
            return await AppController._upload(paylode)
        else:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Limit reached Try again after 12 hours later.")
    else:
         raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail="Toke Expired login again!")

@router.post("/upload-status", response_model=uplodeStatusRes, status_code=status.HTTP_200_OK)
async def uploadStatus(paylode: uplodeStatusReq, signal: bool = Depends(UserManager.requestValidator)):
    """ Endpoint to check the status of an upload session. It accepts an uplodeStatusReq object containing the session id. It uses the 
        requestValidator method to validate the access token provided in the request header. If the token is valid, it calls the 
        AppController's _uploadStatus method to check the status of the upload session and returns an uplodeStatusRes object containing 
        the session id and the status of the upload. If the token is invalid or expired, it raises an HTTPException with a 401 status code.
    
         Args:
            paylode (uplodeStatusReq): The request body containing the session id for which to check the upload status.
            signal (bool): A boolean value indicating whether the access token is valid, obtained from the requestValidator method.
        
         Returns:
            uplodeStatusRes: The response model containing the session id and the status of the upload if the token is valid. 
            Raises HTTPException if the token is invalid or expired.
    """
    if signal:
        statusValu: bool = await AppController._uploadStatus(payload=paylode) 
        return {"sessionid" : paylode.sessionid, "status": statusValu}
    else:
         raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail="Toke Expired login again!")

@router.post("/search", response_model=SearchResponse, status_code=status.HTTP_200_OK)
async def search(payload: SearchRequest, signal: bool = Depends(UserManager.requestValidator)):
    """ Endpoint for performing a search operation. It accepts a SearchRequest object containing the search query and parameters. It uses the 
        requestValidator method to validate the access token provided in the request header. If the token is valid, it checks the search 
        rate limit using the RateLimiter's searchRateLimiter method. If the rate limit is not exceeded, it calls the AppController's _search 
        method to perform the search operation and returns a SearchResponse object containing the search results. If the rate limit is
        exceeded, it raises an HTTPException with a 429 status code. If the token is invalid or expired, it raises an HTTPException with a 401 status code.
    
         Args:
            payload (SearchRequest): The request body containing the search query and parameters.
            signal (bool): A boolean value indicating whether the access token is valid, obtained from the requestValidator method.
        
         Returns:
            SearchResponse: The response model containing the search results if the token is valid and rate limit is not exceeded. 
            Raises HTTPException if the rate limit is exceeded or if the token is invalid or expired.
    """
    if signal:
        if await RateLimiter.searchRateLimiter(payload=payload):
            response: dict = await AppController._search(payload=payload)
            return SearchResponse(response=response)
        else:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Limit reached Try again after 12 hours later.")
    else:
         raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail="Toke Expired login again!")