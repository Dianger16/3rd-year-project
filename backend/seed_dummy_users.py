# Copyright (c) 2026 XynaxDev
# Contact: akashkumar.cs27@gmail.com

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from parent directory
load_dotenv(dotenv_path="../.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env")
    exit(1)

supabase: Client = create_client(url, key)

dummy_users = [
    {
        "email": "admin@unigpt.edu",
        "password": "admin-password-123",
        "data": {"full_name": "System Admin", "role": "admin", "department": "IT"}
    },
    {
        "email": "faculty@unigpt.edu",
        "password": "faculty-password-123",
        "data": {"full_name": "Professor X", "role": "faculty", "department": "Science"}
    },
    {
        "email": "student@unigpt.edu",
        "password": "student-password-123",
        "data": {"full_name": "John Doe", "role": "student", "department": "Computer Science"}
    }
]

print(f"Connecting to {url}...")

for user in dummy_users:
    print(f"Seeding {user['email']}...")
    try:
        # 1. Create User in Auth
        res = supabase.auth.admin.create_user({
            "email": user["email"],
            "password": user["password"],
            "email_confirm": True,
            "user_metadata": user["data"]
        })
        print(f"Successfully created {user['email']}")
        
        # 2. Add to profiles/users table if necessary
        # Assuming database_schema.sql has been applied and RLS allows this or admin bypasses
        # Usually Supabase handles this via triggers if set up, but let's do it manually just in case
        user_id = res.user.id
        supabase.table("profiles").upsert({
            "id": user_id,
            "email": user["email"],
            "full_name": user["data"]["full_name"],
            "role": user["data"]["role"],
            "department": user["data"]["department"]
        }).execute()
        print(f"Updated profile for {user['email']}")
        
    except Exception as e:
        if "already exists" in str(e).lower() or "already registered" in str(e).lower():
            print(f"User {user['email']} already exists. Skipping.")
        else:
            print(f"Error seeding {user['email']}: {e}")

print("Seeding complete.")


