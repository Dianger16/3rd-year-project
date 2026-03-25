"""
Authentication Router
Simplified for Supabase Auth integration.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
import random
import httpx
from typing import Any
from app.models.schemas import (
    LoginRequest,
    AuthResponse,
    UserProfile,
    UserRole,
    InitiateSignupRequest,
    VerifySignupRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SignupResponse,
)
from app.middleware.auth import AuthenticatedUser, get_current_user, is_academic_email
from app.config import settings
from app.services.supabase_client import get_supabase_client, get_supabase_admin
from app.services.audit import log_audit_event
from app.services.email_service import EmailService

router = APIRouter(tags=["Authentication"])


def is_network_error(exc: Exception) -> bool:
    message = str(exc).lower()
    if isinstance(exc, httpx.RequestError):
        return True
    return (
        "getaddrinfo failed" in message
        or "name or service not known" in message
        or "temporary failure in name resolution" in message
        or "nodename nor servname provided" in message
    )


def raise_supabase_unreachable() -> None:
    raise HTTPException(
        status_code=503,
        detail="Cannot reach Supabase. Check SUPABASE_URL, DNS/VPN, and internet connectivity.",
    )


def extract_auth_users(users_response: Any) -> list[Any]:
    if isinstance(users_response, list):
        return users_response
    if hasattr(users_response, "users"):
        return list(getattr(users_response, "users") or [])
    if isinstance(users_response, dict) and isinstance(users_response.get("users"), list):
        return users_response["users"]
    return []


def build_oauth_redirect_url() -> str:
    base = settings.frontend_app_url.rstrip("/")
    path = settings.oauth_redirect_path
    if not path.startswith("/"):
        path = f"/{path}"
    return f"{base}{path}"


def extract_identity_provider(auth_user: Any = None) -> str:
    if auth_user is not None:
        app_metadata = getattr(auth_user, "app_metadata", {}) or {}
        providers = app_metadata.get("providers") or []
        if providers:
            return providers[0]
    return "email"


def build_user_profile(profile: dict, auth_user: Any = None) -> UserProfile:
    email = profile.get("email", "")
    return UserProfile(
        id=profile["id"],
        email=email,
        full_name=profile.get("full_name", "User"),
        role=UserRole(profile.get("role", "student")),
        department=profile.get("department"),
        created_at=str(profile.get("created_at")) if profile.get("created_at") else None,
        academic_verified=is_academic_email(email),
        identity_provider=extract_identity_provider(auth_user),
    )


@router.post("/auth/signup", response_model=SignupResponse)
async def signup(request: Request, body: InitiateSignupRequest):
    """
    Initiate signup with custom 6-digit OTP and bypass Supabase default email.
    """
    try:
        admin = get_supabase_admin()

        # 1. Generate 6-digit OTP
        otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])

        # 2. Check if user already exists in Auth
        users_resp = extract_auth_users(admin.auth.admin.list_users())
        existing_auth_user = next(
            (u for u in users_resp if u.email == body.email), None
        )

        if existing_auth_user:
            user_metadata = existing_auth_user.user_metadata or {}
            # If already verified, they really exist - block it
            if user_metadata.get("is_verified", False):
                raise HTTPException(
                    status_code=400,
                    detail="An account with this email already exists inside UniGPT. Please try logging in.",
                )

            # If NOT verified, update their record with new OTP and metadata
            user_id = existing_auth_user.id
            admin.auth.admin.update_user_by_id(
                user_id,
                {
                    "password": body.password,
                    "user_metadata": {
                        "full_name": body.full_name,
                        "role": body.role.value
                        if hasattr(body.role, "value")
                        else body.role,
                        "department": body.department,
                        "otp_code": otp_code,
                        "is_verified": False,
                    },
                },
            )
        else:
            # Create new unverified user (Confirmed=True skips default email)
            auth_res = admin.auth.admin.create_user(
                {
                    "email": body.email,
                    "password": body.password,
                    "email_confirm": True,
                    "user_metadata": {
                        "full_name": body.full_name,
                        "role": body.role.value
                        if hasattr(body.role, "value")
                        else body.role,
                        "department": body.department,
                        "otp_code": otp_code,
                        "is_verified": False,
                    },
                }
            )
            user_id = auth_res.user.id

        # 3. Log audit event (Use user_id=None to avoid Profile FK error)
        await log_audit_event(
            user_id=None,
            action="signup_initiated",
            payload={"target_user_id": user_id, "email": body.email},
        )

        # 4. Send professional OTP email with REAL code
        try:
            EmailService.send_otp_email(
                receiver_email=body.email, otp=otp_code, user_name=body.full_name
            )
        except Exception as smtp_error:
            raise HTTPException(
                status_code=502,
                detail=f"OTP email delivery failed: {smtp_error}",
            )

        return SignupResponse(
            message="Verification email dispatched with your secure code.",
            email=body.email,
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        if is_network_error(e):
            raise_supabase_unreachable()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auth/login", response_model=AuthResponse)
async def login(request: Request, body: LoginRequest):
    """Login with email/password via Supabase (optional dummy auth only when enabled)."""
    # 1. Optional dummy credentials for local development only
    dummy_accounts = {
        "admin@unigpt.edu": {
            "pass": "admin-password-123",
            "role": "admin",
            "name": "Admin User",
            "dept": "Administration",
        },
        "faculty@unigpt.edu": {
            "pass": "faculty-password-123",
            "role": "faculty",
            "name": "Dr. Priya Sharma",
            "dept": "Computer Science",
        },
        "student@unigpt.edu": {
            "pass": "student-password-123",
            "role": "student",
            "name": "Akash Kumar",
            "dept": "Computer Science",
        },
    }

    if (
        settings.enable_dummy_auth
        and (
        body.email in dummy_accounts
        and body.password == dummy_accounts[body.email]["pass"]
        )
    ):
        acc = dummy_accounts[body.email]
        return AuthResponse(
            access_token="dev-dummy-token-" + acc["role"],
            user=UserProfile(
                id="dummy-id-" + acc["role"],
                email=body.email,
                full_name=acc["name"],
                role=UserRole(acc["role"]),
                department=acc["dept"],
                academic_verified=True,
                identity_provider="email",
            ),
        )

    # 2. Attempt real Supabase auth
    try:
        supabase = get_supabase_client()
        auth_res = supabase.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )

        if not auth_res.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user_id = auth_res.user.id

        # Fetch profile from Supabase
        admin = get_supabase_admin()
        profile = admin.table("profiles").select("*").eq("id", user_id).execute()

        if not profile.data:
            user_data = auth_res.user.user_metadata or {}
            p = {
                "id": user_id,
                "email": auth_res.user.email,
                "full_name": user_data.get("full_name", "User"),
                "role": user_data.get("role", "student"),
                "department": user_data.get("department", "General"),
            }
            try:
                admin.table("profiles").insert(p).execute()
            except Exception:
                pass  # Profile might exist but select failed
        else:
            p = profile.data[0]

        await log_audit_event(
            user_id=user_id,
            action="login",
            ip_address=request.client.host if request.client else None,
        )

        if not auth_res.session:
            raise HTTPException(
                status_code=401, detail="Authentication failed: No session"
            )

        return AuthResponse(
            access_token=auth_res.session.access_token,
            user=build_user_profile(p, auth_res.user),
        )
    except HTTPException:
        raise
    except Exception as e:
        if is_network_error(e):
            raise_supabase_unreachable()
        message = str(e).lower()
        if "invalid login credentials" in message or "email not confirmed" in message:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auth/verify", response_model=AuthResponse)
async def verify_signup(request: Request, body: VerifySignupRequest):
    """Verify signup OTP, then issue a real Supabase session token."""
    try:
        admin = get_supabase_admin()

        # 1. Find user to check OTP
        users_res = extract_auth_users(admin.auth.admin.list_users())
        target_user = next((u for u in users_res if u.email == body.email), None)

        if not target_user:
            raise HTTPException(
                status_code=400, detail="User not found. Please sign up first."
            )

        user_metadata = target_user.user_metadata or {}
        stored_otp = user_metadata.get("otp_code")

        # 2. OTP Check (with Dev Bypass)
        is_verified = False
        if body.otp == "123456":
            is_verified = True
        elif stored_otp and body.otp == stored_otp:
            is_verified = True

        if not is_verified:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        user_id = target_user.id

        # 3. Update user metadata to verified
        admin.auth.admin.update_user_by_id(
            user_id, {"user_metadata": {**user_metadata, "is_verified": True}}
        )

        # 4. Check/Create profile (ensure it's there)
        profile_res = admin.table("profiles").select("*").eq("id", user_id).execute()
        if not profile_res.data:
            admin.table("profiles").insert(
                {
                    "id": user_id,
                    "email": body.email,
                    "full_name": user_metadata.get("full_name", "User"),
                    "role": user_metadata.get("role", "student"),
                    "department": user_metadata.get("department"),
                }
            ).execute()
            p = {
                "id": user_id,
                "email": body.email,
                "full_name": user_metadata.get("full_name", "User"),
                "role": user_metadata.get("role", "student"),
                "department": user_metadata.get("department"),
            }
        else:
            p = profile_res.data[0]

        # 5. Issue real session token so frontend has a cloud-authenticated login immediately.
        supabase = get_supabase_client()
        session_res = supabase.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
        if not session_res.user or not session_res.session:
            raise HTTPException(
                status_code=401,
                detail="Email verified, but sign-in failed. Please log in with your password.",
            )

        await log_audit_event(
            user_id=user_id,
            action="verify_signup",
            ip_address=request.client.host if request.client else None,
        )
        return AuthResponse(
            access_token=session_res.session.access_token,
            user=build_user_profile(
                {
                    "id": p["id"],
                    "email": p.get("email", body.email),
                    "full_name": p.get("full_name", "User"),
                    "role": p.get("role", "student"),
                    "department": p.get("department"),
                    "created_at": p.get("created_at"),
                },
                session_res.user,
            ),
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        if is_network_error(e):
            raise_supabase_unreachable()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    """Send OTP for password recovery."""
    try:
        supabase = get_supabase_client()
        supabase.auth.reset_password_for_email(body.email)
        return {"status": "success", "message": "Recovery OTP sent if email exists"}
    except Exception as e:
        if is_network_error(e):
            raise_supabase_unreachable()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auth/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """Verify OTP and update password."""
    try:
        supabase = get_supabase_client()
        # Verify the OTP
        auth_res = supabase.auth.verify_otp(
            {"email": body.email, "token": body.otp, "type": "recovery"}
        )

        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Invalid OTP")

        # Update user's password using the new session
        supabase.auth.update_user({"password": body.new_password})

        await log_audit_event(user_id=auth_res.user.id, action="reset_password")
        return {"status": "success", "message": "Password updated successfully"}
    except Exception as e:
        if is_network_error(e):
            raise_supabase_unreachable()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/auth/google")
async def google_auth():
    """Returns the authorization URL for Google OAuth."""
    try:
        supabase = get_supabase_client()
        res = supabase.auth.sign_in_with_oauth(
            {
                "provider": "google",
                "options": {"redirect_to": build_oauth_redirect_url()},
            }
        )
        return {"url": res.url}
    except Exception as e:
        if is_network_error(e):
            raise_supabase_unreachable()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/auth/microsoft")
async def microsoft_auth():
    """Returns the authorization URL for Microsoft OAuth via Supabase Azure provider."""
    try:
        supabase = get_supabase_client()
        res = supabase.auth.sign_in_with_oauth(
            {
                "provider": "azure",
                "options": {
                    "redirect_to": build_oauth_redirect_url(),
                    "scopes": "email profile openid",
                },
            }
        )
        return {"url": res.url}
    except Exception as e:
        if is_network_error(e):
            raise_supabase_unreachable()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/user/me", response_model=UserProfile)
async def get_me(user: AuthenticatedUser = Depends(get_current_user)):
    """Return the current user profile from the authenticated JWT context."""
    return UserProfile(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=UserRole(user.role),
        academic_verified=is_academic_email(user.email) or user.id.startswith("dummy-id-"),
        identity_provider="email",
    )
