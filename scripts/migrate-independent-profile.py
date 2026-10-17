"""Explicit, offline migration of an independent desktop profile.

Custom data stays at its chosen location: moving the database can invalidate
path-derived encryption. No official profile discovery or content rewriting.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
from contextlib import closing

SKIP = {'logs', 'Cache', 'Code Cache', 'GPUCache', 'DawnCache',
        'DawnGraphiteCache', 'DawnWebGPUCache', 'Crashpad', 'Crash Reports',
        'SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort',
        'LOCK', 'lockfile'}

def checked_tree(root):
    for parent, dirs, files in os.walk(root, followlinks=False):
        for name in dirs + files:
            p = Path(parent) / name
            if p.is_symlink() or (hasattr(p, 'is_junction') and p.is_junction()):
                raise ValueError('Profile contains a linked path; migration refused')

def process_ids(executable):
    # Send the path as data via the environment, never interpolate it as code.
    env = dict(os.environ, SHINEAI_MIGRATION_EXE=str(executable))
    result = subprocess.run(['powershell.exe','-NoProfile','-NonInteractive','-Command',
        'Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq $env:SHINEAI_MIGRATION_EXE } | ForEach-Object { $_.ProcessId }'],
        env=env,capture_output=True,text=True,check=True,creationflags=0x08000000)
    return result.stdout.strip()

def migrate(install, source, target, backup, check_running=True):
    install,source,target,backup = [Path(p).absolute() for p in (install,source,target,backup)]
    package=json.loads((install/'resources/app/package.json').read_text(encoding='utf-8'))
    if package.get('name') != 'spectrai-dev':
        raise ValueError('Only the independent development installation is accepted')
    if source.name != 'SpectrAI-Dev' or target.name != 'Desktop' or target.parent.name != 'ShineAI':
        raise ValueError('Unexpected profile paths')
    if not source.is_dir() or source.is_symlink() or target.exists() or backup.exists():
        raise ValueError('Source must exist; target and backup must be new')
    roots=[p.resolve() for p in [source,target,backup]]
    for i,a in enumerate(roots):
        for b in roots[i+1:]:
            if a.is_relative_to(b) or b.is_relative_to(a):
                raise ValueError('Profile and backup paths must not overlap')
    for root in [install,source,target.parent,backup.parent]:
        for p in [root,*root.parents]:
            if p.exists() and (p.is_symlink() or (hasattr(p,'is_junction') and p.is_junction())):
                raise ValueError('Linked migration root')
    if check_running and process_ids(install/'SpectrAI Dev.exe'):
        raise ValueError('Close the independent development app before migrating')
    settings=source/'data-path.json'
    if not settings.exists():
        raise ValueError('This migration requires an explicit custom data directory')
    data=Path(json.loads(settings.read_text(encoding='utf-8'))['dataDir'])
    if not data.is_absolute() or not data.is_dir() or data.resolve()==source.resolve():
        raise ValueError('Custom data must be an existing independent directory')
    database=data/'claudeops.db'
    if not database.is_file(): raise ValueError('Custom database missing')
    checked_tree(source)
    backup.mkdir(parents=True)
    # Snapshot through SQLite, including committed WAL pages, with a read-only
    # source. Logs/backups are private local artifacts, never installer inputs.
    db=sqlite3.connect(database.as_uri()+'?mode=ro',uri=True)
    counts={}
    try:
        if db.execute('pragma quick_check').fetchone()[0]!='ok':raise ValueError('Database integrity failed')
        tables={r[0] for r in db.execute("select name from sqlite_master where type='table'")}
        for name in ['sessions','conversation_messages','ai_providers','provider_api_keys','skills','mcp_servers']:
            if name in tables:counts[name]=db.execute('select count(*) from '+name).fetchone()[0]
        with closing(sqlite3.connect(backup/'claudeops.db')) as snapshot:db.backup(snapshot)
    finally: db.close()
    shutil.copytree(source,backup/'profile',ignore=shutil.ignore_patterns(*SKIP))
    staging=target.with_name(target.name+'.migrating')
    if staging.exists():raise ValueError('Previous incomplete migration exists; inspect it first')
    try:
        shutil.copytree(backup/'profile',staging)
        # Keep precisely the selected database root, dropping historical paths
        # from the user-facing path config. Cipher material is unchanged.
        (staging/'data-path.json').write_text(json.dumps({'dataDir':str(data)},indent=2)+'\n',encoding='utf-8')
        for parent,_,files in os.walk(backup/'profile'):
            for name in files:
                relative=(Path(parent)/name).relative_to(backup/'profile')
                if str(relative)=='data-path.json':continue
                a=(backup/'profile'/relative).read_bytes();b=(staging/relative).read_bytes()
                if hashlib.sha256(a).digest()!=hashlib.sha256(b).digest():raise ValueError('Profile copy mismatch')
        if check_running and process_ids(install/'SpectrAI Dev.exe'):
            raise ValueError('Old development app restarted during migration; target was not published')
        target.parent.mkdir(parents=True,exist_ok=True)
        staging.rename(target)
    except Exception:
        # Leave the original and backup intact; never silently retry over data.
        raise
    report={'status':'migrated','source':str(source),'target':str(target),
        'customDataDir':str(data),'databaseMoved':False,'ciphertextsChanged':False,
        'sourceRetained':True,'counts':counts}
    (backup/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ['install','source','target','backup']:parser.add_argument('--'+name,required=True)
    args=parser.parse_args()
    print(json.dumps(migrate(args.install,args.source,args.target,args.backup),indent=2))
