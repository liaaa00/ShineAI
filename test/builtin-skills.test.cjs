const {test}=require('node:test');
const assert=require('node:assert/strict');
const {definitions,installBuiltinSkills}=require('../src/main/extensions/builtin-skills.cjs');
const baseline=require('./fixtures/builtin-skills-legacy.json');
function database(records=[]) {
  const rows=new Map(records.map(s=>[s.id,structuredClone(s)]));let writes=0;
  return {rows,get writes(){return writes;},getSkill:id=>rows.get(id),updateSkill(id,p){writes++;Object.assign(rows.get(id),structuredClone(p));},skillRepo:{insertOrIgnore(s){if(!rows.has(s.id)){writes++;rows.set(s.id,structuredClone(s));}}}};
}
test('new builtin definitions match their commands and retain orchestration/provider identities',()=>{
 const next=definitions(baseline),get=id=>next.find(s=>s.id==='builtin-'+id);
 assert.equal(get('translate').name,'内容翻译');assert.equal(get('write-test').inputVariables[0].description,'测试框架');
 for(const id of ['explain','refactor','office-hours','benchmark','retro'])assert.doesNotMatch(get(id).promptTemplate,/请对以下代码进行全面审查|ģʽ|专业术语保持准确/);
 assert.match(get('cso-security-audit').promptTemplate,/不修改文件/);
 for(let i=0;i<next.length;i++)for(const key of ['id','slashCommand','type','compatibleProviders'])assert.deepEqual(next[i][key],baseline[i][key]);
 assert.deepEqual(get('prompt-optimizer-advanced').orchestrationConfig,baseline.find(s=>s.id===get('prompt-optimizer-advanced').id).orchestrationConfig);
 assert.match(get('parallel-analysis').orchestrationConfig.steps[0].promptTemplate,/可行性/);
 assert.notEqual(get('translate').name,baseline.find(s=>s.slashCommand==='translate').name);
});
test('migration fixes exact old default fields while preserving customized prompts, options and enable state',()=>{
 const rows=structuredClone(baseline),translate=rows.find(s=>s.slashCommand==='translate');
 translate.promptTemplate='USER CUSTOM {{user_input}}';translate.isEnabled=false;translate.tags=['keep'];
 const tests=rows.find(s=>s.slashCommand==='write-test');tests.inputVariables[0].defaultValue='pytest';
 const other={...rows[3],id:'custom-skill',source:'custom',name:'自建技能',promptTemplate:'KEEP'};rows.push(other);
 const db=database(rows);installBuiltinSkills(db,baseline);
 assert.equal(db.getSkill(translate.id).name,'内容翻译');assert.equal(db.getSkill(translate.id).promptTemplate,translate.promptTemplate);
 assert.equal(db.getSkill(translate.id).isEnabled,false);assert.deepEqual(db.getSkill(translate.id).tags,['keep']);
 assert.deepEqual(db.getSkill(tests.id).inputVariables,tests.inputVariables);assert.deepEqual(db.getSkill(other.id),other);
 const count=db.writes;installBuiltinSkills(db,baseline);assert.equal(db.writes,count);
});
test('builtin ID collisions with imported or reassigned skills are not overwritten',()=>{
 const records=structuredClone(baseline);records[2].source='local';records[3].slashCommand='my-explain';records[4].name='我的测试';
 const db=database(records);installBuiltinSkills(db,baseline);
 assert.deepEqual(db.getSkill(records[2].id),records[2]);assert.deepEqual(db.getSkill(records[3].id),records[3]);assert.equal(db.getSkill(records[4].id).name,'我的测试');
 const fresh=database();installBuiltinSkills(fresh,baseline);assert.equal(fresh.rows.size,baseline.length);assert.equal(fresh.getSkill('builtin-explain').name,'解释代码');
});
