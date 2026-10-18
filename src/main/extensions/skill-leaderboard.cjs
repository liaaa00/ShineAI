'use strict';

function arrayEnd(text,start) {
  let depth=0,string=false,escaped=false;
  for(let i=start;i<text.length;i++) {
    const c=text[i];
    if(string) { if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')string=false;continue; }
    if(c==='"')string=true;
    else if(c==='[')depth++;
    else if(c===']' && --depth===0)return i+1;
  }
  throw Object.assign(new Error('Incomplete array'),{code:'MARKET_FORMAT'});
}
function parseSkillsPage(html) {
  const payloads=[];
  for(const match of html.matchAll(/self\.__next_f\.push\(\s*(?=\[)/g)) {
    const start=match.index+match[0].length;
    try { const part=JSON.parse(html.slice(start,arrayEnd(html,start))); if(typeof part[1]==='string')payloads.push(part[1]); } catch {}
  }
  const text=payloads.length?payloads.join(''):html;
  const marker=/"initialSkills"\s*:\s*(?=\[)/.exec(text);
  if(!marker)throw Object.assign(new Error('Missing initialSkills'),{code:'MARKET_FORMAT'});
  let rows;
  try {const start=marker.index+marker[0].length;rows=JSON.parse(text.slice(start,arrayEnd(text,start)));}
  catch {throw Object.assign(new Error('Invalid skill list'),{code:'MARKET_FORMAT'});}
  if(!Array.isArray(rows)||rows.length>20000)throw Object.assign(new Error('Invalid skill list'),{code:'MARKET_FORMAT'});
  // The public market also lists domain-based publishers, not only GitHub repos.
  // This is display metadata; installation retains its own source validation.
  const valid=rows.filter(s=>s && typeof s.source==='string' && s.source.trim().length>0 && s.source.length<=500 && typeof s.skillId==='string' && s.skillId.length>0 && s.skillId.length<=250 && typeof s.name==='string' && s.name.length<=500);
  if(rows.length && !valid.length)throw Object.assign(new Error('Invalid skill entries'),{code:'MARKET_FORMAT'});
  return valid;
}
function failure(error) {
  const code=error?.code || error?.cause?.code;
  if(code==='MARKET_FORMAT')return {errorCode:code,error:'社区市场页面格式发生变化，暂时无法读取列表。请稍后重试。'};
  if(code==='MARKET_HTTP')return {errorCode:code,error:'社区市场返回 HTTP '+error.status+'，请稍后重试。'};
  if(error?.name==='TimeoutError'||error?.name==='AbortError'||/TIMEOUT/.test(code||''))return {errorCode:'MARKET_TIMEOUT',error:'社区市场连接超时，请检查网络或代理后重试。'};
  if(code==='ENOTFOUND'||code==='EAI_AGAIN')return {errorCode:'MARKET_DNS',error:'无法解析 skills.sh，请检查网络或 DNS 后重试。'};
  return {errorCode:'MARKET_NETWORK',error:'无法连接 skills.sh，请检查网络或代理后重试。'};
}
function createLeaderboard({fetchPage=globalThis.fetch,now=Date.now,ttl=30*60*1000}={}) {
  let cache=null,pending=null;
  async function refresh() {
    try {
      const response=await fetchPage('https://skills.sh/',{signal:AbortSignal.timeout(20000),headers:{Accept:'text/html','User-Agent':'ShineAI-SkillBrowser/1.0'}});
      if(!response.ok)throw Object.assign(new Error('Market HTTP'),{code:'MARKET_HTTP',status:response.status});
      // Bound the page before parsing. Never evaluate scripts supplied by a market.
      const chunks=[];let size=0;
      for await(const bytes of response.body) {size+=bytes.length;if(size>5*1024*1024)throw Object.assign(new Error('Market page too large'),{code:'MARKET_FORMAT'});chunks.push(bytes);}
      const data=parseSkillsPage(Buffer.concat(chunks).toString('utf8'));
      cache={data,fetchedAt:now()};
      return {success:true,...cache,stale:false};
    } catch(error) {return {success:false,...failure(error),data:cache?.data||[],fetchedAt:cache?.fetchedAt||null,stale:!!cache};}
  }
  return async function load({force=false}={}) {
    if(!force&&cache&&now()-cache.fetchedAt<ttl)return {success:true,...cache,stale:false};
    if(!pending)pending=refresh().finally(()=>{pending=null;});
    return pending;
  };
}
const fetchLeaderboard=createLeaderboard();
module.exports={parseSkillsPage,createLeaderboard,fetchLeaderboard};
