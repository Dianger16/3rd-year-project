# Copyright (c) 2026 XynaxDev
# Contact: akashkumar.cs27@gmail.com

from app.middleware.auth import is_academic_email
from app.routers.documents import get_allowed_upload_doc_types
from app.services.document_processor import derive_document_tags, is_supported_document


def test_is_academic_email_matches_configured_domain():
    assert is_academic_email("230101029@krmu.edu.in") is True
    assert is_academic_email("someone@gmail.com") is False


def test_faculty_upload_types_exclude_admin():
    allowed = get_allowed_upload_doc_types("faculty")
    assert "student" in allowed
    assert "faculty" in allowed
    assert "public" in allowed
    assert "admin" not in allowed


def test_supported_document_filters_extensions():
    assert is_supported_document("syllabus.pdf") is True
    assert is_supported_document("outline.docx") is True
    assert is_supported_document("slides.pptx") is False


def test_derive_document_tags_merges_manual_and_inferred_metadata():
    tags = derive_document_tags(
        filename="CS301_Semester1_Syllabus.pdf",
        doc_type="student",
        department="Computer Science",
        course="CS301",
        tags=["Core", "semester-1"],
        metadata={"topic": "Attendance Policy"},
    )

    assert "student" in tags
    assert "computer-science" in tags
    assert "cs301" in tags
    assert "syllabus" in tags
    assert "attendance-policy" in tags


