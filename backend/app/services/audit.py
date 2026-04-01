"""
Audit Logging Service
Records significant user actions for monitoring in Supabase.
Audit writes are queued off the request path to keep API latency low.
"""

import asyncio
import logging
from typing import Optional

import httpx

from app.config import settings
from app.services.supabase_client import get_supabase_admin

logger = logging.getLogger(__name__)

def is_network_error(exc: Exception) -> bool:
    message = str(exc).lower()
    if isinstance(exc, httpx.RequestError):
        return True
    return "getaddrinfo failed" in message or "name or service not known" in message or "nodename nor servname provided" in message

def _write_audit_event_sync(
    user_id: Optional[str],
    action: str,
    payload: dict | None = None,
    ip_address: Optional[str] = None,
) -> None:
    supabase = get_supabase_admin()
    supabase.table("audit_logs").insert(
        {
            "user_id": user_id,
            "action": action,
            "payload": payload or {},
            "ip_address": ip_address,
        }
    ).execute()


def _handle_audit_error(exc: Exception) -> None:
    if is_network_error(exc):
        logger.info("[AUDIT] Supabase unreachable. Skipping audit log.")
        return
    logger.error(f"[AUDIT] Error logging event to Supabase: {exc}")


async def log_audit_event(
    user_id: Optional[str],
    action: str,
    payload: dict = None,
    ip_address: Optional[str] = None,
) -> None:
    if settings.supabase_offline_mode:
        logger.info("[AUDIT] Supabase offline mode enabled. Skipping audit log.")
        return

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # Fallback path for non-async contexts.
        try:
            _write_audit_event_sync(user_id, action, payload, ip_address)
        except Exception as exc:
            _handle_audit_error(exc)
        return

    async def _write():
        try:
            await asyncio.to_thread(
                _write_audit_event_sync,
                user_id,
                action,
                payload,
                ip_address,
            )
        except Exception as exc:
            _handle_audit_error(exc)

    loop.create_task(_write())
