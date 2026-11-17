# Security boundary

Airgap Lab is a read-only local inspection prototype, not an isolation certification or a security scanner.

## Local inspector

- Bind Uvicorn to `127.0.0.1`; do not publish the API or put it behind a public proxy. There is no authentication.
- HTTP Host values are restricted to localhost and loopback addresses, reducing DNS-rebinding exposure. This is not authentication or a replacement for the bind address.
- Inspection responses are marked `Cache-Control: no-store`.
- Ollama is queried only at `http://127.0.0.1:11434/api/tags`, without environment proxies or HTTP redirects. Response size and timeout are bounded.
- Inventory reports contain host metadata. Review exports before sharing them.

## Public dossier and workshop

- Vercel serves only `docs/`; the Python API is never part of this deployment.
- All imported and restored planning state is untrusted. The same schema validator checks identifiers, field types, enum values, dates, evidence requirements and collection limits before use. Imported backups are limited to 2 MiB.
- All record identifiers inserted into HTML attributes are escaped in addition to validation.
- The autonomous page and Vercel configuration authorize the exact workshop inline script by SHA-256. Inline event handlers are not permitted. Styles remain inline for offline use.
- After editing the workshop script, run `python3 scripts/update_csp.py` and `node --test scripts/test_workshop.cjs`.
- Browser storage is not encrypted and does not synchronize. Avoid confidential traces; export backups manually.
- If stored data is malformed, the original value is retained and automatic saves remain suspended until a valid backup is imported. New work can still be exported manually.

## Reporting

Use a private security advisory through the repository Security tab if available. Do not include credentials or other people's host metadata in public issues. No security response SLA is promised for this personal project.
