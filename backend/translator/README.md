# WORKMAT translation sidecar

Machine translation for in-job chat: the worker writes Tamil, the customer reads
English, and the other way round. Five languages — English, Tamil, Malayalam,
Hindi, Telugu.

This is a **separate service with its own virtualenv**. It is not imported by
`app/`, and its dependencies are not in `mobilebackend/requirements.txt`. The
reason is proportion: the API needs twelve packages, this needs torch. Keeping
them apart means the API installs and starts as fast as it always did, and a
machine that never runs translation never downloads a model.

The engine is [IndicTrans2](https://github.com/AI4Bharat/IndicTrans2) by AI4Bharat
— MIT licensed, and the same model family the Government of India's Bhashini
serves for translation. Running it locally means no API key, no account approval,
no rate limit, no per-message cost, and customer addresses never leave the machine.

## 1. Accept the model terms (one time)

Both checkpoints are MIT licensed but **gated**: HuggingFace asks you to share
contact details before it will serve the weights. This is free, instant and
self-service — no organisational approval.

1. Create a free account at <https://huggingface.co/join>.
2. Open each model page and click through the access notice:
   - <https://huggingface.co/ai4bharat/indictrans2-indic-en-dist-200M>
   - <https://huggingface.co/ai4bharat/indictrans2-en-indic-dist-200M>
3. Log the CLI in once, so downloads are authenticated:

   ```bash
   hf auth login          # older installs: huggingface-cli login
   ```

## 2. Install

```bash
cd mobilebackend/translator
python3 -m venv .venv
source .venv/bin/activate

# CPU-only torch: ~200 MB instead of the ~2.5 GB default CUDA build.
# Skip this line if you have an NVIDIA GPU and want CUDA.
pip install torch --index-url https://download.pytorch.org/whl/cpu

pip install -r requirements.txt
```

`.venv/` is gitignored. Model weights land in `~/.cache/huggingface`, outside the
repository — leave `HF_HOME` alone so they stay there and are shared with any
other project.

## 3. Run

```bash
cd mobilebackend/translator
source .venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8001
```

**Bind `127.0.0.1`, never `0.0.0.0`.** This endpoint has no authentication; it is
meant to be reachable only from the API process on the same machine.

Startup is instant because models load on first use. The first `/translate` call
therefore takes 30-60 seconds while a checkpoint is fetched and loaded — that is
the download, not the translation. Subsequent calls are the real latency.

## 4. Verify, before touching the backend

This proves the engine works with no app involved:

```bash
curl -s localhost:8001/translate -H 'Content-Type: application/json' \
  -d '{"texts":["வேலை முடிந்தது"],"source":"ta","target":"en"}'
```

Expect English along the lines of *"The work is finished"*. Then check the other
direction and the English pivot:

```bash
# English -> Tamil
curl -s localhost:8001/translate -H 'Content-Type: application/json' \
  -d '{"texts":["I am on the way"],"source":"en","target":"ta"}'

# Tamil -> Malayalam, which routes ta -> en -> ml
curl -s localhost:8001/translate -H 'Content-Type: application/json' \
  -d '{"texts":["வேலை முடிந்தது"],"source":"ta","target":"ml"}'

curl -s localhost:8001/health
```

## 5. Point the API at it

In `mobilebackend/.env`:

```
TRANSLATION_PROVIDER=local
LOCAL_TRANSLATE_URL=http://127.0.0.1:8001/translate
LOCAL_TRANSLATE_TIMEOUT_SECONDS=30
```

Leave `TRANSLATION_PROVIDER=none` and chat still works — messages are simply
served as written. **The API never depends on this service being up.** If the
sidecar is stopped, slow or missing, reads fall back to the original text and the
worker still sends and receives messages. A missing translation is a degradation;
an undelivered message would be a bug.

## API

```
POST /translate
  {"texts": ["...", "..."], "source": "ta", "target": "en"}
  -> {"translations": ["...", "..."]}     same length, same order

GET /health
  -> {"ok": true, "device": "cpu", "loaded": ["indic-en"]}
```

Languages: `en`, `ta`, `ml`, `hi`, `te`. Anything else is a 400. A batch larger
than `TRANSLATOR_MAX_BATCH` is a 413.

## Tuning

| Variable | Default | Effect |
|---|---|---|
| `TRANSLATOR_NUM_BEAMS` | `5` | The quality/speed dial. `1` (greedy) is several times faster and usually still readable — try it first if chat feels sluggish. |
| `TRANSLATOR_MAX_BATCH` | `64` | Rejects oversized batches instead of running out of memory. |
| `TRANSLATOR_MAX_LENGTH` | `256` | Output token cap. Chat messages are short; raising this mostly costs time. |

If CPU latency is still too high, the next step is quantising these same weights
with [CTranslate2](https://github.com/OpenNMT/CTranslate2) (int8). That is a change
inside this directory only — the HTTP contract above does not move, so the API
never knows.

## Troubleshooting

**`401` or `GatedRepoError` on first call** — step 1 was skipped, or `hf auth
login` was run in a different shell. Confirm with `hf auth whoami`.

**`IndicTransToolkit` will not install** — it is the likeliest package to lag a
new Python release. The backend targets Python 3.13; if the toolkit or torch has
no wheel for it, build **this venv only** on 3.11:

```bash
python3.11 -m venv .venv
```

The API keeps its own interpreter, so nothing else is affected.

**First call very slow, later calls fine** — expected. That is the model download
and load. `GET /health` shows which checkpoints are resident.

**Output has odd spacing or mangled numbers** — `IndicProcessor` is being bypassed.
Both `preprocess_batch` and `postprocess_batch` are required; see `_run()` in
`server.py`.
