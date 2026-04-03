# Copyright (c) 2026 XynaxDev
# Contact: akashkumar.cs27@gmail.com

from supabase import create_client, Client
from app.config import settings

def get_supabase_client() -> Client:
    """Client for browser/anon operations."""
    return create_client(settings.supabase_url, settings.supabase_anon_key)

def get_supabase_admin() -> Client:
    """Client for admin/service-role operations."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


