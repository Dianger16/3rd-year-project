# Copyright (c) 2026 XynaxDev
# Contact: akashkumar.cs27@gmail.com

"""
Document Processing Service
Handles file text extraction, chunking, and HuggingFace embedding generation.
Stores chunks in Pinecone for vector search.
"""

import io
import logging
import re
import threading

from app.config import settings
from app.services.pinecone_client import pinecone_client

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


# â”€â”€â”€ Text Extraction â”€â”€â”€


def extract_text_from_pdf(file_bytes: bytes) -> str:
    import pdfplumber

    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(file_bytes))
    return "\n\n".join(para.text for para in doc.paragraphs if para.text.strip())


def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="replace")


def extract_text(file_bytes: bytes, filename: str) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif lower.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    elif lower.endswith(".txt") or lower.endswith(".md"):
        return extract_text_from_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {filename}")


def is_supported_document(filename: str) -> bool:
    lower = filename.lower()
    return any(lower.endswith(ext) for ext in SUPPORTED_EXTENSIONS)


def derive_document_tags(
    filename: str,
    doc_type: str,
    department: str,
    course: str,
    tags: list[str],
    metadata: dict | None = None,
) -> list[str]:
    metadata = metadata or {}
    normalized: list[str] = []

    def add_tag(value: str | None):
        if not value:
            return
        slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
        if slug and slug not in normalized:
            normalized.append(slug)

    add_tag(doc_type)
    add_tag(department)
    add_tag(course)
    add_tag(filename.rsplit(".", 1)[-1])

    base_name = filename.rsplit(".", 1)[0]
    for token in re.split(r"[\W_]+", base_name):
        if len(token) >= 3:
            add_tag(token)

    for match in re.findall(r"\b[A-Za-z]{2,}\d{2,}\b", f"{filename} {course}"):
        add_tag(match)

    for tag in tags:
        add_tag(tag)

    for key in ("semester", "year", "topic", "audience"):
        value = metadata.get(key)
        if isinstance(value, str):
            add_tag(value)

    return normalized


def derive_route_targets(doc_type: str) -> list[str]:
    """
    Defines which user roles can retrieve a document.
    """
    normalized = (doc_type or "").strip().lower()
    if normalized == "student":
        return ["student", "admin"]
    if normalized == "faculty":
        return ["faculty", "admin"]
    if normalized == "admin":
        return ["admin"]
    return ["admin"]


def derive_route_targets_from_metadata(doc_type: str, metadata: dict | None = None) -> list[str]:
    payload = metadata if isinstance(metadata, dict) else {}
    raw_targets = payload.get("route_targets")
    if isinstance(raw_targets, list):
        normalized = []
        for value in raw_targets:
            text = str(value or "").strip().lower()
            if text and text not in normalized:
                normalized.append(text)
        if normalized:
            return normalized
    return derive_route_targets(doc_type)


# â”€â”€â”€ Text Chunking â”€â”€â”€


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size

        if end < len(text):
            for sep in [". ", "\n\n", "\n", " "]:
                last_sep = text[start:end].rfind(sep)
                if last_sep > chunk_size * 0.5:
                    end = start + last_sep + len(sep)
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap

    return chunks


# â”€â”€â”€ Embedding Model Singleton â”€â”€â”€
_embeddings_model = None
_embeddings_model_lock = threading.Lock()


def get_embeddings_model():
    global _embeddings_model
    if _embeddings_model is not None:
        return _embeddings_model
    if settings.mock_llm:
        return None

    with _embeddings_model_lock:
        if _embeddings_model is not None:
            return _embeddings_model

        from langchain_huggingface import HuggingFaceEmbeddings
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(
            f"Initializing embedding model: {settings.embedding_model_name} on device {device}"
        )

        _embeddings_model = HuggingFaceEmbeddings(
            model_name=settings.embedding_model_name, model_kwargs={"device": device}
        )
    return _embeddings_model


def get_huggingface_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings using HuggingFace sentence-transformers.
    Model: all-MiniLM-L6-v2 (384 dimensions)
    """
    if settings.mock_llm:
        import numpy as np

        return [np.random.randn(384).tolist() for _ in texts]

    model = get_embeddings_model()
    return model.embed_documents(texts)


def get_single_embedding(text: str) -> list[float]:
    if settings.mock_llm:
        import numpy as np

        return np.random.randn(384).tolist()

    model = get_embeddings_model()
    return model.embed_query(text)


# â”€â”€â”€ Full Processing Pipeline â”€â”€â”€


async def process_document(
    file_bytes: bytes,
    filename: str,
    document_id: str,
    doc_type: str,
    department: str,
    course: str,
    tags: list[str],
    metadata: dict = None,
) -> dict:
    if metadata is None:
        metadata = {}

    derived_tags = derive_document_tags(
        filename=filename,
        doc_type=doc_type,
        department=department,
        course=course,
        tags=tags,
        metadata=metadata,
    )
    route_targets = derive_route_targets_from_metadata(doc_type, metadata)

    # 1. Extract & Chunk text
    try:
        full_text = extract_text(file_bytes, filename)
        chunks = chunk_text(full_text)
    except Exception as e:
        logger.error(f"Failed to extract text from {filename}: {e}")
        raise

    if not chunks:
        logger.warning(f"No text extracted from {filename}")
        return {"chunk_count": 0, "embedding_count": 0, "text_length": 0}

    # 2. Generate HuggingFace Embeddings synchronously
    try:
        embeddings = get_huggingface_embeddings(chunks)
    except Exception as e:
        logger.error(f"Failed to generate embeddings for {filename}: {e}")
        raise

    # 3. Upsert to Pinecone
    if pinecone_client.index:
        vectors_to_upsert = []
        for i, (chunk, vector) in enumerate(zip(chunks, embeddings)):
            vector_id = f"doc_{document_id}_chunk_{i}"
            vector_meta = {
                "document_id": document_id,
                "filename": filename,
                "doc_type": doc_type,
                "audience": doc_type,
                "role": doc_type,
                "route_targets": route_targets,
                "department": department or "",
                "course": course or "",
                "tags": derived_tags,
                "chunk_index": i,
                "content": chunk,  # Store actual text content directly in vector DB
            }
            # Inject extra metadata like release_date, deadline if present
            for k, v in metadata.items():
                if isinstance(v, (str, int, float, bool)):
                    vector_meta[k] = v

            vectors_to_upsert.append(
                {"id": vector_id, "values": vector, "metadata": vector_meta}
            )

        # Upsert in batches of 100 for safety
        batch_size = 100
        for i in range(0, len(vectors_to_upsert), batch_size):
            pinecone_client.index.upsert(vectors=vectors_to_upsert[i : i + batch_size])
    else:
        logger.warning(
            f"Pinecone client not initialized. Skipping embedding upsert for {filename}"
        )

    # Note: Document metadata is stored separately in Supabase (handled in the router)

    return {
        "chunk_count": len(chunks),
        "embedding_count": len(embeddings),
        "text_length": len(full_text),
        "tags": derived_tags,
        "route_targets": route_targets,
    }


