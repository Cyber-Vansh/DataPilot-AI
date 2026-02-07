import os
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_community.utilities import SQLDatabase
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import create_sql_query_chain
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.pool import StaticPool
import datetime
from decimal import Decimal

app = FastAPI()

api_key = os.getenv("GOOGLE_API_KEY")
llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0, google_api_key=api_key)

class DBConnection(BaseModel):
    type: str
    config: dict

class QueryRequest(BaseModel):
    question: str
    db_connection: DBConnection

@app.get("/")
def home():
    return {"status": "ok"}

def serialize_value(value):
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value

@app.post("/query")
async def process_query(request: QueryRequest):
    try:
        db = None
        engine = None

        if request.db_connection.type == 'mysql':
            config = request.db_connection.config
            db_uri = f"mysql+pymysql://{config.get('user')}:{config.get('password')}@{config.get('host')}:{config.get('port', 3306)}/{config.get('database')}"
            
            engine = create_engine(db_uri)
            db = SQLDatabase(engine)
        
        elif request.db_connection.type == 'csv':
            csv_path = request.db_connection.config.get('csvPath') 
            filename = os.path.basename(csv_path)
            full_path = f"/app/uploads/{filename}"
            
            engine = create_engine(
                "sqlite://", 
                poolclass=StaticPool,
                connect_args={"check_same_thread": False}
            )
            
            df = pd.read_csv(full_path)
            df.to_sql("data", engine, index=False, if_exists='replace')
            
            db = SQLDatabase(engine)

        else:
             raise HTTPException(status_code=400, detail="Invalid database type")


        chain = create_sql_query_chain(llm, db, k=1000)
        response = chain.invoke({"question": request.question})
        
        cleaned_sql = response
        if "SQLQuery:" in response:
            cleaned_sql = response.split("SQLQuery:")[1]
        
        cleaned_sql = cleaned_sql.strip().replace("```sql", "").replace("```", "").strip()
        
        result_data = []
        with engine.connect() as connection:
            result_proxy = connection.execute(text(cleaned_sql))
            if result_proxy.returns_rows:
                keys = result_proxy.keys()
                result_data = [
                    {key: serialize_value(value) for key, value in zip(keys, row)}
                    for row in result_proxy.fetchall()
                ]
        
        return {
            "question": request.question,
            "sql": cleaned_sql,
            "data": result_data
        }

    except Exception as e:
        print(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))
