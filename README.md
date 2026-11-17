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

## Atelier interactif — préparation v0.2

Un [atelier autonome en français](docs/atelier-v02.html) permet de comparer les trois pistes de la feuille de route, choisir un périmètre et suivre les tâches, hypothèses, décisions, essais et critères d’acceptation. Une vue prépare aussi la présentation portfolio à partir des traces saisies.

**État : outil de planification. La v0.2 reste à arbitrer ; cet atelier n’implémente pas les fonctionnalités proposées et n’exécute aucun test du projet.**

### Utilisation hors ligne

Télécharge le dépôt puis ouvre `docs/atelier-v02.html` dans un navigateur récent. Aucune installation, ressource CDN ou connexion au serveur FastAPI n’est nécessaire. Si le navigateur limite le stockage avec `file://`, utilise un serveur local dédié :

```bash
python3 -m http.server 8766 --bind 127.0.0.1 --directory docs
```

Ouvre ensuite `http://127.0.0.1:8766/atelier-v02.html`.

Le suivi est enregistré dans le navigateur (`localStorage`), sans synchronisation avec GitHub ni entre appareils. Utilise **Exporter JSON** pour sauvegarder ton travail et **Importer** pour le reprendre. Un changement de navigateur, d’adresse ou une suppression des données locales peut faire disparaître le suivi visible. N’ajoute pas de métadonnées hôte sensibles dans des exports destinés à être publics.

Les plans sont proposés, les résultats restent à renseigner. Les validations demandent une trace ; elles restent déclaratives. L’état v0.1 présenté correspond à l’instantané consulté le 16 novembre 2026, sans actualisation automatique.

## License

MIT — see `LICENSE`.
