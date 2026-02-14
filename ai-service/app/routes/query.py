from fastapi import APIRouter
from ..models import QueryRequest
from ..services.sql_generation import generate_sql_response

router = APIRouter()

@router.post("/query")
async def process_query(request: QueryRequest):
    return await generate_sql_response(request)
