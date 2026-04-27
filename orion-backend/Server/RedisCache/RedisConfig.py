from upstash_redis import Redis
import logging
import dotenv
import os

dotenv.load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

url: str = os.getenv('UPSTASH_REDIS_URL')
token: str = os.getenv('UPSTASH_REDIS_TOKEN')

if url and token:
    logger.info("Success: Redis Configurations Set Successfully.")
    try:
        RedisObject: Redis = Redis(url=url, token=token)
        logger.info("Status: Redis Connection Established Successfully.")
    except Exception as e:
        logger.exception(f"Exception: {e}")
else:
    logger.error("Error: Redis Configurations Not Found")
    RedisObject = None
    
def getRedisObject() -> Redis:
    """ Returns the RedisObject if it is successfully created, otherwise returns None. """
    return RedisObject 