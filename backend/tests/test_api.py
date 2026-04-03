# Copyright (c) 2026 XynaxDev
# Contact: akashkumar.cs27@gmail.com

"""
UniGPT API Tests
Unit and integration tests for core backend endpoints.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import AuthenticatedUser
from app.middleware.rbac import get_allowed_doc_types, is_sensitive_query


client = TestClient(app)


# â”€â”€â”€ Health Tests â”€â”€â”€

class TestHealth:
    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "UniGPT API"


# â”€â”€â”€ RBAC Tests â”€â”€â”€

class TestRBAC:
    def test_student_allowed_doc_types(self):
        types = get_allowed_doc_types("student")
        assert "student" in types
        assert "public" in types
        assert "faculty" not in types
        assert "admin" not in types

    def test_faculty_allowed_doc_types(self):
        types = get_allowed_doc_types("faculty")
        assert "faculty" in types
        assert "public" in types
        assert "student" not in types
        assert "admin" not in types

    def test_admin_allowed_doc_types(self):
        types = get_allowed_doc_types("admin")
        assert "student" in types
        assert "faculty" in types
        assert "admin" in types
        assert "public" in types

    def test_sensitive_query_detection(self):
        assert is_sensitive_query("What are my grades?") is True
        assert is_sensitive_query("Show me my GPA") is True
        assert is_sensitive_query("my transcript please") is True
        assert is_sensitive_query("What is the academic calendar?") is False
        assert is_sensitive_query("Tell me about course policies") is False

    def test_unknown_role_defaults_to_public(self):
        types = get_allowed_doc_types("unknown")
        assert types == ["public"]


# â”€â”€â”€ Auth Tests (with mocks) â”€â”€â”€

class TestAuth:
    def test_signup_requires_body(self):
        response = client.post("/auth/signup", json={})
        assert response.status_code == 422  # Validation error

    def test_login_requires_body(self):
        response = client.post("/auth/login", json={})
        assert response.status_code == 422

    def test_me_requires_auth(self):
        response = client.get("/user/me")
        assert response.status_code == 403  # No auth header


# â”€â”€â”€ Document Tests (with mocks) â”€â”€â”€

class TestDocuments:
    def test_list_documents_requires_auth(self):
        response = client.get("/documents")
        assert response.status_code == 403

    def test_upload_requires_admin(self):
        response = client.post("/admin/documents")
        assert response.status_code == 403


# â”€â”€â”€ Agent Tests (with mocks) â”€â”€â”€

class TestAgent:
    def test_query_requires_auth(self):
        response = client.post("/agent/query", json={"query": "test"})
        assert response.status_code == 403

    def test_history_requires_auth(self):
        response = client.get("/agent/history")
        assert response.status_code == 403


# â”€â”€â”€ Intent Classification Tests â”€â”€â”€

class TestIntentClassification:
    def test_factual_intent(self):
        from app.services.agent_pipeline import classify_intent, IntentType
        assert classify_intent("What are the library hours?") == IntentType.FACTUAL_RETRIEVAL

    def test_policy_intent(self):
        from app.services.agent_pipeline import classify_intent, IntentType
        assert classify_intent("What is the attendance policy?") == IntentType.POLICY_CLARIFICATION

    def test_personal_data_intent(self):
        from app.services.agent_pipeline import classify_intent, IntentType
        assert classify_intent("What are my grades?") == IntentType.PERSONAL_DATA

    def test_admin_action_intent(self):
        from app.services.agent_pipeline import classify_intent, IntentType
        assert classify_intent("Delete user john@university.edu") == IntentType.ADMIN_ACTION


# â”€â”€â”€ Document Processing Tests â”€â”€â”€

class TestDocumentProcessing:
    def test_chunk_text_short(self):
        from app.services.document_processor import chunk_text
        chunks = chunk_text("Short text", chunk_size=1000)
        assert len(chunks) == 1
        assert chunks[0] == "Short text"

    def test_chunk_text_long(self):
        from app.services.document_processor import chunk_text
        # Create a long text
        long_text = "This is a sentence. " * 100
        chunks = chunk_text(long_text, chunk_size=200, overlap=50)
        assert len(chunks) > 1
        # Each chunk should be <= chunk_size (approximately)
        for chunk in chunks:
            assert len(chunk) <= 250  # Allow some flexibility for sentence breaks

    def test_extract_text_txt(self):
        from app.services.document_processor import extract_text
        text = extract_text(b"Hello, world!", "test.txt")
        assert text == "Hello, world!"

    def test_extract_text_unsupported(self):
        from app.services.document_processor import extract_text
        with pytest.raises(ValueError):
            extract_text(b"data", "test.xlsx")


# â”€â”€â”€ Integration Test Simulation â”€â”€â”€

class TestIntegration:
    """
    Simulated integration test:
    Admin uploads doc -> embeddings stored -> student queries -> receives answer.
    (Uses mocks since we don't have a live DB in unit tests)
    """

    def test_integration_scenario_description(self):
        """
        Integration test scenario:
        1. Admin creates account -> uploads a 'student' document
        2. System extracts text, chunks, and stores embeddings
        3. Student logs in -> sends a query
        4. System retrieves role-filtered chunks (student + public only)
        5. Student receives answer with source citations
        6. Student cannot access faculty/admin documents

        This is documented as a test scenario.
        In a real integration test, you would:
        - Start a test database
        - Run the migration
        - Execute these steps against the real API
        """
        # Verify the pipeline components work independently
        from app.services.document_processor import chunk_text
        from app.services.agent_pipeline import classify_intent, IntentType
        from app.middleware.rbac import get_allowed_doc_types

        # Step 1: Document chunking works
        text = "University policy states that all students must maintain a 2.0 GPA."
        chunks = chunk_text(text)
        assert len(chunks) == 1

        # Step 2: Intent classification works
        intent = classify_intent("What is the minimum GPA requirement?")
        assert intent in [IntentType.FACTUAL_RETRIEVAL, IntentType.POLICY_CLARIFICATION]

        # Step 3: Role filtering works
        student_types = get_allowed_doc_types("student")
        assert "admin" not in student_types
        assert "faculty" not in student_types
        assert "student" in student_types
        assert "public" in student_types


