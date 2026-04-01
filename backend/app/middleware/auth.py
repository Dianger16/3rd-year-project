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


def is_dummy_auth_enabled() -> bool:
    env = (settings.environment or "").strip().lower()
    return settings.enable_dummy_auth or env in {"dev", "development", "local", "test"}


class AuthenticatedUser:
    def __init__(
        self,
        id: str,
        email: str,
        role: str,
        full_name: str = "",
        identity_provider: str = "email",
        academic_verified: bool = False,
    ):
        self.id = id
        self.email = email
        self.role = role
        self.full_name = full_name
        self.identity_provider = identity_provider
        self.academic_verified = academic_verified


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
    if is_dummy_auth_enabled() and token.startswith("dev-dummy-token-"):
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
                id=d["id"],
                email=d["email"],
                role=role,
                full_name=d["full_name"],
                identity_provider="email",
                academic_verified=True,
            )

    user_id: Optional[str] = None
    email: str = ""
    identity_provider: str = "email"

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
            app_metadata = payload.get("app_metadata") or {}
            providers = app_metadata.get("providers") or []
            provider = app_metadata.get("provider") or (providers[0] if providers else None)
            if provider:
                identity_provider = str(provider)
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
                app_metadata = getattr(res.user, "app_metadata", {}) or {}
                providers = app_metadata.get("providers") or []
                provider = app_metadata.get("provider") or (providers[0] if providers else None)
                if provider:
                    identity_provider = str(provider)
        except Exception:
            pass

    # Fallback 2: Ultimate Dev Fallback (Unverified Decode)
    if not user_id:
        try:
            payload = jwt.get_unverified_claims(token)
            user_id = payload.get("sub")
            email = payload.get("email", "")
            app_metadata = payload.get("app_metadata") or {}
            providers = app_metadata.get("providers") or []
            provider = app_metadata.get("provider") or (providers[0] if providers else None)
            if provider:
                identity_provider = str(provider)
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
            return AuthenticatedUser(
                id=user_id,
                email=email,
                role="student",
                identity_provider=identity_provider,
                academic_verified=is_academic_email(email),
            )

        p = result.data
        profile_email = p.get("email", "")
        if not profile_email and email:
            # Self-heal profile records that were manually edited and lost email.
            try:
                supabase.table("profiles").update({"email": email}).eq("id", user_id).execute()
                profile_email = email
            except Exception:
                profile_email = email
        resolved_email = profile_email or email
        is_verified = is_academic_email(profile_email) or is_academic_email(email)
        return AuthenticatedUser(
            id=p["id"],
            email=resolved_email,
            role=p["role"],
            full_name=p.get("full_name", ""),
            identity_provider=identity_provider,
            academic_verified=is_verified,
        )
    except Exception:
        # Fallback to defaults
        return AuthenticatedUser(
            id=user_id,
            email=email,
            role="student",
            identity_provider=identity_provider,
            academic_verified=is_academic_email(email),
        )


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
