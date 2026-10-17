'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
test('independent profile migration preserves WAL data and rejects overwrite, official installs and links',()=>{
  const script=String.raw`
import importlib.util,json,sqlite3,tempfile
from unittest.mock import patch
from pathlib import Path
spec=importlib.util.spec_from_file_location('migration','scripts/migrate-independent-profile.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as temp:
 r=Path(temp);install=r/'application';(install/'resources/app').mkdir(parents=True)
 pkg=install/'resources/app/package.json';pkg.write_text(json.dumps({'name':'spectrai-dev'}))
 source=r/'SpectrAI-Dev';source.mkdir();data=r/'custom-data';data.mkdir()
 (source/'data-path.json').write_text(json.dumps({'dataDir':str(data),'previousDir':'original-path'}))
 (source/'appearance').mkdir();(source/'appearance/settings.json').write_text('wallpaper preferences unchanged')
 (source/'logs').mkdir();(source/'logs/old.log').write_text('legacy log')
 (source/'Local State').write_bytes(b'OS-wrapped encryption key remains byte-identical')
 db=sqlite3.connect(data/'claudeops.db');db.execute('pragma journal_mode=WAL')
 db.execute('create table sessions(id text,config text)');db.execute('insert into sessions values(?,?)',('fixture','user content'))
 db.execute('create table ai_providers(id text,api_key text)');db.execute('insert into ai_providers values(?,?)',('provider','aes:v1:fixture-ciphertext'))
 db.commit()
 target=r/'ShineAI/Desktop';backup=r/'backup'
 report=m.migrate(install,source,target,backup,check_running=False)
 assert report['counts']['sessions']==1 and not report['databaseMoved'] and not report['ciphertextsChanged']
 assert (target/'Local State').read_bytes()==(source/'Local State').read_bytes()
 assert (target/'appearance/settings.json').read_bytes()==(source/'appearance/settings.json').read_bytes()
 assert not (target/'logs').exists()
 snapshot=sqlite3.connect(backup/'claudeops.db')
 assert snapshot.execute('select config from sessions').fetchone()[0]=='user content'
 assert snapshot.execute('select api_key from ai_providers').fetchone()[0]=='aes:v1:fixture-ciphertext'
 snapshot.close();db.close()
 try:m.migrate(install,source,source/'ShineAI/Desktop',r/'nested-backup',check_running=False)
 except ValueError:pass
 else:raise AssertionError('Overlapping profile accepted')
 with patch.object(m.Path,'is_symlink',lambda p:p.name=='settings.json'):
  try:m.checked_tree(source)
  except ValueError:pass
  else:raise AssertionError('Linked profile accepted')
 try:m.migrate(install,source,target,r/'second-backup',check_running=False)
 except ValueError:pass
 else:raise AssertionError('Existing target overwritten')
 pkg.write_text(json.dumps({'name':'spectrai'}))
 try:m.migrate(install,source,r/'ShineAI/Other',r/'third-backup',check_running=False)
 except ValueError:pass
 else:raise AssertionError('Official install accepted')
 print('Profile migration safety checks passed')
`;
  const result=execFileSync('python',['-c',script],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',windowsHide:true});
  assert.match(result,/safety checks passed/);
});
test('catalog migration updates built-in MCP references while preserving user prose, keys and transaction rollback',()=>{
  const script=String.raw`
import importlib.util,json,sqlite3,tempfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('catalog','scripts/migrate-brand-catalog.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as temp:
 r=Path(temp);database=r/'source.db';db=sqlite3.connect(database)
 db.execute('create table mcp_servers(id text primary key,name text,description text,source text,install_method text)')
 db.execute('insert into mcp_servers values(?,?,?,?,?)',(m.OLD,'SpectrAI Claw','SpectrAI browser','builtin','builtin'))
 db.execute('create table ai_providers(id text,name text,api_key text)')
 db.execute('insert into ai_providers values(?,?,?)',('claudeops-builtin','SpectrAI','ciphertext-unchanged'))
 db.execute('create table sessions(config text)')
 config={'initialPrompt':'spectrai-claw','apiKey':'spectrai-claw','mcpServerIds':[m.OLD],
 'systemPromptAppend':'SpectrAI tools\ncustom SpectrAI notes\nmcp__spectrai-agent__search_mcp_tools',
 'systemPromptBlocks':[{'source':'search_tools_prompt','content':'SpectrAI tools'},{'source':'custom_system_prompt','content':'custom SpectrAI notes'}],
 'env':{'spectrai-claw':'spectrai-claw'}}
 db.execute('insert into sessions values(?)',(json.dumps(config),));db.commit();db.close()
 result=m.migrate(database,r/'backup.db')
 db=sqlite3.connect(database)
 migrated=json.loads(db.execute('select config from sessions').fetchone()[0])
 assert migrated['initialPrompt']==config['initialPrompt'] and migrated['apiKey']==config['apiKey'] and migrated['env']==config['env']
 assert migrated['mcpServerIds']==[m.NEW] and 'mcp__shineai-agent' in migrated['systemPromptAppend']
 assert migrated['systemPromptBlocks'][0]['content']=='ShineAI tools'
 assert migrated['systemPromptBlocks'][1]==config['systemPromptBlocks'][1] and 'custom SpectrAI notes' in migrated['systemPromptAppend']
 assert db.execute('select api_key from ai_providers').fetchone()[0]=='ciphertext-unchanged'
 assert db.execute('select id,name from mcp_servers').fetchone()==(m.NEW,'ShineAI Claw')
 db.execute('insert into mcp_servers values(?,?,?,?,?)',(m.OLD,'Custom label','custom','builtin','builtin'));db.commit();db.close()
 try:m.migrate(database,r/'conflict-backup.db')
 except ValueError:pass
 else:raise AssertionError('Conflicting MCP entries merged')
 db=sqlite3.connect(database);assert db.execute('select count(*) from mcp_servers').fetchone()[0]==2;db.close()
 print('Catalog preservation checks passed')
`;
  assert.match(execFileSync('python',['-c',script],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',windowsHide:true}),/preservation checks passed/);
});
