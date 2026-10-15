"""Read-only verification of the immutable official client snapshot."""
import hashlib, json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
baseline = root / 'archive/official-1.0.6'
manifest = json.loads((baseline / 'extraction-manifest.json').read_text(encoding='utf-8'))
with (root / 'archive/official-1.0.6.asar').open('rb') as stream:
    assert hashlib.file_digest(stream, 'sha256').hexdigest() == manifest['sourceSha256'], 'Baseline archive changed'
for entry in manifest['files']:
    assert hashlib.sha256((baseline / entry['extractedPath']).read_bytes()).hexdigest() == entry['sha256'], entry['extractedPath']
print(json.dumps({'version': manifest['version'], 'filesVerified': len(manifest['files']), 'immutableBaselineIntact': True}))
