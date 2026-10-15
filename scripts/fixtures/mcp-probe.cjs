const readline = require('node:readline');
const mode=process.argv[2];
const reply=(id,result)=>process.stdout.write(JSON.stringify({jsonrpc:'2.0',id,result})+'\n');
readline.createInterface({input:process.stdin}).on('line',line=>{
  const message=JSON.parse(line);
  if(message.method==='initialize')reply(message.id,mode==='bad-init'?{}:{protocolVersion:'2025-11-25',serverInfo:{name:'local-test',version:'1'},capabilities:{tools:{}}});
  if(message.method==='tools/list')reply(message.id,mode==='bad-tools'?{}:{tools:[{name:'local_test',inputSchema:{type:'object'}}]});
});
