from fastapi import FastAPI
from .routes import health, query, schema

app = FastAPI()

app.include_router(health.router)
app.include_router(query.router)
app.include_router(schema.router)
