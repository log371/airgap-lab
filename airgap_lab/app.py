"""Loopback-only web UI and inspection API."""
from importlib.resources import files
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from .inspectors import snapshot

app = FastAPI(title="Airgap Lab", version="0.1.0", docs_url=None, redoc_url=None)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost", "[::1]"])


@app.middleware("http")
async def local_response_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.get("/", response_class=HTMLResponse)
def index():
    return files("airgap_lab").joinpath("index.html").read_text(encoding="utf-8")


@app.get("/api/snapshot")
def get_snapshot():
    return snapshot()


@app.get("/health")
def health():
    return {"status": "ok"}

