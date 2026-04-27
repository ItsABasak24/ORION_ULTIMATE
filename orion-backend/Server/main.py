from Server.DataBase.MongoDBAtlas import establishConnection, terminatedConnection
from fastapi.middleware.cors import CORSMiddleware
from Server.Routers.Controller import AppController
from contextlib import asynccontextmanager
from Server.Routers.routes import router
from fastapi import FastAPI
import asyncio
import dotenv
import os

dotenv.load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    establishConnection()
    borker = asyncio.create_task(AppController.broker())
    vectorCleaner = asyncio.create_task(AppController.Schedulers.vectorCleaner())
    pingMan = asyncio.create_task(AppController.Schedulers.pingMan())
    yield
    borker.cancel()
    vectorCleaner.cancel()
    pingMan.cancel()
    terminatedConnection()

app = FastAPI(title="ORION App", lifespan=lifespan)

GLOBALHOST: str = os.getenv('serverHost')
ALLOWHOST = ["http://localhost:5173", "http://127.0.0.1:5173", GLOBALHOST]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWHOST,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(router)

@app.get("/")
def root():
    return {"message": "Welcome To SRIJAN'S Backend API!"}