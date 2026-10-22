import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
function once(s,from,to){if(s.includes(to))return s;if(s.split(from).length!==2)throw Error('Diagram viewer anchor changed: '+from.slice(0,100));return s.replace(from,to);}
export function patchDiagramViewerRenderer(s){
 s=s.replace(/\r\n/g,'\n');
 if(!s.includes('import { createDiagramViewer }'))s='import { createDiagramViewer } from "./dev-diagram-viewer.mjs";\n'+s;
 s=once(s,'const MermaidBlock = ({ source: source2, className }) => {','const DiagramViewer = createDiagramViewer({React:reactExports,jsx:jsxRuntimeExports,createPortal:reactDomExports.createPortal,language:()=>instance.language});\nconst MermaidBlock = ({ source: source2, className }) => {\n  const [expandedDiagram,setExpandedDiagram] = reactExports.useState(false);');
 s=once(s,'className: joinClassNames$2("mermaid-block overflow-hidden rounded-xl border border-border/70", className),\n      "data-mode": view,\n      children: [','className: joinClassNames$2("mermaid-block overflow-hidden rounded-xl border border-border/70", className),\n      "data-mode": view,\n      children: [\n        expandedDiagram && svg2 && jsxRuntimeExports.jsx(DiagramViewer,{svg:svg2,onClose:()=>setExpandedDiagram(false),onCopy:handleCopy,onExport:handleExport,copied}),');
 s=once(s,'className: "mermaid-block__actions flex min-w-0 flex-wrap items-center justify-end gap-1", children: [','className: "mermaid-block__actions flex min-w-0 flex-wrap items-center justify-end gap-1", children: [\n            canInspect && jsxRuntimeExports.jsxs("button",{type:"button",onClick:()=>setExpandedDiagram(true),"data-testid":"diagram-expand",className:"inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-text-muted transition-colors hover:text-text-secondary",children:[jsxRuntimeExports.jsx(Maximize2,{className:"h-3.5 w-3.5"}),instance.language.startsWith("zh")?"放大查看":"Expand diagram"]}),');
 return s;
}
export function patchDiagramViewerFiles(){const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),file=path.join(root,'src/renderer/assets/index-0LVJEr5c.js');fs.writeFileSync(file,patchDiagramViewerRenderer(fs.readFileSync(file,'utf8')));const htmlFile=path.join(root,'src/renderer/index.html');let html=fs.readFileSync(htmlFile,'utf8');if(!html.includes('dev-diagram-viewer.css'))html=html.replace('</head>','<link rel="stylesheet" href="./assets/dev-diagram-viewer.css">\n  </head>');fs.writeFileSync(htmlFile,html);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))patchDiagramViewerFiles();
