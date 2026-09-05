"""IndicTrans2 translation sidecar for WORKMAT chat.

This runs as its own process with its own virtualenv, so that torch and
transformers — some two gigabytes of them — never enter
`mobilebackend/requirements.txt`, which is twelve lean packages and no ML at all.
The API talks to this over plain HTTP; the client side is
`app/services/translation.py`.

Two distilled checkpoints cover the five languages the app ships:

    ai4bharat/indictrans2-en-indic-dist-200M    English -> Tamil/Malayalam/Hindi/Telugu
    ai4bharat/indictrans2-indic-en-dist-200M    the same four back into English

Indic -> Indic pivots through English rather than loading a third model: a Tamil
worker with a Hindi customer is the rare case, while Tamil <-> English is the
common one and needs both of these anyway.

Both are MIT licensed but gated on HuggingFace — run `hf auth login` once before
the first start. See README.md.
"""

import logging
import os
import threading
import time

import torch
from fastapi import FastAPI, HTTPException
from IndicTransToolkit.processor import IndicProcessor
from pydantic import BaseModel, Field
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

#: The app's ISO codes mapped to the FLORES-200 tags IndicTrans2 expects. Keeping
#: the mapping here means the rest of the codebase never learns about FLORES.
LANG_TAGS = {
    "en": "eng_Latn",
    "ta": "tam_Taml",
    "ml": "mal_Mlym",
    "hi": "hin_Deva",
    "te": "tel_Telu",
}

MODELS = {
    "en-indic": "ai4bharat/indictrans2-en-indic-dist-200M",
    "indic-en": "ai4bharat/indictrans2-indic-en-dist-200M",
}

#: Tunables. NUM_BEAMS is the quality/latency dial — the model card's default is 5;
#: dropping it to 1 (greedy) is several times faster and usually still readable.
MAX_BATCH = int(os.getenv("TRANSLATOR_MAX_BATCH", "64"))
NUM_BEAMS = int(os.getenv("TRANSLATOR_NUM_BEAMS", "5"))
MAX_LENGTH = int(os.getenv("TRANSLATOR_MAX_LENGTH", "256"))

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
#: float16 is a GPU optimisation. On CPU most kernels either fall back to float32
#: anyway or run slower than it, so only ask for it when there is a GPU.
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("translator")

_processor = IndicProcessor(inference=True)
_loaded: dict[str, tuple] = {}
#: One generate() at a time. Concurrent decodes on a laptop mostly buy each other
#: memory pressure, and serialising keeps peak RAM predictable.
_lock = threading.Lock()


def _get(direction: str) -> tuple:
    """Load a checkpoint on first use.

    Lazily, so startup is instant and a direction nobody exercises is never paid
    for — an all-Tamil deployment loads one model, not two.
    """
    if direction not in _loaded:
        name = MODELS[direction]
        logger.info("loading %s on %s (%s) - first call only", name, DEVICE, DTYPE)
        started = time.monotonic()
        tokenizer = AutoTokenizer.from_pretrained(name, trust_remote_code=True)
        model = AutoModelForSeq2SeqLM.from_pretrained(
            name, trust_remote_code=True, torch_dtype=DTYPE
        ).to(DEVICE)
        model.eval()
        _loaded[direction] = (tokenizer, model)
        logger.info("loaded %s in %.1fs", name, time.monotonic() - started)
    return _loaded[direction]


def _run(direction: str, texts: list[str], src_tag: str, tgt_tag: str) -> list[str]:
    """One forward pass over the whole batch.

    `IndicProcessor` on both sides is not optional: it normalises the script going
    in and restores entities (numbers, names) coming out. Skipping it degrades
    output noticeably, which matters when the text is a house number.
    """
    tokenizer, model = _get(direction)
    batch = _processor.preprocess_batch(texts, src_lang=src_tag, tgt_lang=tgt_tag)
    inputs = tokenizer(
        batch,
        truncation=True,
        padding="longest",
        return_tensors="pt",
        return_attention_mask=True,
    ).to(DEVICE)
    with torch.no_grad():
        tokens = model.generate(
            **inputs,
            use_cache=True,
            min_length=0,
            max_length=MAX_LENGTH,
            num_beams=NUM_BEAMS,
            num_return_sequences=1,
        )
    decoded = tokenizer.batch_decode(
        tokens, skip_special_tokens=True, clean_up_tokenization_spaces=True
    )
    return _processor.postprocess_batch(decoded, lang=tgt_tag)


def translate(texts: list[str], source: str, target: str) -> list[str]:
    """Route a batch to the right checkpoint, pivoting through English if needed."""
    if source == "en":
        return _run("en-indic", texts, LANG_TAGS["en"], LANG_TAGS[target])
    if target == "en":
        return _run("indic-en", texts, LANG_TAGS[source], LANG_TAGS["en"])
    english = _run("indic-en", texts, LANG_TAGS[source], LANG_TAGS["en"])
    return _run("en-indic", english, LANG_TAGS["en"], LANG_TAGS[target])


class TranslateIn(BaseModel):
    texts: list[str] = Field(min_length=1)
    source: str
    target: str


class TranslateOut(BaseModel):
    translations: list[str]


app = FastAPI(title="WORKMAT translator", docs_url=None, redoc_url=None)


@app.post("/translate", response_model=TranslateOut)
def translate_endpoint(payload: TranslateIn) -> TranslateOut:
    """Translate a batch.

    Always returns as many results as it was given, in the same order — the caller
    zips the two lists together, so a length mismatch would attach a translation to
    the wrong message.

    Deliberately `def`, not `async def`: generate() blocks, and FastAPI runs a sync
    endpoint in its threadpool instead of stalling the event loop.
    """
    source, target = payload.source.lower(), payload.target.lower()
    for code in (source, target):
        if code not in LANG_TAGS:
            raise HTTPException(
                status_code=400,
                detail=f"unsupported language {code!r}; expected one of {sorted(LANG_TAGS)}",
            )
    if len(payload.texts) > MAX_BATCH:
        raise HTTPException(
            status_code=413,
            detail=f"batch of {len(payload.texts)} exceeds TRANSLATOR_MAX_BATCH={MAX_BATCH}",
        )
    if source == target:
        return TranslateOut(translations=list(payload.texts))

    # Blank strings go straight through: the preprocessor has nothing to work with,
    # and holding their positions is what keeps the response aligned with the request.
    indexed = [(i, text) for i, text in enumerate(payload.texts) if text.strip()]
    results = list(payload.texts)
    if indexed:
        started = time.monotonic()
        with _lock:
            translated = translate([text for _, text in indexed], source, target)
        for (index, _), output in zip(indexed, translated):
            results[index] = output
        logger.info(
            "%s->%s  %d texts in %.2fs", source, target, len(indexed), time.monotonic() - started
        )
    return TranslateOut(translations=results)


@app.get("/health")
def health() -> dict:
    """Cheap enough to poll; reports which checkpoints are actually resident."""
    return {"ok": True, "device": DEVICE, "loaded": sorted(_loaded)}
