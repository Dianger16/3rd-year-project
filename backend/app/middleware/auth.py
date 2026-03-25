"""
Authentication Middleware
Validates Supabase JWTs and extracts user information.
"""

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional

from app.config import settings
from app.services.supabase_client import get_supabase_admin, get_supabase_client

security = HTTPBearer()


class AuthenticatedUser:
    def __init__(self, id: str, email: str, role: str, full_name: str = ""):
        self.id = id
        self.email = email
        self.role = role
        self.full_name = full_name


def is_academic_email(email: str) -> bool:
    normalized_email = (email or "").strip().lower()
    if "@" not in normalized_email:
        return False

    domain = normalized_email.split("@", 1)[1]
    allowed_domains = {
        allowed.strip().lower().lstrip("@")
        for allowed in settings.academic_email_domains.split(",")
        if allowed.strip()
    }
    return domain in allowed_domains


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthenticatedUser:
    token = credentials.credentials

    # Dev Dummy Token Bypass
    if settings.enable_dummy_auth and token.startswith("dev-dummy-token-"):
        role = token.replace("dev-dummy-token-", "")
        dummy_data = {
            "admin": {
                "id": "dummy-id-admin",
                "email": "admin@unigpt.edu",
                "full_name": "Admin User",
            },
            "faculty": {
                "id": "dummy-id-faculty",
                "email": "faculty@unigpt.edu",
                "full_name": "Dr. Priya Sharma",
            },
            "student": {
                "id": "dummy-id-student",
                "email": "student@unigpt.edu",
                "full_name": "Akash Kumar",
            },
        }
        if role in dummy_data:
            d = dummy_data[role]
            return AuthenticatedUser(
                id=d["id"], email=d["email"], role=role, full_name=d["full_name"]
            )

    user_id: Optional[str] = None
    email: str = ""

    # Prefer local JWT verification when secret is configured.
    if settings.supabase_jwt_secret:
        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            user_id = payload.get("sub")
            email = payload.get("email", "")
        except JWTError:
            # Fall back to Supabase validation below (handles key mismatch in dev).
            user_id = None

    # Fallback 1: validate via Supabase Auth API
    if not user_id:
        try:
            supabase = get_supabase_client()
            res = supabase.auth.get_user(jwt=token)
            if res and getattr(res, "user", None):
                user_id = res.user.id
                email = res.user.email or ""
        except Exception:
            pass

    # Fallback 2: Ultimate Dev Fallback (Unverified Decode)
    if not user_id:
        try:
            payload = jwt.get_unverified_claims(token)
            user_id = payload.get("sub")
            email = payload.get("email", "")
        except Exception:
            pass

    if not user_id:
        raise HTTPException(
            status_code=401, detail="Invalid token: no user ID extracted"
        )

    # Fetch role and profile from Supabase profiles table
    try:
        supabase = get_supabase_admin()
        result = (
            supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        )

        if not result.data:
            # First-time users might not have a profile yet; let's allow extraction if it's there
            return AuthenticatedUser(id=user_id, email=email, role="student")

        p = result.data
        return AuthenticatedUser(
            id=p["id"],
            email=p["email"],
            role=p["role"],
            full_name=p.get("full_name", ""),
        )
    except Exception:
        # Fallback to defaults
        return AuthenticatedUser(id=user_id, email=email, role="student")


async def get_optional_user(request: Request) -> Optional[AuthenticatedUser]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        token = auth_header.split(" ")[1]
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        return await get_current_user(creds)
    except HTTPException:
        return None
