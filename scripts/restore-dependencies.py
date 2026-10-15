"""Restore exact published dependencies offline, including ABI-149 native binaries."""
import hashlib, json, struct, mmap
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
root = Path(__file__).resolve().parents[1]
archive = root / 'archive/official-1.0.6.asar'
expected = '352bf011b87d372e85cd8c7da35e1fccef20b271f44a4f0f43911ca26239a9fe'
with archive.open('rb') as stream:
    if hashlib.file_digest(stream, 'sha256').hexdigest() != expected:
        raise RuntimeError('Baseline archive hash mismatch')
def entries(tree, prefix=''):
    for name, value in tree.get('files', {}).items():
        key = f'{prefix}/{name}' if prefix else name
        if 'files' in value:
            yield from entries(value, key)
        else:
            yield key, value
count, changed = 0, 0
with archive.open('rb') as stream:
    leading = stream.read(16)
    header_size = struct.unpack_from('<I', leading, 4)[0]
    tree = json.loads(stream.read(struct.unpack_from('<I', leading, 12)[0]))
    mapped = mmap.mmap(stream.fileno(), 0, access=mmap.ACCESS_READ)
    def restore(item):
        key, entry = item
        target = root / key
        if target.is_symlink() or '..' in Path(key).parts or not target.absolute().is_relative_to(root / 'node_modules'):
            raise RuntimeError('Unsafe dependency path: ' + key)
        for parent in target.parents:
            if parent == root:
                break
            if parent.is_symlink():
                raise RuntimeError('Linked dependency directory: ' + str(parent))
        if 'link' in entry:
            raise RuntimeError('Unexpected dependency link: ' + key)
        if entry.get('unpacked'):
            data = (Path(str(archive) + '.unpacked') / key).read_bytes()
        else:
            start = 8 + header_size + int(entry['offset'])
            data = mapped[start:start + entry['size']]
        if len(data) != entry['size']:
            raise RuntimeError('Truncated dependency: ' + key)
        integrity = entry.get('integrity', {})
        digest = hashlib.sha256(data).hexdigest()
        if integrity.get('algorithm') == 'SHA256' and digest != integrity['hash']:
            raise RuntimeError('Dependency integrity mismatch: ' + key)
        if not target.exists() or hashlib.sha256(target.read_bytes()).hexdigest() != digest:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            return 1
        return 0
    with ThreadPoolExecutor(max_workers=8) as executor:
        selected = (item for item in entries(tree) if item[0].startswith('node_modules/'))
        for result in executor.map(restore, selected):
            count += 1
            changed += result
            if count % 10000 == 0:
                print(f'Checked {count} dependency files', flush=True)
    mapped.close()
print(json.dumps({'checked': count, 'restored': changed, 'nativeAbi': 149}), flush=True)
