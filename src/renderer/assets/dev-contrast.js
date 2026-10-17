// Text-only wallpaper adaptation. Never paint backgrounds, change transparency,
// blur the media, or replace semantic / syntax colours.
export const palettes = {
  darkInk: {ink: [23, 33, 46], secondary: [40, 55, 75], edge: '255 255 255'},
  lightInk: {ink: [246, 248, 252], secondary: [228, 234, 243], edge: '0 0 0'}
};
export function luminance(rgb) {
  const channels = rgb.map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; });
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
export function contrast(a, b) { return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); }
export function choosePalette(pixels, previous = 'lightInk') {
  if (!pixels.length) return previous;
  // Compare average log contrast so an isolated highlight cannot dominate the
  // whole line. A near tie retains the current ink on busy backgrounds.
  const score = palette => pixels.reduce((sum, pixel) => sum + Math.log(contrast(luminance(palette.ink), luminance(pixel))), 0) / pixels.length;
  const difference = score(palettes.darkInk) - score(palettes.lightInk);
  return Math.abs(difference) < .18 ? previous : difference > 0 ? 'darkInk' : 'lightInk';
}
export function fittedRect(width, height, viewportWidth, viewportHeight, fit, x, y) {
  const scale = Math[fit === 'contain' ? 'min' : 'max'](viewportWidth / width, viewportHeight / height);
  const w = width * scale, h = height * scale;
  return {x: (viewportWidth - w) * x / 100, y: (viewportHeight - h) * y / 100, width: w, height: h};
}

const excluded = '#dev-background,#dev-edition-banner,.dev-preview,pre,code,.monaco-editor,.xterm,svg,canvas,[contenteditable="true"]';
const rgb = color => `rgb(${color.join(' ')})`;
let registered = false, current, dirty = true, frame, snapshot, failed = false, themeKey;
let originals = new WeakMap(), states = new WeakMap();
const decorated = new Set();
const properties = ['ink', 'secondary', 'edge'];

function restore(element) {
  element.removeAttribute('data-dev-adaptive-text');
  element.removeAttribute('data-dev-text-edge');
  for (const name of properties) element.style.removeProperty('--dev-adaptive-' + name);
}
function clear() {
  for (const element of decorated) restore(element);
  decorated.clear(); snapshot = null;
}
function originalColor(element) {
  const signature = element.className + '|' + element.style.color;
  if (originals.get(element)?.signature === signature) return originals.get(element);
  // Inherited adaptive colour must not become the recorded theme colour.
  const chain = [];
  for (let parent = element; parent; parent = parent.parentElement) {
    if (parent.hasAttribute('data-dev-adaptive-text')) {
      chain.push([parent, parent.getAttribute('data-dev-adaptive-text')]);
      parent.removeAttribute('data-dev-adaptive-text');
    }
  }
  const color = getComputedStyle(element).color;
  for (const [parent, value] of chain) parent.setAttribute('data-dev-adaptive-text', value);
  // Chromium computed colours can use color(srgb ...) / oklch(...). Resolve
  // them with a separate canvas; never read or alter the wallpaper element.
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', {willReadFrequently:true});
  ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
  const values = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  const value = {signature, color: values, neutral: !element.closest('a,[role="link"]') && Math.max(...values) - Math.min(...values) < 42};
  originals.set(element, value); return value;
}
function collect() {
  const root = document.querySelector('#root'), elements = new Set();
  if (!root) return elements;
  const add = element => {
    if (elements.has(element) || element.closest(excluded)) return;
    const box = element.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0 || box.right < 0 || box.bottom < 0 || box.left > innerWidth || box.top > innerHeight || !element.checkVisibility({checkVisibilityCSS:true,checkOpacity:true})) return;
    elements.add(element);
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) if (node.textContent.trim() && node.parentElement) add(node.parentElement);
  for (const input of root.querySelectorAll('input:not([type="checkbox"]):not([type="range"]),textarea')) add(input);
  return elements;
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
  ctx.globalAlpha = 1 - (1 - values.mask / 100) * (values.transparency / 100);
  ctx.fillStyle = base; ctx.fillRect(0, 0, 128, 80); ctx.globalAlpha = 1;
  return ctx.getImageData(0, 0, 128, 80).data;
}
function pixelsFor(box) {
  if (!snapshot) return [];
  const left = Math.max(0, Math.min(127, Math.floor(box.left / innerWidth * 128)));
  const top = Math.max(0, Math.min(79, Math.floor(box.top / innerHeight * 80)));
  const right = Math.max(left + 1, Math.min(128, Math.ceil(box.right / innerWidth * 128)));
  const bottom = Math.max(top + 1, Math.min(80, Math.ceil(box.bottom / innerHeight * 80)));
  const pixels = [], step = Math.max(1, Math.floor(Math.sqrt((right - left) * (bottom - top) / 160)));
  for (let y = top; y < bottom; y += step) for (let x = left; x < right; x += step) {
    const p = (y * 128 + x) * 4; pixels.push([snapshot[p], snapshot[p+1], snapshot[p+2]]);
  }
  return pixels;
}
function setStyle(element, name, value) {
  if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
}
function refresh() {
  if (!current?.enabled || !current.element || document.hidden) return;
  const moving = current.element.tagName === 'VIDEO' ? !current.element.paused : current.moving;
  if (!dirty && !moving) return;
  dirty = false;
  try { if (!failed) snapshot = sampleFrame(); } catch { failed = true; snapshot = null; }
  if (!snapshot && !failed) dirty = true;
  const elements = collect(), now = performance.now();
  for (const element of decorated) if (!elements.has(element)) {restore(element); decorated.delete(element);}
  for (const element of elements) {
    const original = originalColor(element);
    if (original.neutral) {
      let state = states.get(element);
      const fallback = state?.palette || (current.dark ? 'lightInk' : 'darkInk');
      const next = choosePalette(pixelsFor(element.getBoundingClientRect()), fallback);
      if (!state || state.key !== current.key) state = {key:current.key,palette:next,changed:now};
      if (next !== state.palette) {
        if (state.candidate !== next) {state.candidate = next; state.since = now;}
        // Avoid flashing ink on rapid video cuts; the thin opposing edge stays
        // in place while waiting for sustained lighting.
        if (!moving || (now - state.since >= 3000 && now - state.changed >= 5000)) {state.palette = next; state.changed = now;}
      } else state.candidate = null;
      states.set(element, state);
      const palette = palettes[state.palette];
      setStyle(element, '--dev-adaptive-ink', rgb(palette.ink));
      setStyle(element, '--dev-adaptive-secondary', rgb(palette.secondary));
      setStyle(element, '--dev-adaptive-edge', palette.edge);
      element.setAttribute('data-dev-adaptive-text', state.palette);
    } else {
      element.removeAttribute('data-dev-adaptive-text');
      // Links and status colours keep their meaning. Only trace the glyphs.
      setStyle(element, '--dev-adaptive-edge', luminance(original.color) > .4 ? '0 0 0' : '255 255 255');
    }
    element.setAttribute('data-dev-text-edge', ''); decorated.add(element);
  }
}
export function updateReadability(options) {
  if (!registered) {
    registered = true;
    const style = document.createElement('style'); style.id = 'dev-adaptive-contrast';
    style.textContent = `
html[data-dev-material="on"] #root [data-dev-adaptive-text]{color:var(--dev-adaptive-ink)!important}
html[data-dev-material="on"] #root [data-dev-text-edge]{text-shadow:0 .5px 1px rgb(var(--dev-adaptive-edge) / .48),.45px 0 .6px rgb(var(--dev-adaptive-edge) / .35),-.45px 0 .6px rgb(var(--dev-adaptive-edge) / .35)}
html[data-dev-material="on"] #root :is(input,textarea)[data-dev-adaptive-text]::placeholder{color:var(--dev-adaptive-secondary)!important;text-shadow:inherit}
`;
    document.head.append(style);
    const changed = () => {dirty = true;};
    new MutationObserver(records => {
      if (records.some(record => record.type !== 'attributes' || record.attributeName === 'class' || originals.get(record.target)?.signature !== record.target.className + '|' + record.target.style.color)) changed();
    }).observe(document.querySelector('#root') || document.body, {childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});
    addEventListener('resize', changed); document.addEventListener('scroll', changed, true);
    document.addEventListener('visibilitychange', changed);
    setInterval(refresh, 1200);
  }
  if (!options.enabled) {clear(); current = options; return;}
  if (themeKey !== options.base) {clear(); themeKey = options.base; originals = new WeakMap(); states = new WeakMap();}
  if (current?.key !== options.key) {snapshot = null; failed = false;}
  current = options; dirty = true; requestAnimationFrame(refresh);
}
