"""Refresh the standalone workshop script hash in HTML and Vercel headers."""
import base64
import hashlib
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
page = root / 'docs/atelier-v02.html'
html = page.read_text(encoding='utf-8')
script = html.split('<script>')[1].split('</script>')[0]
digest = base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
html = re.sub(r"sha256-[A-Za-z0-9+/=]+", 'sha256-' + digest, html)
page.write_text(html, encoding='utf-8')
config_path = root / 'docs/vercel.json'
config = json.loads(config_path.read_text(encoding='utf-8'))
for header in config['headers'][0]['headers']:
    if header['key'] == 'Content-Security-Policy':
        header['value'] = re.sub(r"sha256-[A-Za-z0-9+/=]+", 'sha256-' + digest, header['value'])
config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Workshop CSP hash refreshed.')
