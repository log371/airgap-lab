"""Loopback-only web UI and inspection API."""
from importlib.resources import files
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from .inspectors import snapshot

app = FastAPI(title="Airgap Lab", version="0.1.0", docs_url=None, redoc_url=None)


@app.get("/", response_class=HTMLResponse)
def index():
    return files("airgap_lab").joinpath("index.html").read_text(encoding="utf-8")


@app.get("/api/snapshot")
def get_snapshot():
    return snapshot()


@app.get("/health")
def health():
    return {"status": "ok"}
