const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { repositoryPlan, selectFiles, installRepositorySkill } = require('../src/main/extensions/public-skill-install.cjs');

test('SKILL.md installs its directory even when its first command is a search example', () => {
  const plan = repositoryPlan('vercel-labs/skills', 'find-skills', { path: 'skills/find-skills/SKILL.md', branch: 'main', content: '```sh\nnpx skills find [query] [--owner <owner>]\n```' });
  assert.equal(plan.method, 'repository');
  assert.equal(plan.directory, 'skills/find-skills');
  assert.equal(repositoryPlan('example/repo', 'tool', { path: 'tool/README.md', branch: 'main' }), null);
});

test('repository downloads retain scripts and assets, exclude sibling skills, and reject unsafe paths', () => {
  const blob = name => ({ type: 'blob', path: 'skills/find-skills/' + name });
  const selected = selectFiles([blob('SKILL.md'), blob('scripts/search.js'), blob('assets/template.txt'), {type:'blob', path:'skills/other/SKILL.md'}], 'skills/find-skills');
  assert.equal(selected.length, 3);
  for (const unsafe of ['../escape', 'scripts/../../escape', 'C:/escape', 'scripts\\escape', 'NUL.txt']) assert.throws(() => selectFiles([blob('SKILL.md'), blob(unsafe)], 'skills/find-skills'));
  assert.throws(() => selectFiles([blob('SKILL.md'), { ...blob('script'), mode: '120000' }], 'skills/find-skills'));
});

test('download/DB failures leave the prior installation intact; successful install registers complete files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'shineai-skill-'));
  const old = { id: 'previous', tags: ['mk:example/repo/find-skills'], name: 'Old skill', isEnabled:false };
  let saved = old, failWrite = false;
  const database = { getAllSkills: () => [saved], getSkill: () => saved, updateSkill: (_id, skill) => { if (failWrite) throw new Error('DB write failed'); saved = skill; } };
  const options = { source: 'example/repo', skillId: 'find-skills', detail: {detailPath:'skills/find-skills/SKILL.md',detailBranch:'main'}, tree: [{type:'blob',path:'skills/find-skills/SKILL.md'}, {type:'blob',path:'skills/find-skills/scripts/search.js'}], skillsRoot:root, database, parseSkill: () => ({name:'find-skills',promptTemplate:'Search skills',slashCommand:'find-skills'}) };
  await fs.mkdir(path.join(root, 'previous')); await fs.writeFile(path.join(root, 'previous', 'SKILL.md'), 'Old skill');
  try {
    await assert.rejects(installRepositorySkill({...options,fetchFile:async()=>new Response('missing',{status:404})}), /不存在/);
    assert.equal(await fs.readFile(path.join(root, 'previous/SKILL.md'),'utf8'), 'Old skill');
    failWrite = true;
    await assert.rejects(installRepositorySkill({...options,fetchFile:async()=>new Response('New skill')}), /DB write failed/);
    assert.equal(await fs.readFile(path.join(root, 'previous/SKILL.md'),'utf8'), 'Old skill');
    failWrite = false;
    const result = await installRepositorySkill({...options,fetchFile:async()=>new Response('New skill')});
    assert.equal(result.files, 2); assert.equal(result.skill.id, 'previous');
    assert.equal(result.skill.isEnabled,false);
    assert.equal(await fs.readFile(path.join(root, 'previous/scripts/search.js'),'utf8'), 'New skill');
    assert.deepEqual(await fs.readdir(root), ['previous']);
  } finally { await fs.rm(root, {recursive:true,force:true}); }
});

test('repository installs reject concurrency and changed blobs, and normalize lowercase skill.md', async () => {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'shineai-skill-'));
  const body='Actual skill instructions';
  const sha=crypto.createHash('sha1').update(Buffer.from('blob '+Buffer.byteLength(body)+'\0')).update(body).digest('hex');
  let saved,release;
  const waiting=new Promise(resolve=>{release=resolve;});
  const options={source:'example/repo',skillId:'lowercase',detail:{detailPath:'skills/lowercase/skill.md',detailBranch:'HEAD'},tree:[{type:'blob',path:'skills/lowercase/skill.md',sha}],skillsRoot:root,database:{getAllSkills:()=>saved?[saved]:[],getSkill:()=>saved,createSkill:s=>{saved=s;}},parseSkill:()=>({name:'Lowercase',promptTemplate:body})};
  try {
    const first=installRepositorySkill({...options,fetchFile:async()=>{await waiting;return new Response(body);}});
    await assert.rejects(installRepositorySkill({...options,fetchFile:async()=>assert.fail('Concurrent download')}),/正在安装/);
    release();const installed=await first;
    assert.equal(await fs.readFile(path.join(installed.skill.dirPath,'SKILL.md'),'utf8'),body);
    await assert.rejects(installRepositorySkill({...options,fetchFile:async()=>new Response('Changed body')}),/仓库内容已变化/);
    assert.equal(await fs.readFile(path.join(installed.skill.dirPath,'SKILL.md'),'utf8'),body);
    assert.deepEqual(await fs.readdir(root),[installed.skill.id]);
  } finally {release();await fs.rm(root,{recursive:true,force:true});}
});
