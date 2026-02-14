from fastapi import APIRouter
import datetime

router = APIRouter()

@router.get("/")
def home():
    print(f"[{datetime.datetime.now()}] Health check received")
    return {"status": "ok"}
