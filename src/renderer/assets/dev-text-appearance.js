// Manual, opt-in text styling. No pixel sampling, font replacement or backing panels.
const textTokens=['color-text-primary','color-text-secondary','color-text-muted','color-text-tertiary','color-text-disabled','v2-text-primary','v2-text-secondary','v2-text-muted','v2-text-dim'];
export const defaultText=mode=>({enabled:false,color:null,outlineWidth:0.5,outlineOpacity:60,outlineColor:mode==='dark'?'#000000':'#ffffff'});
export function applyTextAppearance(settings,backgroundActive) {
  const root=document.documentElement,text=settings||defaultText('light');
  const active=Boolean(backgroundActive&&text.enabled);
  // Capture theme values outside #root, where manual overrides are scoped.
  // Editors, code blocks and these settings can retain the real theme palette.
  const theme=getComputedStyle(root);
  for(const token of textTokens)root.style.setProperty('--dev-base-'+token,theme.getPropertyValue('--'+token).trim()||theme.getPropertyValue('--color-text-primary').trim());
  root.dataset.devTextColor=active&&text.color?'on':'off';
  root.dataset.devTextOutline=active&&text.outlineWidth>0&&text.outlineOpacity>0?'on':'off';
  root.style.setProperty('--dev-text-color',text.color||theme.getPropertyValue('--color-text-primary').trim());
  const hex=text.outlineColor;
  const color=`rgba(${[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',')},${text.outlineOpacity/100})`;
  const size=text.outlineWidth;
  root.style.setProperty('--dev-text-outline',[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]].map(([x,y])=>`${x*size}px ${y*size}px 0 ${color}`).join(','));
}
