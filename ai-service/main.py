import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google.protobuf.json_format import MessageToDict
from pydantic import BaseModel

from config.enviroments import eviroment
from provider.livekit_client import create_room, start_livekit
from util.generate_token_livekit import generate_token
from provider.livekit_client import create_room, launch_bot_for_room, _room_tasks

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello FastAPI"}


@app.post("/create-room")
async def handle_create_room():
    room_data = await create_room()
    # Chuyển đổi Protobuf Object thành Python Dictionary chuẩn
    room_dict = MessageToDict(room_data)
    return room_dict


# tao them endpoint trả token ve cho user ()
class Topic(BaseModel):
    id: str
    title: str
    description: str

class JoinRoomRequest(BaseModel):
    room_name: str
    user_id: str
    user_name: str
    topic: Topic

@app.post("/join-room")
async def join_room(data: JoinRoomRequest):
    token = generate_token(data.room_name, data.user_id, data.user_name)
    launch_bot_for_room(data.room_name,data.topic.model_dump())  # <-- giữ strong reference, không bị GC giữa chừng
    return {"serverUrl": eviroment.LIVEKIT_URL, "participantToken": token}

class EndRoomRequest(BaseModel):
    room_name: str

@app.post("/end-room")
async def end_room(data: EndRoomRequest):
    task = _room_tasks.get(data.room_name)
    if not task:
        return {"success": False, "message": "No active bot"}
    task.cancel()
    result = await task
    return {
        "success": True,
        "session_result": result,
    }