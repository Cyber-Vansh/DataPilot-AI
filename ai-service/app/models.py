from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DBConnection(BaseModel):
    type: str
    config: Dict[str, Any]

class QueryRequest(BaseModel):
    question: str
    db_connection: DBConnection
    history: List[str] = []

class SchemaRequest(BaseModel):
    db_connection: DBConnection
