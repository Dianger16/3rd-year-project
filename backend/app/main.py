"""
UniGPT API — Main Application
Updated for Supabase + Pinecone Hybrid Stack.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.routers import auth, documents, agent, admin
from app.models.schemas import HealthResponse
from app.services.pinecone_client import pinecone_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("unigpt")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 UniGPT Hybrid API starting...")
    pinecone_client.initialize()
    yield
    logger.info("🛑 UniGPT Hybrid API shutting down...")


app = FastAPI(title="UniGPT", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(agent.router)
app.include_router(admin.router)


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", environment=settings.environment)
