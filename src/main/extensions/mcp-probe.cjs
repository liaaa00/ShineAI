'use strict';
const path = require('node:path');
const { spawn, execFile } = require('node:child_process');
const { StringDecoder } = require('node:string_decoder');

function probeMcp(command, args, env, {timeoutMs = 15000} = {}) {
  return new Promise((resolve,reject) => {
    const shell = process.platform === 'win32' && (/\.(cmd|bat)$/i.test(command) || !path.isAbsolute(command));
    const child = spawn(command,args,{env,stdio:['pipe','pipe','pipe'],windowsHide:true,shell});
    const decoder = new StringDecoder('utf8');
    let pending = '', bytes = 0, stage = 'initialize', settled = false;
    const finish = (error, count) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (process.platform === 'win32' && shell && child.pid) execFile('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},() => {});
      else child.kill();
      error ? reject(error) : resolve(count);
    };
    const timer = setTimeout(() => finish(new Error('MCP 协议测试超时（15 秒），请检查命令、网络或服务日志')),timeoutMs);
    const send = message => { if (!settled && !child.stdin.destroyed) child.stdin.write(JSON.stringify({jsonrpc:'2.0',...message})+'\n'); };
    child.stdin.on('error',error => finish(new Error('MCP 输入通道关闭：'+error.code)));
    child.on('error',error => finish(new Error('无法启动 MCP：'+error.code)));
    child.on('close',code => finish(new Error('MCP 在协议验证完成前退出（'+code+'），请检查启动参数和环境变量')));
    child.stderr.on('data',() => {}); // Never echo environment values or server stderr into UI diagnostics.
    child.stdout.on('data',chunk => {
      bytes += chunk.length;
      if (bytes > 1024*1024) return finish(new Error('MCP 测试响应超过上限'));
      pending += decoder.write(chunk);
      let newline;
      while (!settled && (newline=pending.indexOf('\n')) >= 0) {
        const line=pending.slice(0,newline).trim(); pending=pending.slice(newline+1);
        let message; try { message=JSON.parse(line); } catch { continue; }
        const expected=stage === 'initialize' ? 0 : 1;
        if (message?.jsonrpc !== '2.0' || message.id !== expected) continue;
        if (message.error) return finish(new Error('MCP 返回协议错误，请检查服务配置'));
        const result=message.result;
        if (stage === 'initialize') {
          if (!result || typeof result.protocolVersion !== 'string' || typeof result.serverInfo?.name !== 'string' || !result.capabilities || typeof result.capabilities !== 'object') return finish(new Error('MCP 初始化响应无效'));
          if (!result.capabilities.tools) return finish(null,0);
          stage='tools'; send({method:'notifications/initialized'}); send({id:1,method:'tools/list'});
        } else {
          if (!Array.isArray(result?.tools) || result.tools.some(tool => typeof tool?.name !== 'string' || !tool.name || !tool.inputSchema || typeof tool.inputSchema !== 'object')) return finish(new Error('MCP 工具列表响应无效'));
          finish(null,result.tools.length);
        }
      }
    });
    send({id:0,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'shineai-dev-test',version:'1.0.6'}}});
  });
}
module.exports = { probeMcp };
