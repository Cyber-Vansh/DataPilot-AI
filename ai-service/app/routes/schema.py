from fastapi import APIRouter, HTTPException
from ..models import SchemaRequest
from ..services.schema_inspection import get_schema_info_service, suggest_questions_service

router = APIRouter()

@router.post("/schema")
async def get_schema(request: SchemaRequest):
    try:
        return get_schema_info_service(request.db_connection)
    except Exception as e:
        print(f"Error fetching schema: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggest_questions")
async def suggest_questions(request: SchemaRequest):
    try:
        return suggest_questions_service(request.db_connection)
    except Exception as e:
        print(f"Error suggesting questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
