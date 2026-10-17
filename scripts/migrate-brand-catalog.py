"""Migrate exact built-in identities; never rebrand user prose or credentials."""
import argparse
from contextlib import closing
import json
from pathlib import Path
import sqlite3

OLD='spectrai-claw'
NEW='shineai-claw'
MCP_FIELDS={'required_mcps','requiredMcps','mcpServers','mcpServerIds','mcpIds','enabledMcpServers','disabledMcpServers'}
GENERATED_SOURCES={'search_tools_prompt','file_ops_prompt','mcp_first_prompt','mobile_file_delivery_prompt'}

def generated_blocks(value):
    if not isinstance(value,dict):return value
    blocks=value.get('systemPromptBlocks')
    if not isinstance(blocks,list):return value
    # Only the app's own generated blocks are branded. A custom_system_prompt
    # block and every ordinary user message retain their original text.
    for block in blocks:
        if not isinstance(block,dict) or block.get('source') not in GENERATED_SOURCES:continue
        before=block.get('content')
        if not isinstance(before,str):continue
        after=before.replace('SpectrAI','ShineAI').replace('mcp__spectrai-agent','mcp__shineai-agent')
        for scheme in ['media','creative','pdf','html']:
            after=after.replace('spectrai-'+scheme+'://','shineai-'+scheme+'://')
        if after!=before:
            block['content']=after
            if isinstance(value.get('systemPromptAppend'),str):
                append=value['systemPromptAppend']
                # structured() may already have updated the tool namespace.
                fragment=before if before in append else before.replace('mcp__spectrai-agent','mcp__shineai-agent')
                value['systemPromptAppend']=append.replace(fragment,after,1)
    return value

def structured(value, field=''):
    if isinstance(value,dict):
        return {(NEW if k==OLD and field in MCP_FIELDS else k):structured(v,k) for k,v in value.items()}
    if isinstance(value,list):return [structured(v,field) for v in value]
    if isinstance(value,str):
        if value==OLD and field in MCP_FIELDS:return NEW
        # These fields contain generated tool documentation. Keep all other
        # words, user prompts, paths, API keys and conversation text untouched.
        if field=='systemPromptAppend':return value.replace('mcp__spectrai-agent','mcp__shineai-agent')
    return value

def migrate(database,backup):
    database=Path(database).resolve();backup=Path(backup).absolute()
    if not database.is_file() or backup.exists():raise ValueError('Existing database and a new backup path are required')
    backup.parent.mkdir(parents=True,exist_ok=True)
    changes={}
    with closing(sqlite3.connect(database,timeout=5)) as db:
        if db.execute('pragma quick_check').fetchone()[0]!='ok':raise ValueError('Database integrity failed')
        with closing(sqlite3.connect(backup)) as snapshot:db.backup(snapshot)
        try:
            db.execute('begin immediate')
            row=db.execute('select source,install_method from mcp_servers where id=?',(OLD,)).fetchone()
            if row:
                if row!=('builtin','builtin'):raise ValueError('Legacy MCP identity belongs to a custom entry')
                if db.execute('select 1 from mcp_servers where id=?',(NEW,)).fetchone():raise ValueError('Both built-in MCP identities exist; refusing to merge user configuration')
                db.execute('update mcp_servers set id=?,name=case when name=? then ? else name end,description=replace(description,?,?) where id=?',
                    (NEW,'SpectrAI Claw','ShineAI Claw','SpectrAI','ShineAI',OLD))
                changes['builtinMcp']=1
            changed=db.execute('update ai_providers set name=? where id=? and name=?',('ShineAI','claudeops-builtin','SpectrAI')).rowcount
            if changed:changes['removedProviderDisplayName']=changed
            columns={'skills':['required_mcps','native_config','orchestration_config'],
                'sessions':['config'],'app_settings':['value'],'workflows':['steps']}
            tables={r[0] for r in db.execute("select name from sqlite_master where type='table'")}
            for table,candidates in columns.items():
                if table not in tables:continue
                available={r[1] for r in db.execute('pragma table_info('+table+')')}
                for column in candidates:
                    if column not in available:continue
                    for rowid,raw in db.execute('select rowid,'+column+' from '+table+' where '+column+' is not null').fetchall():
                        try:value=json.loads(raw)
                        except (ValueError,TypeError):continue
                        result=structured(value,column)
                        if table=='sessions' and column=='config':result=generated_blocks(result)
                        if result!=value:
                            db.execute('update '+table+' set '+column+'=? where rowid=?',(json.dumps(result,ensure_ascii=False),rowid))
                            key=table+'.'+column;changes[key]=changes.get(key,0)+1
            db.commit()
        except Exception:
            db.rollback();raise
    return {'status':'migrated','changes':changes,'credentialsReencrypted':False,'conversationTextChanged':False}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database',required=True);parser.add_argument('--backup',required=True)
    args=parser.parse_args();print(json.dumps(migrate(args.database,args.backup),indent=2))
