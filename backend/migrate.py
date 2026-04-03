# Copyright (c) 2026 XynaxDev
# Contact: akashkumar.cs27@gmail.com

import os
from pathlib import Path
from urllib.parse import urlparse

import psycopg2
from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
ENV_FILE = BACKEND_DIR / ".env"
PRIMARY_SCHEMA_FILE = PROJECT_ROOT / "infrastructure" / "supabase" / "migrations" / "001_initial_schema.sql"


def load_environment() -> None:
    load_dotenv(ENV_FILE)


def get_db_params() -> dict:
    db_url = (
        os.getenv("DATABASE_URL")
        or os.getenv("DB_URL")
        or os.getenv("SUPABASE_DB_URL")
    )
    if db_url:
        parsed = urlparse(db_url)
        return {
            "host": parsed.hostname,
            "port": parsed.port or 6543,
            "dbname": (parsed.path or "/postgres").lstrip("/"),
            "user": parsed.username or "postgres",
            "password": parsed.password or "",
            "sslmode": "require",
        }

    return {
        "host": (os.getenv("DB_HOST") or "").strip(),
        "port": int((os.getenv("DB_PORT") or "6543").strip()),
        "dbname": (os.getenv("DB_NAME") or "postgres").strip(),
        "user": (os.getenv("DB_USER") or "postgres").strip(),
        "password": (os.getenv("DB_PASSWORD") or "").strip(),
        "sslmode": "require",
    }


def validate_db_params(db_params: dict) -> None:
    missing = [key for key in ("host", "password") if not db_params.get(key)]
    if missing:
        raise RuntimeError(f"Missing required database settings: {', '.join(missing)}")


def read_schema_sql() -> str:
    if not PRIMARY_SCHEMA_FILE.exists():
        raise FileNotFoundError(f"Schema file not found: {PRIMARY_SCHEMA_FILE}")

    sql = PRIMARY_SCHEMA_FILE.read_text(encoding="utf-8")

    # These lines are dangerous on reruns because they can cascade-drop real tables.
    sanitized_lines = [
        line
        for line in sql.splitlines()
        if "DROP TYPE IF EXISTS doc_type_enum CASCADE;" not in line
        and "DROP TYPE IF EXISTS user_role_enum CASCADE;" not in line
    ]
    return "\n".join(sanitized_lines)


def get_existing_public_tables(cur) -> list[str]:
    cur.execute(
        """
        select tablename
        from pg_tables
        where schemaname = 'public'
        order by tablename
        """
    )
    return [row[0] for row in cur.fetchall()]


def get_public_table_columns(cur, table_name: str) -> set[str]:
    cur.execute(
        """
        select column_name
        from information_schema.columns
        where table_schema = 'public' and table_name = %s
        """,
        (table_name,),
    )
    return {row[0] for row in cur.fetchall()}


def ensure_social_auth_sync(cur) -> None:
    extra_sql = """
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        CASE
          WHEN NEW.raw_user_meta_data->>'role' IN ('student', 'faculty', 'admin')
            THEN (NEW.raw_user_meta_data->>'role')::public.user_role_enum
          ELSE 'student'::public.user_role_enum
        END
      )
      ON CONFLICT (id) DO UPDATE
      SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        role = COALESCE(EXCLUDED.role, public.profiles.role),
        updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    """
    cur.execute(extra_sql)


def ensure_runtime_columns_and_indexes(cur) -> None:
    # Profiles: fields used by auth/profile/export and role-aware UI.
    cur.execute(
        """
        ALTER TABLE public.profiles
          ADD COLUMN IF NOT EXISTS program TEXT,
          ADD COLUMN IF NOT EXISTS semester TEXT,
          ADD COLUMN IF NOT EXISTS section TEXT,
          ADD COLUMN IF NOT EXISTS roll_number TEXT,
          ADD COLUMN IF NOT EXISTS academic_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS identity_provider TEXT,
          ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
        """
    )

    # Documents: fields used by upload pipeline and agent retrieval ordering/filtering.
    cur.execute(
        """
        ALTER TABLE public.documents
          ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW(),
          ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
          ADD COLUMN IF NOT EXISTS file_size BIGINT,
          ADD COLUMN IF NOT EXISTS mime_type TEXT,
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        """
    )
    doc_columns = get_public_table_columns(cur, "documents")
    if "uploaded_at" in doc_columns and "created_at" in doc_columns:
        cur.execute(
            """
            UPDATE public.documents
            SET uploaded_at = COALESCE(uploaded_at, created_at, NOW())
            WHERE uploaded_at IS NULL;
            """
        )
    elif "uploaded_at" in doc_columns:
        cur.execute(
            """
            UPDATE public.documents
            SET uploaded_at = COALESCE(uploaded_at, NOW())
            WHERE uploaded_at IS NULL;
            """
        )

    # Conversations: used by agent upsert payload.
    cur.execute(
        """
        ALTER TABLE public.conversations
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        """
    )

    # Non-destructive indexes to improve dashboard/agent latency.
    if "doc_type" in doc_columns and "created_at" in doc_columns:
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_documents_doc_type_created_at
            ON public.documents (doc_type, created_at DESC);
            """
        )
    if "doc_type" in doc_columns and "uploaded_at" in doc_columns:
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_documents_doc_type_uploaded_at
            ON public.documents (doc_type, uploaded_at DESC);
            """
        )
    if "department" in doc_columns and "course" in doc_columns:
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_documents_department_course
            ON public.documents (department, course);
            """
        )

    audit_columns = get_public_table_columns(cur, "audit_logs")
    if {"user_id", "action", "created_at"}.issubset(audit_columns):
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_created_at
            ON public.audit_logs (user_id, action, created_at DESC);
            """
        )


def migrate() -> None:
    load_environment()
    db_params = get_db_params()
    validate_db_params(db_params)

    print(
        f"Connecting to Supabase Postgres at host='{db_params['host']}', port='{db_params['port']}', db='{db_params['dbname']}'"
    )

    conn = psycopg2.connect(**db_params)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            existing_tables = get_existing_public_tables(cur)
            print(f"Existing public tables: {existing_tables or 'none'}")

            required_tables = {"profiles", "documents", "conversations", "audit_logs", "rag_evaluations"}
            missing_required_tables = required_tables.difference(existing_tables)

            if missing_required_tables:
                print(f"Applying base schema from {PRIMARY_SCHEMA_FILE.name}...")
                cur.execute(read_schema_sql())
            else:
                print("Base schema already present. Skipping full schema apply.")

            print("Ensuring social auth profile sync trigger...")
            ensure_social_auth_sync(cur)

            print("Ensuring runtime columns and indexes...")
            ensure_runtime_columns_and_indexes(cur)

        conn.commit()
        print("Migration completed successfully.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    verify_connection = psycopg2.connect(**db_params)
    verify_connection.autocommit = True
    try:
        with verify_connection.cursor() as cur:
            tables = get_existing_public_tables(cur)
            print("Current public tables:")
            for table in tables:
                print(f" - {table}")
    finally:
        verify_connection.close()


if __name__ == "__main__":
    migrate()


