# >_ AIRGAP LAB

**Local-first machine and AI inspection workbench.**

A small, read-only Python/FastAPI dashboard that inventories hardware and checks for a locally running Ollama instance. Designed to demonstrate practical systems development rather than a fake security score.

## Features (v0.1)

- CPU, architecture, OS, physical/logical cores and RAM inventory
- Queries *only* `127.0.0.1:11434/api/tags` for local Ollama model metadata
- Dark terminal-inspired interface, no external fonts or scripts
- Export a structured JSON report from the browser
- Bounded Ollama request timeout and response size
- No model downloads, cloud telemetry or authentication service

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
python -m uvicorn airgap_lab.app:app --host 127.0.0.1 --port 8765
```

Open `http://127.0.0.1:8765`. To test: `pytest`.

**Security boundary:** The server binds to localhost in the documented command. Do **not** bind to `0.0.0.0` or expose it through a public proxy: this read-only API reveals local system metadata and has no authentication. Ollama detection targets a fixed loopback address and does not accept arbitrary URLs.

## Architecture

```text
Browser (HTML/CSS/JS, no CDN)
    ↓ GET /api/snapshot
FastAPI (loopback only)
    ├─ psutil + platform → hardware info
    └─ urllib → 127.0.0.1:11434/api/tags → Ollama models
    ↓
JSON snapshot → browser UI / manual export
```

## Scope and limitations

This is **not** an airgap certification or a full security scanner. No network exposure verification, GPU detection, energy accounting or inference benchmarks are implemented in v0.1. Hardware details come from the running host, which means a Docker container would report aspects of the container environment rather than an authoritative host inventory. Ollama metadata is reported as returned by the local service, not independently verified.

## Roadmap

1. Hardware inspector (v0.1)
2. Local Ollama detection (v0.1)
3. Repeatable inference benchmarks with warm-up, latency, tokens/s and raw sample reports
4. Opt-in network listen-port inventory with platform-specific limitations
5. Static public demonstration with explicitly marked synthetic fixtures

## License

MIT — see `LICENSE`.
