// Only receives SVG produced by the existing strict Mermaid renderer.
export function createDiagramViewer({React,jsx,createPortal,language}) {
 const clamp=value=>Math.min(16,Math.max(.01,value));
 function prepare(svg,id) {
  const doc=new DOMParser().parseFromString(svg,'image/svg+xml'),node=doc.documentElement;
  const box=node.viewBox?.baseVal;
  const width=box?.width||parseFloat(node.getAttribute('width'))||800;
  const height=box?.height||parseFloat(node.getAttribute('height'))||600;
  node.setAttribute('width',width);node.setAttribute('height',height);
  node.style.width=width+'px';node.style.height=height+'px';node.style.maxWidth='none';
  // Mermaid uses IDs in markers and selectors. Avoid collisions with the inline
  // diagram that remains mounted underneath this separate viewer.
  let markup=new XMLSerializer().serializeToString(node);
  const ids=[...node.querySelectorAll('[id]'),node].map(n=>n.id).filter(Boolean).sort((a,b)=>b.length-a.length);
  for(const old of new Set(ids))markup=markup.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![a-zA-Z0-9_-])','g'),id+'-'+old);
  return {markup,width,height};
 }
 return function DiagramViewer({svg,onClose,onCopy,onExport,copied}) {
  const zh=language().startsWith('zh'),rawId=React.useId();
  const image=React.useMemo(()=>prepare(svg,'expanded-'+rawId.replace(/[^a-z0-9]/gi,'')),[svg,rawId]);
  const dialog=React.useRef(null),canvas=React.useRef(null),drag=React.useRef(null),fitMode=React.useRef(true);
  const [pose,setPose]=React.useState({scale:1,x:0,y:0});
  const fit=React.useCallback(()=>{
   if(!canvas.current)return;
   fitMode.current=true;
   setPose({scale:clamp(Math.min((canvas.current.clientWidth-48)/image.width,(canvas.current.clientHeight-48)/image.height)),x:0,y:0});
  },[image]);
  const zoom=React.useCallback((factor,clientX,clientY)=>{
   const rect=canvas.current?.getBoundingClientRect();if(!rect)return;
   const x=clientX==null?0:clientX-rect.left-rect.width/2,y=clientY==null?0:clientY-rect.top-rect.height/2;
   fitMode.current=false;setPose(p=>{const scale=clamp(p.scale*factor),ratio=scale/p.scale;return {scale,x:x-(x-p.x)*ratio,y:y-(y-p.y)*ratio};});
  },[]);
  const actual=()=>{fitMode.current=false;setPose({scale:1,x:0,y:0});};
  React.useLayoutEffect(()=>{
   const root=document.getElementById('root'),banner=document.getElementById('dev-edition-banner'),opener=document.activeElement;
   const previous=[root,banner].filter(Boolean).map(el=>[el,el.style.visibility,el.style.opacity]);
   // Hide underlying controls without adding a tint or another wallpaper layer.
   // Native modal focus prevents the background UI from receiving input.
   previous.forEach(([el])=>{el.style.visibility='hidden';el.style.opacity='0';});
   dialog.current.showModal();fit();
   const resize=new ResizeObserver(()=>{if(fitMode.current)fit();});resize.observe(canvas.current);
   const wheel=event=>{if(!event.ctrlKey)return;event.preventDefault();zoom(event.deltaY<0?1.2:1/1.2,event.clientX,event.clientY);};
   const element=canvas.current;element.addEventListener('wheel',wheel,{passive:false});
   return()=>{resize.disconnect();element.removeEventListener('wheel',wheel);dialog.current?.close();previous.forEach(([el,visibility,opacity])=>{el.style.visibility=visibility;el.style.opacity=opacity;});if(opener?.isConnected)opener.focus({preventScroll:true});};
  },[fit,zoom]);
  const button=(label,onClick,props={})=>jsx.jsx('button',{type:'button',onClick,...props,children:label});
  const pointerUp=event=>{drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);};
  return createPortal(jsx.jsxs('dialog',{
   ref:dialog,className:'dev-diagram-viewer','aria-label':zh?'图表放大查看':'Expanded diagram','data-testid':'diagram-viewer',
   onCancel:event=>{event.preventDefault();onClose();},
   onKeyDown:event=>{event.stopPropagation();if(event.key==='+'||event.key==='='){event.preventDefault();zoom(1.2);}else if(event.key==='-'){event.preventDefault();zoom(1/1.2);}else if(event.key==='0'){event.preventDefault();fit();}},
   children:[
    jsx.jsxs('header',{className:'dev-diagram-viewer-toolbar',children:[
     jsx.jsx('strong',{children:zh?'图表 · 放大查看':'Diagram · expanded view'}),
     jsx.jsx('span',{className:'dev-diagram-viewer-hint',children:zh?'Ctrl + 滚轮缩放 · 拖拽平移':'Ctrl + wheel to zoom · drag to pan'}),
     jsx.jsx('output',{'data-testid':'diagram-viewer-zoom','aria-live':'polite',children:Math.round(pose.scale*100)+'%'}),
     button('−',()=>zoom(1/1.2),{'aria-label':zh?'缩小':'Zoom out'}),button('+',()=>zoom(1.2),{'aria-label':zh?'放大':'Zoom in'}),
     button(zh?'适合窗口':'Fit to window',fit),button('100%',actual),
     button(copied?(zh?'已复制':'Copied'):(zh?'复制源码':'Copy source'),onCopy),button(zh?'导出 SVG':'Export SVG',onExport),
     button(zh?'关闭 · Esc':'Close · Esc',onClose,{'data-testid':'diagram-viewer-close',autoFocus:true})
    ]}),
    jsx.jsx('div',{
     ref:canvas,className:'dev-diagram-viewer-canvas','data-testid':'diagram-viewer-canvas',
     onPointerDown:event=>{if(event.button!==0)return;event.preventDefault();fitMode.current=false;drag.current={x:event.clientX,y:event.clientY,panX:pose.x,panY:pose.y};event.currentTarget.setPointerCapture(event.pointerId);},
     onPointerMove:event=>{const d=drag.current;if(d)setPose(p=>({...p,x:d.panX+event.clientX-d.x,y:d.panY+event.clientY-d.y}));},
     onPointerUp:pointerUp,onPointerCancel:pointerUp,
     children:jsx.jsx('div',{className:'dev-diagram-viewer-image',style:{width:image.width,height:image.height,transform:`translate(-50%,-50%) translate(${pose.x}px,${pose.y}px) scale(${pose.scale})`},dangerouslySetInnerHTML:{__html:image.markup}})
    })
   ]
  }),document.body);
 };
}
