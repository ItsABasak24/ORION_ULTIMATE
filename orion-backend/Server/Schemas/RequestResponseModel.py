from pydantic import BaseModel, EmailStr
from datetime import datetime
 
""" This module defines the request and response models for the API endpoints. These models are used to validate and structure the data sent 
    in requests and received in responses. Each model corresponds to a specific endpoint and contains the necessary fields for that endpoint's functionality. 
    The models include UserCreateReq, UserCreateRes, UserLoginReq, UserLoginRes, uplodeReq, uplodeRes, uplodeStatusReq, uplodeStatusRes, SearchRequest, and SearchResponse. 
    Each model is defined as a subclass of Pydantic BaseModel, which provides data validation and serialization capabilities. The fields in each model are defined with their 
    respective types, and some fields have additional validation (e.g., EmailStr for email fields). These models help ensure that the API receives and returns data in the 
    expected format, improving the robustness and reliability of the API.
 """
 
class UserCreateReq(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserCreateRes(BaseModel):
    id: str
    name: str
    email: EmailStr
    createdAt: datetime

class UserLoginReq(BaseModel):
    name: str
    email: EmailStr
    password: str
    
class UserLoginRes(BaseModel):
    accessToken: str
    tokenType: str
    id: str
    name: str
    email: EmailStr
    createdAt: datetime

class uplodeReq(BaseModel):
    userid: str
    sessionid: str | None = None
    url: str
    
class uplodeRes(BaseModel):
    userid: str
    sessionid: str
    status: str
    
class uplodeStatusReq(BaseModel):
    sessionid: str
    
class uplodeStatusRes(BaseModel):
    sessionid: str
    status: bool | None

class SearchRequest(BaseModel):
    userid: str
    sessionid: str
    query: str

class SearchResponse(BaseModel):
    response: dict
