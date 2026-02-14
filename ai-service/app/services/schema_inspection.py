from sqlalchemy import inspect
from ..models import DBConnection
from .db_utils import get_engine
import json
from langchain_google_genai import ChatGoogleGenerativeAI
import os

api_key = os.getenv("GOOGLE_API_KEY")
llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0, google_api_key=api_key)

def get_schema_info_service(db_connection: DBConnection):
    engine = get_engine(db_connection)
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    tables = []
    relationships = []
    
    for table_name in table_names:
        columns = []
        for col in inspector.get_columns(table_name):
            columns.append({
                "name": col['name'],
                "type": str(col['type'])
            })
        tables.append({
            "name": table_name,
            "columns": columns
        })
        
        try:
            fks = inspector.get_foreign_keys(table_name)
            for fk in fks:
                relationships.append({
                    "from": table_name,
                    "to": fk['referred_table'],
                    "cols": fk['constrained_columns'],
                    "refCols": fk['referred_columns']
                })
        except Exception as e:
            print(f"Error fetching foreign keys for {table_name}: {e}")
        
    return {"tables": tables, "relationships": relationships}

def suggest_questions_service(db_connection: DBConnection):
    engine = get_engine(db_connection)
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    schema_summary = []
    for table_name in table_names:
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        schema_summary.append(f"Table: {table_name}, Columns: {', '.join(columns)}")
    
    schema_str = "\n".join(schema_summary)
    
    prompt = f"""
    Analyze the following database schema:
    {schema_str}

    Generate 3 diverse, interesting, and valid natural language questions a user might ask about this data.
    Return ONLY a JSON list of strings, e.g., ["Question 1?", "Question 2?", "Question 3?"].
    Do not output any markdown formatting or explanations.
    """
    
    response = llm.invoke(prompt)
    content = response.content.strip()
    
    try:
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        questions = json.loads(content)
        return {"questions": questions}
    except Exception as e:
        print(f"Error parsing questions: {content}, Error: {e}")
        return {"questions": [
            "Show me the first 5 rows of data",
            "Count the total number of records",
            "List all tables in the database"
        ]}
