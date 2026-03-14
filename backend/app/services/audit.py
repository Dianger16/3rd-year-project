"""
Audit Logging Service
Records all significant user actions for compliance and monitoring in Supabase.
"""

from typing import Optional
import logging
import httpx
from app.config import settings
from app.services.supabase_client import get_supabase_admin

logger = logging.getLogger(__name__)

def is_network_error(exc: Exception) -> bool:
    message = str(exc).lower()
    if isinstance(exc, httpx.RequestError):
        return True
    return "getaddrinfo failed" in message or "name or service not known" in message or "nodename nor servname provided" in message

async def log_audit_event(
    user_id: Optional[str],
    action: str,
    payload: dict = None,
    ip_address: Optional[str] = None,
) -> None:
    try:
        if settings.supabase_offline_mode:
            logger.info("[AUDIT] Supabase offline mode enabled. Skipping audit log.")
            return
        supabase = get_supabase_admin()
        supabase.table("audit_logs").insert({
            "user_id": user_id,
            "action": action,
            "payload": payload or {},
            "ip_address": ip_address,
        }).execute()
    except Exception as e:
        if is_network_error(e):
            logger.info("[AUDIT] Supabase unreachable. Skipping audit log.")
            return
        logger.error(f"[AUDIT] Error logging event to Supabase: {e}")
