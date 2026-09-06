"""Provider-neutral chat translation, with a local IndicTrans2 seam.

Translation is a *degradation-tolerant* feature. Nothing in this module raises:
every entry point returns `None` (or a list of `None`) when translation is
unavailable, so a translator that is down, slow or unconfigured can never stop a
chat message being sent or read. A missing translation is a degradation; an
undelivered message would be a bug.

The provider is a local sidecar rather than a hosted API — see
`mobilebackend/translator/README.md`. That keeps this package's dependencies to
the stdlib, and keeps customer addresses on the machine.
"""

import json
import logging
import unicodedata
from collections.abc import Callable, Sequence
from urllib.request import Request, urlopen

from app.core.config import settings

logger = logging.getLogger(__name__)

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


def _local_translate_batch(
    texts: Sequence[str], source_lang: str, target_lang: str
) -> list[str] | None:
    """One POST to the sidecar for the whole batch. `None` on any failure."""
    payload = {"texts": list(texts), "source": source_lang, "target": target_lang}
    request = Request(
        settings.LOCAL_TRANSLATE_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=settings.LOCAL_TRANSLATE_TIMEOUT_SECONDS) as response:
            body = json.load(response)
        translations = body["translations"]
    except (OSError, KeyError, TypeError, ValueError) as exc:
        logger.warning(
            "translation sidecar unavailable (%s -> %s): %s", source_lang, target_lang, exc
        )
        return None

    if not isinstance(translations, list) or len(translations) != len(texts):
        # Refuse a length mismatch rather than zipping it: attaching the wrong
        # translation to the wrong message is far worse than translating nothing.
        logger.warning(
            "translation sidecar returned %s results for %d inputs",
            len(translations) if isinstance(translations, list) else type(translations).__name__,
            len(texts),
        )
        return None
    return [str(item) for item in translations]


def translate_texts(
    texts: Sequence[str],
    source_lang: str,
    target_lang: str,
    provider: Callable[[str, str, str], str | None] | None = None,
) -> list[str | None]:
    """Translate a batch, one result per input, in the same order.

    Batching is the point of this function. The model spends most of a request on
    fixed overhead, so translating a whole thread in one call costs little more
    than translating its first message — where a per-message loop would pay that
    overhead once per bubble.
    """
    texts = list(texts)
    if not texts:
        return []
    if source_lang == target_lang:
        return list(texts)
    if provider is not None:
        return [provider(text, source_lang, target_lang) for text in texts]
    if settings.TRANSLATION_PROVIDER.lower() == "local":
        translated = _local_translate_batch(texts, source_lang, target_lang)
        if translated is not None:
            return list(translated)
    return [None] * len(texts)


def translate_text(
    text: str,
    source_lang: str,
    target_lang: str,
    provider: Callable[[str, str, str], str | None] | None = None,
) -> str | None:
    """Single-message wrapper over `translate_texts`."""
    return translate_texts([text], source_lang, target_lang, provider=provider)[0]
