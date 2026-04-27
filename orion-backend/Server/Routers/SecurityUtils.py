from jose import JWTError, jwt, ExpiredSignatureError
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from Server.Model.models import User
import logging
import dotenv
import os

dotenv.load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")
SECRETKEY: str = os.getenv("SECRETKEY")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

pwdContext: CryptContext = CryptContext(schemes=["argon2"], argon2__time_cost=2, argon2__memory_cost=16384, argon2__parallelism=2)
oauth2Scheme: OAuth2PasswordBearer = OAuth2PasswordBearer(tokenUrl="/login")

class AccessesController:
    """ This class is responsible for handling the security of the application, such as hashing passwords, verifying passwords, 
        creating access tokens, and verifying access tokens.
    """
    
    @staticmethod
    def getPasswordHash(password: str) -> str:
        """ Returns a hashed version of the given password using the CryptContext instance. 
            The hashing algorithm used is Argon2, which is a secure and modern password hashing algorithm.
        
            Args:            
                password (str): The plain text password to be hashed.
            
            Returns:            
                str: The hashed version of the password.
        """
        return pwdContext.hash(password)
    
    @staticmethod
    def verifyPassword(plainPassword: str, hashedPassword: str) -> bool:
        """ Verifies if the given plain text password matches the hashed password using the CryptContext instance.
            
            Args:
                plainPassword (str): The plain text password to be verified.
                hashedPassword (str): The hashed password to compare against.
            
            Returns:
                bool: True if the plain text password matches the hashed password, False otherwise.
        """
        return pwdContext.verify(plainPassword, hashedPassword)
    
    @staticmethod
    def createAccessToken(subject: str, expiresDelta: timedelta | None = None) -> str:
        """ Creates a JSON Web Token (JWT) access token for the given subject (usually the user's email) with an optional expiration time.
            
            Args:
                subject (str): The subject for which the access token is being created, typically the user's
                email or user ID.
                expiresDelta (timedelta | None, optional): The time duration after which the token should expire. If not provided,
                it defaults to 60 minutes.
            
            Returns:
                str: The generated JWT access token as a string.
        """
        toEncode: dict = {"sub": subject}
        expire: datetime = datetime.now(timezone.utc) + (expiresDelta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        toEncode.update({"exp": expire})
        return jwt.encode(toEncode, SECRETKEY, algorithm=ALGORITHM)

    @staticmethod
    def verifyAccessToken(token: str) -> bool:
        """ Verifies the validity of the given JWT access token by decoding it using the SECRETKEY and ALGORITHM.
            It checks if the token is valid and not expired. If the token is valid, it returns True. If the token is expired, 
            it logs the exception and returns False. If the token is invalid for any other reason, it raises an HTTPException with 
            a 401 status code.
            
            Args:
                token (str): The JWT access token to be verified.
            
            Returns:
                bool: True if the token is valid, False if the token is expired. Raises HTTPException if the token is invalid 
                for any other reason.
        """
        try:
            payload = jwt.decode( token, SECRETKEY, algorithms=[ALGORITHM], options={"verify_exp": True} )
            subject = payload.get("sub")
            if subject is None:
                logger.error(f"Error: Invalid token User")
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token User")
            return True
        except ExpiredSignatureError as e:
            logger.exception(f"Exception: Token signature Expired {e}")
            return False
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")


class UserManager: 
    """ This class is responsible for managing user-related operations, such as retrieving a user by email, 
        creating a new user, and getting the current user based on the access token.
    """
    
    @staticmethod
    def getUserByEmail(email: str) -> User | None:
        """ Retrieves a user from the database based on the provided email address. It uses the User model to query the 
            database and returns the first matching user object. If no user is found with the given email, it returns None.
            
            Args:
                email (str): The email address of the user to be retrieved. 
            
            Returns:
                User | None: The user object if found, or None if no user is found with the given email.
        """
        return User.objects(email=email).first()
    
    @staticmethod
    def createUser(name:str, email: str, password: str) -> User:
        """ Creates a new user in the database with the provided name, email, and password. It hashes the password using the
            AccessesController's getPasswordHash method before saving the user to the database. If the user is successfully created,
            it returns the user object. If there is an exception during the user creation process, it logs the exception and still 
            returns the user object, which may be None if the creation failed.
            
            Args:
                name (str): The name of the user to be created.
                email (str): The email address of the user to be created.
                password (str): The plain text password of the user to be created.
            
            Returns:
                User: The created user object. If the creation fails, it may return None.   
        """
        try:
            user: User = User(name=name, email=email, hashedPassword=AccessesController.getPasswordHash(password))
            user.save()
        except Exception as e:
            logger.exception(f"Exception: Cannot Create a User {e}")
        return user
    
    @staticmethod
    def getCurrentUser(token: str = Depends(oauth2Scheme)) -> User:
        """ Retrieves the current user based on the provided JWT access token. It decodes the token to extract the email (subject) and
            then uses the getUserByEmail method to retrieve the user from the database. If the token is invalid or if no user is found
            with the extracted email, it raises an HTTPException with a 401 status code.
            
            Args:
                token (str): The JWT access token provided in the request header, typically in the format "Bearer <token>".
            
            Returns:
                User: The user object corresponding to the email extracted from the token. Raises HTTPException if the token is 
                invalid or if no user is found.
        """
        credentialsException = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, SECRETKEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                raise credentialsException
        except JWTError:
            raise credentialsException

        user = UserManager.getUserByEmail(email)
        if user is None:
            raise credentialsException
        return user

    @staticmethod
    def requestValidator(token: str = Depends(oauth2Scheme)) -> bool:
        """ Validates the incoming request by verifying the provided JWT access token. It uses the AccessesController's verifyAccessToken 
            method to check the validity of the token. If the token is valid, it returns True. If the token is invalid, 
            it raises an HTTPException with a 401 status code.
            
            Args:
                token (str): The JWT access token provided in the request header, typically in the format "Bearer <token>".
            
            Returns:
                bool: True if the token is valid, False if the token is invalid. Raises HTTPException if the token is invalid.
        """
        signal: bool = AccessesController.verifyAccessToken(token)
        return signal