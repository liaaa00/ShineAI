import { turnEvidence } from './dev-execution-model.mjs';
export function createExecutionUI({React,jsx,aggregate,open,preview,language,ToolCard,FileCard}) {
  const {useState,useMemo,useEffect}=React;
  return function ExecutionEvidence({messages,sessionId,busy,onReview}) {
    const zh=language().startsWith('zh');
    const [request,setRequest]=useState(undefined);
    const [requestError,setRequestError]=useState('');
    const evidence=useMemo(()=>turnEvidence(messages,aggregate,zh),[messages,zh]);
    useEffect(()=>{setRequest(undefined);setRequestError('');},[sessionId,messages.length,busy]);
    async function refreshRequest() {
      setRequestError('');
      try {setRequest(await window.development.getRequestSummary(sessionId));}
      catch {setRequestError(zh?'无法读取请求摘要，请重试':'Could not load the request summary. Retry.');}
    }
    const h=(tag,props,...children)=>jsx.jsxs(tag,{...props,children});
    const state=value=>value==='done'?(zh?'已完成':'Completed'):value==='failed'?(zh?'失败':'Failed'):busy?(zh?'进行中':'In progress'):(zh?'未收到完成结果':'No completion result');
    const action=(label,onClick,extra={})=>h('button',{type:'button',className:'text-accent-blue hover:underline',onClick,...extra},label);
    if(!messages.some(m=>m.role==='user'||m.role==='assistant')) return null;
    const section=(label,rows,render)=>h('section',{className:'py-2 border-t border-border-faint'},h('p',{className:'text-caption font-medium mb-1'},label),...rows.map(render));
    const toolRow=(info,index)=>h('details',{key:info.operation.id || index,className:'py-1'},h('summary',{className:'cursor-pointer break-all'},info.label,' · ',state(info.state),' · ',info.detail.slice(0,240)),info.evidence&&info.state==='done'&&action(zh?'在侧栏打开':'Open in sidebar',()=>open(info.evidence)),jsx.jsx(ToolCard,{operation:info.operation,compact:true}));
    const counts=[[evidence.files.length,zh?'个文件':'files'],[evidence.tests.length,zh?'条测试命令':'test commands'],[evidence.images.length,zh?'次图片操作':'image operations'],[evidence.skills.length,zh?'次技能调用':'skill calls']].filter(([count])=>count>0).map(([count,label])=>`${count} ${label}`);
    return h('details',{'data-testid':'execution-evidence',className:'mx-3 my-1 text-caption text-text-secondary'},
      h('summary',{className:'cursor-pointer py-1 text-text-muted'},zh?'本轮记录':'This turn',counts.length?' · '+counts.join(' · '):''),
      h('div',{className:'overflow-auto pr-2',style:{maxHeight:'40vh'}},
        h('div',{className:'flex items-center gap-3 flex-wrap py-1'},
          evidence.anchor&&action(zh?'审阅 / 撤销本轮':'Review / undo this turn',()=>onReview(evidence.anchor),{disabled:busy,title:zh?'先预览将影响的文件和对话，再决定是否撤销':'Preview affected files and messages before undoing'}),
          action(zh?'查看请求摘要':'Request summary',refreshRequest,{'data-testid':'request-summary-button'})),
        requestError&&h('p',{role:'alert'},requestError),
        request!==undefined&&h('div',{'data-testid':'request-summary',className:'py-2 break-all'},
          request? h('div',{},
            h('p',{},(zh?'模型：':'Model: ')+request.model+' · '+(request.protocol || request.adapter || '')),
            h('p',{},(zh?'配置强度：':'Configured effort: ')+(request.configuredEffort || (zh?'未指定':'Unspecified'))),
            h('p',{},request.stage==='outbound'?(zh?'已观察到出站参数：':'Observed outbound parameters: ')+JSON.stringify(request.parameters)+(zh?'；工具数：':'; tools: ')+request.toolCount:(zh?'目前仅记录到适配器配置，尚未观察到该请求的网络正文。':'Only adapter configuration is recorded; the network request body has not been observed.')),
            request.httpStatus&&h('p',{},'HTTP '+request.httpStatus),
            request.failure&&h('p',{},(zh?'请求异常：':'Request failure: ')+request.failure),
            h('p',{className:'text-text-muted'},new Date(request.recordedAt).toLocaleString()+' · '+(zh?'仅保存在本次运行内存中；服务商是否执行强度需由服务商确认。':'Kept in memory for this app run. Provider execution of effort requires provider evidence.'))
          ):h('p',{},zh?'本次启动后暂无该会话的请求记录。发送下一条消息后可查看。':'No request recorded for this session since startup. Check after the next message.')),
        evidence.files.length>0&&section(zh?'文件改动':'File changes',evidence.files,(file,index)=>h('div',{key:file.path,className:'py-1'},
          action(file.path,()=>open(file.path)),/\.html?$/i.test(file.path)&&action(zh?' · 预览':' · Preview',()=>preview(file.path)),
          file.diff&&jsx.jsx(FileCard,{message:{id:'evidence-'+index,sessionId,fileChange:{filePath:file.path,changeType:file.changeType||'edit',operationDiff:file.diff}}}))),
        evidence.tests.length>0&&section(zh?'测试命令与结果':'Test commands and results',evidence.tests,toolRow),
        evidence.images.length>0&&section(zh?'图片与截图':'Images and screenshots',evidence.images,toolRow),
        evidence.skills.length>0&&section(zh?'技能记录（加载完成不代表任务执行完成）':'Skills (loading does not establish task completion)',evidence.skills,toolRow)
      ));
  };
}
