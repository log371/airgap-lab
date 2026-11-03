"""Read-only and bounded local inspection routines."""
import json
import os
import platform
import socket
import urllib.error
import urllib.request
from datetime import datetime, timezone

import psutil

OLLAMA_URL = "http://127.0.0.1:11434/api/tags"


def inspect_hardware():
    vm = psutil.virtual_memory()
    return {
        "system": platform.system(),
        "release": platform.release(),
        "architecture": platform.machine(),
        "processor": platform.processor() or platform.machine(),
        "cpu_logical": psutil.cpu_count(logical=True),
        "cpu_physical": psutil.cpu_count(logical=False),
        "memory_total_bytes": vm.total,
        "memory_available_bytes": vm.available,
    }


def inspect_ollama(url=OLLAMA_URL):
    """Query loopback Ollama only; don't accept a user-supplied URL."""
    if url != OLLAMA_URL:
        raise ValueError("Only the fixed loopback Ollama endpoint is allowed")
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=1.5) as response:
            if response.status != 200:
                return {"reachable": False, "models": [], "error": "Unexpected HTTP status"}
            raw = response.read(512 * 1024 + 1)
            if len(raw) > 512 * 1024:
                return {"reachable": False, "models": [], "error": "Response too large"}
            data = json.loads(raw)
            if not isinstance(data, dict) or not isinstance(data.get("models"), list):
                return {"reachable": False, "models": [], "error": "Invalid model listing"}
            models = [{"name": str(m.get("name", "unknown"))[:160],
                       "size_bytes": m.get("size") if isinstance(m.get("size"), int) else None}
                      for m in data["models"][:100] if isinstance(m, dict)]
            return {"reachable": True, "models": models, "error": None}
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, json.JSONDecodeError):
        return {"reachable": False, "models": [], "error": "Ollama unavailable on loopback"}


def snapshot():
    return {"collected_at": datetime.now(timezone.utc).isoformat(),
            "scope": "local_machine", "hardware": inspect_hardware(), "ollama": inspect_ollama(),
            "limitations": ["No GPU detection", "No benchmark", "No network exposure assessment", "Not an airgap certification"]}
