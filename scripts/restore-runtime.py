"""Restore the pinned Electron binary from this workspace's verified offline ZIP."""
import hashlib, zipfile
from pathlib import Path
root = Path(__file__).resolve().parents[1]
archive = root / '.runtime/electron-v44.5.1-win32-x64.zip'
expected = '9b382492dcfee91f8f9e92c91f7972550a1b95d2299cac72279dab33a600d7db'
with archive.open('rb') as stream:
    if hashlib.file_digest(stream, 'sha256').hexdigest() != expected:
        raise RuntimeError('Runtime archive checksum mismatch')
target = (root / '.runtime/electron').resolve()
with zipfile.ZipFile(archive) as bundle:
    for item in bundle.infolist():
        if not (target / item.filename).resolve().is_relative_to(target):
            raise RuntimeError('Unsafe runtime archive path')
    bundle.extractall(target)
print('Restored standalone Electron 44.5.1 / ABI 149')
