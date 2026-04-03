# Copyright (c) 2026 XynaxDev
# Contact: akashkumar.cs27@gmail.com

from pinecone import Pinecone, ServerlessSpec
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class PineconeClient:
    def __init__(self):
        self.pc = None
        self.index = None

    def initialize(self):
        if not settings.pinecone_api_key:
            logger.warning("Pinecone API key not set. Vector DB operations will fail.")
            return

        try:
            self.pc = Pinecone(api_key=settings.pinecone_api_key)
            
            # Create index if it doesn't exist (assuming 384 dims for all-MiniLM-L6-v2)
            if settings.pinecone_index_name not in self.pc.list_indexes().names():
                logger.info(f"Creating Pinecone index: {settings.pinecone_index_name}")
                self.pc.create_index(
                    name=settings.pinecone_index_name,
                    dimension=384,
                    metric='cosine',
                    spec=ServerlessSpec(
                        cloud='aws',
                        region='us-east-1' # Default for free tier, adapt as needed
                    )
                )
            self.index = self.pc.Index(settings.pinecone_index_name)
            logger.info(f"Pinecone connected to index: {settings.pinecone_index_name}")
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {str(e)}")

# Singleton instance
pinecone_client = PineconeClient()


