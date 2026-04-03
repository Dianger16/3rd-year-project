import datetime
import re
from typing import Any, Callable, Optional


def _normalize(value: Any) -> str:
    return str(value or "").strip().lower()


def _safe_iso(raw: Optional[str]) -> str:
    if not raw:
        return ""
    try:
        parsed = datetime.datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return parsed.isoformat()
    except Exception:
        return str(raw)


def _format_short_date(raw: Optional[str]) -> str:
    if not raw:
        return "-"
    try:
        parsed = datetime.datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return parsed.strftime("%Y-%m-%d")
    except Exception:
        return str(raw)


def _humanize_action(action: str) -> str:
    clean = str(action or "").replace("_", " ").strip()
    if not clean:
        return "Unknown action"
    return clean.title()


def parse_date_string(raw: Optional[str]) -> Optional[datetime.date]:
    if not raw:
        return None
    raw = raw.strip()
    iso_match = re.search(r"\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b", raw)
    if iso_match:
        try:
            return datetime.date(int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3)))
        except ValueError:
            return None
    alt_match = re.search(r"\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b", raw)
    if alt_match:
        try:
            return datetime.date(int(alt_match.group(3)), int(alt_match.group(2)), int(alt_match.group(1)))
        except ValueError:
            return None
    if raw.lower() == "today":
        return datetime.datetime.now().date()
    if raw.lower() == "tomorrow":
        return datetime.datetime.now().date() + datetime.timedelta(days=1)
    if raw.lower() == "yesterday":
        return datetime.datetime.now().date() - datetime.timedelta(days=1)
    return None


def fetch_documents_for_date(supabase, target_date: datetime.date) -> list[dict]:
    if not supabase:
        return []
    start = datetime.datetime.combine(target_date, datetime.time.min).isoformat()
    end = (datetime.datetime.combine(target_date, datetime.time.min) + datetime.timedelta(days=1)).isoformat()
    try:
        try:
            res = (
                supabase.table("documents")
                .select("id, filename, doc_type, department, course, tags, uploaded_at, created_at")
                .gte("uploaded_at", start)
                .lt("uploaded_at", end)
                .order("uploaded_at", desc=False)
                .execute()
            )
        except Exception as exc:
            if "uploaded_at" in str(exc):
                res = (
                    supabase.table("documents")
                    .select("id, filename, doc_type, department, course, tags, created_at")
                    .gte("created_at", start)
                    .lt("created_at", end)
                    .order("created_at", desc=False)
                    .execute()
                )
            else:
                raise
        return res.data or []
    except Exception:
        return []


def fetch_admin_snapshot(
    supabase,
    appeal_fetcher: Optional[Callable[..., list[dict[str, Any]]]] = None,
) -> dict:
    snapshot: dict[str, Any] = {
        "counts": {},
        "users_by_role": {},
        "recent_documents": [],
        "recent_users": [],
        "recent_audits": [],
        "appeals_summary": {
            "total": 0,
            "pending": 0,
            "approved": 0,
            "rejected": 0,
        },
        "recent_appeals": [],
    }
    if not supabase:
        return snapshot

    def safe_count(table: str, action_filter: Optional[str] = None) -> int:
        try:
            query = supabase.table(table).select("id", count="exact")
            if action_filter:
                query = query.eq("action", action_filter)
            res = query.execute()
            return int(res.count or 0)
        except Exception:
            return 0

    def safe_role_count(role: str) -> int:
        try:
            res = supabase.table("profiles").select("id", count="exact").eq("role", role).execute()
            return int(res.count or 0)
        except Exception:
            return 0

    snapshot["counts"] = {
        "total_users": safe_count("profiles"),
        "total_documents": safe_count("documents"),
        "total_conversations": safe_count("conversations"),
        "total_queries": safe_count("audit_logs", "agent_query"),
    }
    snapshot["users_by_role"] = {
        "student": safe_role_count("student"),
        "faculty": safe_role_count("faculty"),
        "admin": safe_role_count("admin"),
    }

    try:
        try:
            doc_res = (
                supabase.table("documents")
                .select("id, filename, doc_type, department, course, tags, uploaded_at, created_at, uploader_id")
                .order("uploaded_at", desc=True)
                .limit(25)
                .execute()
            )
        except Exception as exc:
            if "uploaded_at" in str(exc):
                doc_res = (
                    supabase.table("documents")
                    .select("id, filename, doc_type, department, course, tags, created_at, uploader_id")
                    .order("created_at", desc=True)
                    .limit(25)
                    .execute()
                )
            else:
                raise
        for row in doc_res.data or []:
            snapshot["recent_documents"].append(
                {
                    "id": row.get("id"),
                    "filename": row.get("filename"),
                    "doc_type": row.get("doc_type"),
                    "department": row.get("department") or "",
                    "course": row.get("course") or "",
                    "tags": row.get("tags") or [],
                    "uploaded_at": _safe_iso(row.get("uploaded_at") or row.get("created_at")),
                    "uploader_id": row.get("uploader_id"),
                }
            )
    except Exception:
        snapshot["recent_documents"] = []

    try:
        user_res = (
            supabase.table("profiles")
            .select("id, email, full_name, role, department, created_at, academic_verified, identity_provider")
            .order("created_at", desc=True)
            .limit(15)
            .execute()
        )
        for row in user_res.data or []:
            snapshot["recent_users"].append(
                {
                    "id": row.get("id"),
                    "email": row.get("email"),
                    "full_name": row.get("full_name"),
                    "role": row.get("role"),
                    "department": row.get("department") or "",
                    "created_at": _safe_iso(row.get("created_at")),
                    "academic_verified": row.get("academic_verified"),
                    "identity_provider": row.get("identity_provider"),
                }
            )
    except Exception:
        snapshot["recent_users"] = []

    try:
        try:
            audit_res = (
                supabase.table("audit_logs")
                .select("action, user_id, timestamp, created_at, payload, status, ip_address")
                .order("timestamp", desc=True)
                .limit(20)
                .execute()
            )
        except Exception:
            audit_res = (
                supabase.table("audit_logs")
                .select("action, user_id, created_at, payload, status, ip_address")
                .order("created_at", desc=True)
                .limit(20)
                .execute()
            )
        snapshot["recent_audits"] = audit_res.data or []
    except Exception:
        snapshot["recent_audits"] = []

    try:
        appeals_all = (
            appeal_fetcher(supabase, status="all", limit=500)
            if appeal_fetcher is not None
            else []
        )
        pending = [item for item in appeals_all if _normalize((item.get("appeal") or {}).get("status")) == "pending"]
        approved = [item for item in appeals_all if _normalize((item.get("appeal") or {}).get("status")) == "approved"]
        rejected = [item for item in appeals_all if _normalize((item.get("appeal") or {}).get("status")) == "rejected"]
        snapshot["appeals_summary"] = {
            "total": len(appeals_all),
            "pending": len(pending),
            "approved": len(approved),
            "rejected": len(rejected),
        }
        snapshot["counts"]["total_appeals_pending"] = len(pending)

        for row in appeals_all[:20]:
            appeal = row.get("appeal") if isinstance(row.get("appeal"), dict) else {}
            snapshot["recent_appeals"].append(
                {
                    "user_id": row.get("user_id"),
                    "full_name": row.get("full_name"),
                    "email": row.get("email"),
                    "role": row.get("role"),
                    "department": row.get("department"),
                    "offense_total": int(row.get("offense_total") or 0),
                    "appeal_status": _normalize(appeal.get("status")) or "none",
                    "appeal_message": appeal.get("message"),
                    "submitted_at": _safe_iso(appeal.get("submitted_at")),
                    "reviewed_at": _safe_iso(appeal.get("reviewed_at")),
                }
            )
    except Exception:
        snapshot["recent_appeals"] = []

    return snapshot


def render_admin_snapshot(snapshot: dict) -> str:
    counts = snapshot.get("counts", {})
    users_by_role = snapshot.get("users_by_role", {})
    recent_docs = snapshot.get("recent_documents", [])
    recent_users = snapshot.get("recent_users", [])
    recent_audits = snapshot.get("recent_audits", [])
    appeals_summary = snapshot.get("appeals_summary", {}) if isinstance(snapshot.get("appeals_summary"), dict) else {}
    recent_appeals = snapshot.get("recent_appeals", []) if isinstance(snapshot.get("recent_appeals"), list) else []

    today = datetime.datetime.now().date()
    tomorrow = today + datetime.timedelta(days=1)

    lines = [
        "ADMIN LIVE DATA SNAPSHOT:",
        f"- Today: {today.isoformat()}",
        f"- Tomorrow: {tomorrow.isoformat()}",
        f"- Total users: {counts.get('total_users', 0)}",
        f"- Users by role: students {users_by_role.get('student', 0)}, faculty {users_by_role.get('faculty', 0)}, admins {users_by_role.get('admin', 0)}",
        f"- Total documents: {counts.get('total_documents', 0)}",
        f"- Total conversations: {counts.get('total_conversations', 0)}",
        f"- Total queries (audit): {counts.get('total_queries', 0)}",
        (
            "- Appeals: "
            f"pending {int(appeals_summary.get('pending', 0) or 0)}, "
            f"approved {int(appeals_summary.get('approved', 0) or 0)}, "
            f"rejected {int(appeals_summary.get('rejected', 0) or 0)}"
        ),
    ]

    if recent_docs:
        lines.append("Recent documents (latest 25):")
        for doc in recent_docs:
            date_str = _format_short_date(doc.get("uploaded_at"))
            tags = ", ".join(doc.get("tags") or []) if isinstance(doc.get("tags"), list) else ""
            lines.append(
                f"- {date_str} | {doc.get('doc_type') or 'unknown'} | {doc.get('filename') or 'untitled'}"
                f" | dept: {doc.get('department') or '-'} | course: {doc.get('course') or '-'}"
                f"{f' | tags: {tags}' if tags else ''}"
            )
    else:
        lines.append("Recent documents: none (0 total).")

    if recent_users:
        lines.append("Recent users (latest 15):")
        for user in recent_users:
            joined = _format_short_date(user.get("created_at"))
            lines.append(
                f"- {joined} | {user.get('email') or 'unknown'} | role: {user.get('role') or 'unknown'}"
            )
    else:
        lines.append("Recent users: none (0 total).")

    if recent_audits:
        lines.append("Recent audits (latest 20):")
        for audit in recent_audits[:10]:
            ts_value = audit.get("timestamp") or audit.get("created_at")
            ts = _format_short_date(ts_value)
            lines.append(
                f"- {ts} | {_humanize_action(str(audit.get('action') or ''))} | user_id: {audit.get('user_id') or 'unknown'}"
            )
    else:
        lines.append("Recent audits: none (0 total).")

    if recent_appeals:
        lines.append("Recent moderation appeals (latest 20):")
        for item in recent_appeals[:8]:
            submitted = _format_short_date(item.get("submitted_at"))
            lines.append(
                f"- {submitted} | {item.get('full_name') or item.get('email') or 'Unknown user'}"
                f" | status: {item.get('appeal_status') or 'none'}"
                f" | offense_total: {int(item.get('offense_total') or 0)}"
            )
    else:
        lines.append("Recent moderation appeals: none (0 total).")

    lines.append("If asked about holidays, check document titles/tags for 'holiday' or 'closed'. If none, state that no documents indicate a holiday.")
    return "\n".join(lines)
