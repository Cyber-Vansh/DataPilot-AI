import os
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_community.utilities import SQLDatabase
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import create_sql_query_chain
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

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

@app.post("/query")
async def process_query(request: QueryRequest):
    try:
        db = None
        engine = None

        if request.db_connection.type == 'mysql':
            config = request.db_connection.config

            db_uri = f"mysql+pymysql://{config.get('user')}:{config.get('password')}@{config.get('host')}:{config.get('port', 3306)}/{config.get('database')}"
            db = SQLDatabase.from_uri(db_uri)
        
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


        chain = create_sql_query_chain(llm, db)
        response = chain.invoke({"question": request.question})
        
        cleaned_sql = response
        if "SQLQuery:" in response:
            cleaned_sql = response.split("SQLQuery:")[1]
        
        cleaned_sql = cleaned_sql.strip().replace("```sql", "").replace("```", "").strip()
        
        result = db.run(cleaned_sql)
        
        return {
            "question": request.question,
            "sql": cleaned_sql,
            "data": result
        }

    except Exception as e:
        print(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))
