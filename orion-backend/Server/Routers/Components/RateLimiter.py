from Server.RedisCache.RedisConfig import getRedisObject, Redis
from Server.Schemas.RequestResponseModel import SearchRequest, uplodeReq
import logging

logging.basicConfig(level=logging.INFO)
logger: logging = logging.getLogger("uvicorn")

class RateLimiter:
    """ 
    RateLimiter is a class that provides methods to limit the rate of certain actions (like search and upload) for users.
    It uses Redis to keep track of the number of actions performed by each user and enforces limits based on predefined thresholds.
    """
    
    @staticmethod
    async def searchRateLimiter(payload: SearchRequest) -> bool:
        """ This method checks if a user has exceeded the search rate limit. It increments the count of searches for the 
            user in Redis and checks if it exceeds the allowed limit.
        Args:
            payload (SearchRequest): The request payload containing the user ID.
        Returns:
            bool: True if the user is within the search limit, False if the user has exceeded the search limit.
        """
        redis: Redis = getRedisObject()
        User: str = payload.userid
        key = f"{User}search"
        
        count = redis.incr(key)
        
        if count == 1:
            redis.expire(key, 43200)
            logger.info(f"New user at search limit is set user id: {User} he/she have a access permission.")
            return True
        elif count > 10:
            logger.info(f"Max access limit reached at search user id: {User} he/she don't have a access permission.")
            return False
        else:
            logger.info(f"user limit is updated at search user id: {User} he/she have a access permission.")
            return True
    
    @staticmethod
    async def uploadRateLimiter(payload: uplodeReq) -> bool:
        """
        This method checks if a user has exceeded the upload rate limit. It increments the count of uploads for the 
        user in Redis and checks if it exceeds the allowed limit.
        Args:
            payload (uplodeReq): The request payload containing the user ID.
        Returns:
            bool: True if the user is within the upload limit, False if the user has exceeded the upload limit.
        """
        redis: Redis = getRedisObject()
        User: str = payload.userid
        key = f"{User}upload"
        
        count = redis.incr(key)
        
        if count == 1:
            redis.expire(key, 43200)
            logger.info(f"New user at upload limit is set user id: {User} he/she have a access permission.")
            return True
        elif count > 2:
            logger.info(f"Max access limit reached at upload user id: {User} he/she don't have a access permission.")
            return False
        else:
            logger.info(f"user limit is updated at upload user id: {User} he/she have a access permission.")
            return True