import re
from typing import Any


_PERSON_REFERENCE = re.compile(
    r"\b(?:dr|prof(?:essor)?|sir|madam|ma['’]?am|teacher|faculty|dean)\b",
    re.IGNORECASE,
)
_TARGETED_PERSON_QUERY = re.compile(
    r"\bwhy\s+.{0,80}\b(?:dr|prof(?:essor)?|sir|madam|ma['’]?am|teacher|faculty|dean)\b.{0,30}\b(?:is|are|was|were)\b.{1,60}\??$",
    re.IGNORECASE,
)
_TARGETED_PERSON_STATEMENT = re.compile(
    r"\b(?:dr|prof(?:essor)?|sir|madam|ma['’]?am|teacher|faculty|dean)\b.{0,30}\b(?:is|are|was|were)\b.{1,60}$",
    re.IGNORECASE,
)
_ACADEMIC_CONTEXT = re.compile(
    r"\b(?:course|class|lecture|syllabus|subject|exam|deadline|assignment|notice|policy|office\s*hours|department|semester|program|curriculum)\b",
    re.IGNORECASE,
)


def detect_local_moderation(query: str, *, strict: bool = False) -> dict[str, Any]:
    """
    Emergency local moderation fallback.
    No slur wordlists are used here; detection is structure-based for targeted
    personal/identity probing about individuals.
    """
    text = str(query or "").strip()
    if not text:
        return {"is_flagged": False}

    has_person_reference = bool(_PERSON_REFERENCE.search(text))
    in_academic_context = bool(_ACADEMIC_CONTEXT.search(text))

    high_confidence_targeting = bool(_TARGETED_PERSON_QUERY.search(text))
    medium_confidence_targeting = has_person_reference and bool(_TARGETED_PERSON_STATEMENT.search(text))

    if high_confidence_targeting and not in_academic_context:
        return {
            "is_flagged": True,
            "reason": "Targeted personal/identity-focused query about an individual.",
            "intent_type": "general",
            "target_entity": "general",
        }

    if strict and medium_confidence_targeting and not in_academic_context:
        return {
            "is_flagged": True,
            "reason": "Potentially abusive targeted statement about an individual.",
            "intent_type": "general",
            "target_entity": "general",
        }

    return {"is_flagged": False}
