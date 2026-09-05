"""Provider-neutral chat translation with a Bhashini HTTP seam."""

import json
import unicodedata
from collections.abc import Callable
from urllib.request import Request, urlopen

from app.core.config import settings

_SCRIPT_LANGUAGES = {
    "DEVANAGARI": "hi",
    "BENGALI": "bn",
    "GUJARATI": "gu",
    "GURMUKHI": "pa",
    "KANNADA": "kn",
    "MALAYALAM": "ml",
    "ORIYA": "or",
    "TAMIL": "ta",
    "TELUGU": "te",
    "ARABIC": "ur",
}


def detect_language(text: str) -> str:
    """Return a useful ISO-639-1 guess without external language-detection data."""
    counts: dict[str, int] = {}
    for char in text:
        if not unicodedata.category(char).startswith("L"):
            continue
        script = unicodedata.name(char, "").split(" ")[0]
        language = _SCRIPT_LANGUAGES.get(script)
        if language:
            counts[language] = counts.get(language, 0) + 1
    return max(counts, key=counts.get) if counts else "en"


def _bhashini_translate(text: str, source_lang: str, target_lang: str) -> str | None:
    if not settings.BHASHINI_API_KEY or not settings.BHASHINI_USER_ID or not settings.BHASHINI_SERVICE_ID:
        return None
    payload = {
        "pipelineTasks": [{
            "taskType": "translation",
            "config": {
                "language": {"sourceLanguage": source_lang, "targetLanguage": target_lang},
                "serviceId": settings.BHASHINI_SERVICE_ID,
            },
        }],
        "inputData": {"input": [{"source": text}]},
    }
    request = Request(
        settings.BHASHINI_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "userID": settings.BHASHINI_USER_ID,
            "ulcaApiKey": settings.BHASHINI_API_KEY,
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=settings.BHASHINI_TIMEOUT_SECONDS) as response:
            body = json.load(response)
        return body["pipelineResponse"][0]["output"][0]["target"]
    except (OSError, KeyError, IndexError, TypeError, ValueError):
        return None


def translate_text(
    text: str,
    source_lang: str,
    target_lang: str,
    provider: Callable[[str, str, str], str | None] | None = None,
) -> str | None:
    """Translate or return None so provider failure never breaks chat reads."""
    if source_lang == target_lang:
        return text
    if provider is not None:
        return provider(text, source_lang, target_lang)
    if settings.TRANSLATION_PROVIDER.lower() == "bhashini":
        return _bhashini_translate(text, source_lang, target_lang)
    return None
