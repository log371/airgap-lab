# >_ AIRGAP LAB

**Host inventory for planning an on-premises AI pilot.**

Airgap Lab inventories the CPU, memory and OS of a candidate host, lists models reported by its local Ollama service and exports a JSON snapshot. The Python/FastAPI inspector runs on the host in read-only mode.

[Technical dossier (FR)](https://airgap-lab.vercel.app) · [Test runs](https://github.com/log371/airgap-lab/actions/workflows/checks.yml)

An infrastructure team can use the report as a starting point for pilot planning. Capacity under load, access controls, network isolation and operating procedures require separate validation on the target infrastructure.

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

Open `http://127.0.0.1:8765`. To test: `pytest`. Workshop regressions: `node --test scripts/test_workshop.cjs`. Continuous checks: [GitHub Actions](https://github.com/log371/airgap-lab/actions/workflows/checks.yml).

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

## Expérience liée : Le Phare

[Le Phare — Bulletins hors ligne](experiments/phare-bulletins) simule un poste qui vérifie un bulletin signé avant de l’accepter. Le projet explore une chaîne de réception séparée de l’inspecteur d’hôte.

## Dossier public et atelier — préparation v0.2

[**Dossier technique public**](https://airgap-lab.vercel.app) · [**Dossier portfolio**](https://julienl.dev/projects/airgap-lab)

Le dossier présente le besoin, l’architecture, les preuves disponibles, les limites et les trois pistes v0.2. La publication statique est reliée à GitHub via Vercel ; le serveur Python reste exclusivement local. Voir [la configuration et les règles de publication](docs/PUBLICATION.md).

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


## Security and maintenance

See [SECURITY.md](SECURITY.md) for the local API, backup import and publication boundaries. Ollama requests ignore environment proxies and refuse redirects; the local API rejects non-loopback Host values and marks responses no-store. Workshop backups are validated on import and restore. After editing the workshop script, refresh its CSP hash with `python3 scripts/update_csp.py`.

Audit and remediation record: [17 November 2026](docs/AUDIT-2026-11-17.md).
