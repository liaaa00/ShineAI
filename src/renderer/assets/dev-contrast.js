// Readability follows the *visible* wallpaper, without mutating theme tokens,
// media pixels, syntax colours, or the user's saved transparency preferences.
export const palettes = {
  darkInk: { ink: [23, 33, 46], secondary: [40, 55, 75], backing: [250, 252, 255] },
  lightInk: { ink: [246, 248, 252], secondary: [228, 234, 243], backing: [14, 20, 30] }
};
export function luminance(rgb) {
  const channels = rgb.map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; });
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
export function contrast(a, b) { return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); }
const blend = (pixel, backing, alpha) => pixel.map((value, i) => value * (1 - alpha) + backing[i] * alpha);
export function requiredBacking(pixels, palette) {
  const ink = luminance(palette.secondary);
  const passes = alpha => pixels.every(pixel => contrast(ink, luminance(blend(pixel, palette.backing, alpha))) >= 4.7);
  if (passes(0)) return 0;
  let low = 0, high = 1;
  for (let i = 0; i < 10; i++) { const middle = (low + high) / 2; if (passes(middle)) high = middle; else low = middle; }
  return Math.min(1, Math.ceil((high + .025) * 100) / 100);
}
export function choosePalette(pixels, previous) {
  const dark = requiredBacking(pixels, palettes.darkInk), light = requiredBacking(pixels, palettes.lightInk);
  // A near tie preserves the previous colour rather than chasing every frame.
  const best = dark <= light ? 'darkInk' : 'lightInk';
  return previous && Math.abs(dark - light) < .16 ? previous : best;
}
export function fittedRect(width, height, viewportWidth, viewportHeight, fit, x, y) {
  const scale = Math[fit === 'contain' ? 'min' : 'max'](viewportWidth / width, viewportHeight / height);
  const w = width * scale, h = height * scale;
  return { x: (viewportWidth - w) * x / 100, y: (viewportHeight - h) * y / 100, width: w, height: h };
}

const excluded = '#dev-background,#dev-edition-banner,.dev-preview,pre,code,.monaco-editor,.xterm,svg,canvas,[contenteditable="true"],[data-dev-media-label]';
const groups = '[data-message-id],.react-flow__node,.cn-node,article,button,[role="button"],input,textarea,[role="dialog"],[role="menu"],[role="listbox"],[role="tooltip"],[data-appearance-surface="chrome"]';
const rgb = color => `rgb(${color.join(' ')})`;
let registered = false, current, dirty = true, frame, snapshot, failed = false;
let colorCanvas;
const originals = new WeakMap(), states = new WeakMap();
const textElements = new Set(), regions = new Set(), labels = new Set();
const semanticElements = new Set();
let themeKey;

function clear() {
  for (const element of textElements) element.removeAttribute('data-dev-adaptive-text');
  for (const element of regions) {
    element.removeAttribute('data-dev-adaptive-region');
    for (const name of ['ink', 'secondary', 'scrim']) element.style.removeProperty('--dev-adaptive-' + name);
  }
  for (const element of labels) element.removeAttribute('data-dev-media-label');
  for (const element of semanticElements) {element.removeAttribute('data-dev-semantic-text');element.style.removeProperty('--dev-semantic-scrim');}
  semanticElements.clear();
  textElements.clear(); regions.clear(); labels.clear(); snapshot = null;
}
function neutral(element) {
  const signature = element.className + '|' + element.style.color;
  if (originals.get(element)?.signature === signature) return originals.get(element).value;
  element.removeAttribute('data-dev-adaptive-text');
  const color = getComputedStyle(element).color;
  colorCanvas ||= document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = 1;
  const context = colorCanvas.getContext('2d', {willReadFrequently:true});
  context.fillStyle = color; context.fillRect(0,0,1,1);
  const numbers = [...context.getImageData(0,0,1,1).data];
  // Preserve coloured links, warnings, success/error labels and syntax colours.
  const value = numbers?.length >= 3 && Math.max(...numbers.slice(0, 3)) - Math.min(...numbers.slice(0, 3)) < 42;
  originals.set(element, {signature,value,color:numbers.slice(0,3)}); return value;
}
function mediaLabel(element) {
  const overlay = element.closest('[class*="absolute"][class*="bottom"]');
  if (!overlay || !overlay.parentElement?.querySelector('img,video')) return false;
  overlay.setAttribute('data-dev-media-label', ''); labels.add(overlay); return true;
}
function collect() {
  const root = document.querySelector('#root');
  const result = new Map(); if (!root) return result;
  const add = element => {
    if (element.closest(excluded) || mediaLabel(element)) return;
    const box = element.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0 || box.right < 0 || box.bottom < 0 || box.left > innerWidth || box.top > innerHeight || !element.checkVisibility({checkVisibilityCSS:true,checkOpacity:true})) return;
    if (!neutral(element)) {
      const color = originals.get(element).color;
      const candidates = Object.values(palettes).map(p=>({...p,secondary:color}));
      const pixels = [[0,0,0],[255,255,255]];
      const choices = candidates.map(p=>({palette:p,alpha:requiredBacking(pixels,p)})).sort((a,b)=>a.alpha-b.alpha);
      const {palette,alpha} = choices[0];
      setStyle(element,'--dev-semantic-scrim',`rgb(${palette.backing.join(' ')} / ${alpha})`);
      element.setAttribute('data-dev-semantic-text','');semanticElements.add(element);
      return;
    }
    if (semanticElements.delete(element)) {
      element.removeAttribute('data-dev-semantic-text');element.style.removeProperty('--dev-semantic-scrim');
    }
    const region = element.closest(groups) || element.closest('p,li,h1,h2,h3,h4,h5,label,button') || element;
    if (!result.has(region)) result.set(region, []);
    result.get(region).push(element);
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) if (node.textContent.trim() && node.parentElement) add(node.parentElement);
  for (const input of root.querySelectorAll('input:not([type="checkbox"]):not([type="range"]),textarea')) add(input);
  // A selected dialog may contain messages. One backing per subtree prevents
  // nested translucent layers from accumulating into an opaque panel.
  for (const [region, elements] of [...result]) {
    let parent = region.parentElement;
    while (parent && !result.has(parent)) parent = parent.parentElement;
    if (parent) { result.get(parent).push(...elements); result.delete(region); }
  }
  // Canvas-rendered editors keep their theme/ANSI/syntax palette. Their local
  // backing follows that palette rather than recolouring painted glyphs.
  for (const element of root.querySelectorAll('pre,.monaco-editor,.xterm')) {
    const box = element.getBoundingClientRect();
    if (box.width > 0 && box.height > 0 && element.checkVisibility()) result.set(element, null);
  }
  return result;
}
function sampleFrame() {
  const {element, values, config, base} = current;
  const width = element.videoWidth || element.naturalWidth, height = element.videoHeight || element.naturalHeight;
  if (!width || !height) return null;
  frame ||= document.createElement('canvas'); frame.width = 128; frame.height = 80;
  const ctx = frame.getContext('2d', {willReadFrequently:true});
  ctx.globalAlpha = 1; ctx.fillStyle = base; ctx.fillRect(0, 0, 128, 80);
  const rect = fittedRect(width, height, innerWidth, innerHeight, config.fit, config.positionX, config.positionY);
  ctx.globalAlpha = values.strength / 100;
  ctx.drawImage(element, rect.x * 128 / innerWidth, rect.y * 80 / innerHeight, rect.width * 128 / innerWidth, rect.height * 80 / innerHeight);
  // The single main-window tint sits above the media mask. Match compositing.
  ctx.globalAlpha = 1 - (1 - values.mask / 100) * (values.transparency / 100);
  ctx.fillStyle = base; ctx.fillRect(0, 0, 128, 80); ctx.globalAlpha = 1;
  return ctx.getImageData(0, 0, 128, 80).data;
}
function pixelsFor(box) {
  if (!snapshot) return [[0,0,0],[255,255,255]]; // Safe local backing if canvas sampling is unavailable.
  const left = Math.max(0, Math.min(127, Math.floor(box.left / innerWidth * 128)));
  const top = Math.max(0, Math.min(79, Math.floor(box.top / innerHeight * 80)));
  const right = Math.max(left + 1, Math.min(128, Math.ceil(box.right / innerWidth * 128)));
  const bottom = Math.max(top + 1, Math.min(80, Math.ceil(box.bottom / innerHeight * 80)));
  const pixels = [];
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
    const p = (y * 128 + x) * 4; pixels.push([snapshot[p], snapshot[p+1], snapshot[p+2]]);
  }
  // Luminance extremes are insufficient for coloured RGB blends. Keep a
  // small channel-distributed sample plus extremes for the contrast solver.
  if (pixels.length <= 160) return pixels;
  const sorted = [...pixels].sort((a,b)=>luminance(a)-luminance(b));
  return [sorted[0], sorted.at(-1), ...pixels.filter((_p,i)=>i % Math.ceil(pixels.length / 150) === 0)];
}
function setStyle(element, name, value) {
  if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
}
function refresh() {
  if (!current?.enabled || document.hidden) return;
  const moving = current.element.tagName === 'VIDEO' ? !current.element.paused : current.moving;
  if (!dirty && !moving) return;
  dirty = false;
  try { if (!failed) snapshot = sampleFrame(); } catch { failed = true; snapshot = null; }
  if (!snapshot && !failed) dirty = true;
  const collected = collect(), now = performance.now();
  for (const label of labels) if (!label.isConnected) labels.delete(label);
  for (const element of semanticElements) if (!element.isConnected) semanticElements.delete(element);
  for (const old of regions) if (!collected.has(old)) {
    old.removeAttribute('data-dev-adaptive-region');
    for (const name of ['ink','secondary','scrim']) old.style.removeProperty('--dev-adaptive-' + name);
    regions.delete(old);
  }
  const activeText = new Set();
  for (const [region, elements] of collected) {
    const pixels = pixelsFor(region.getBoundingClientRect());
    let state = states.get(region), next = choosePalette(pixels, state?.palette);
    if (!elements) next = current.dark ? 'lightInk' : 'darkInk';
    if (!state || state.key !== current.key) state = {key:current.key,palette:next,changed:now};
    if (next !== state.palette) {
      if (state.candidate !== next) { state.candidate = next; state.since = now; }
      // A video must sustain its new lighting for 3 seconds. During rapid cuts
      // only the backing changes, so lettering never flashes black and white.
      if (!moving || (now - state.since >= 3000 && now - state.changed >= 5000)) {state.palette = next;state.changed = now;}
    } else state.candidate = null;
    states.set(region, state);
    const palette = palettes[state.palette];
    // Editors and code paint their own themed foregrounds. A stronger local
    // backing protects syntax/ANSI colours, including inside a tinted message.
    const alpha = Math.max(elements ? 0 : .92, requiredBacking(pixels, palette));
    setStyle(region, '--dev-adaptive-ink', rgb(palette.ink));
    setStyle(region, '--dev-adaptive-secondary', rgb(palette.secondary));
    setStyle(region, '--dev-adaptive-scrim', `rgb(${palette.backing.join(' ')} / ${alpha})`);
    region.setAttribute('data-dev-adaptive-region', state.palette); regions.add(region);
    for (const element of elements || []) {
      if (!element.hasAttribute('data-dev-adaptive-text')) element.setAttribute('data-dev-adaptive-text', '');
      activeText.add(element); textElements.add(element);
    }
  }
  for (const old of textElements) if (!activeText.has(old)) {old.removeAttribute('data-dev-adaptive-text');textElements.delete(old);}
}
export function updateReadability(options) {
  if (!registered) {
    registered = true;
    const style = document.createElement('style'); style.id = 'dev-adaptive-contrast';
    style.textContent = `
html[data-dev-material="on"] #root [data-dev-adaptive-region]{background-color:var(--dev-adaptive-scrim)!important;background-image:none!important}
html[data-dev-material="on"] #root [data-dev-adaptive-text]{color:var(--dev-adaptive-ink)!important}
html[data-dev-material="on"] #root :is(input,textarea)[data-dev-adaptive-text]::placeholder{color:var(--dev-adaptive-secondary)!important;opacity:1}
html[data-dev-material="on"] #root [data-dev-media-label]{background:rgb(14 20 30 / .86)!important;color:#f6f8fc!important}
html[data-dev-material="on"] #root [data-dev-media-label] *{color:#f6f8fc!important}
html[data-dev-material="on"] #root [data-dev-semantic-text]{background-color:var(--dev-semantic-scrim)!important;border-radius:3px}
`;
    document.head.append(style);
    const changed = () => {dirty = true;};
    new MutationObserver(records => {
      // Ignore our custom properties and the material adapter's bookkeeping.
      if (records.some(record => record.type !== 'attributes' || record.attributeName === 'class' ||
        (record.target.style.color && originals.get(record.target)?.signature !== record.target.className + '|' + record.target.style.color))) changed();
    }).observe(document.querySelector('#root') || document.body, {childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});
    addEventListener('resize', changed); document.addEventListener('scroll', changed, true);
    document.addEventListener('visibilitychange', changed);
    setInterval(refresh, 1200);
  }
  if (!options.enabled) {clear();current = options;return;}
  if (themeKey !== options.base) {
    clear(); themeKey = options.base;
    // Theme styles have now been restored for subsequent neutral classification.
    for (const element of document.querySelectorAll('#root *')) originals.delete(element);
  }
  if (current?.key !== options.key) {snapshot = null;failed = false;}
  current = options; dirty = true; requestAnimationFrame(refresh);
}
