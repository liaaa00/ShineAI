// Adapt the actual CSS rules, including lazy stylesheets and interaction states.
// Keep the original theme palette and inline styles intact for native consumers.
import {registerOcclusion} from './dev-occlusion.js';
const scope = 'html[data-dev-material="on"]';
const excluded = ':not([data-appearance-surface]):not([role="img"]):not([role="progressbar"]):not(.cn-dot):not(.cn-last):not(#dev-background):not(.dev-background-mask):not(.dev-background-content):not(.dev-preview-picture):not(.dev-preview-mask):not(#dev-edition-banner):not(img):not(video):not(canvas):not(svg)';
let sheet, scheduled = false;
const inline = new WeakMap();
const mix = color => `color-mix(in srgb, ${color} calc(var(--dev-material-scale) * 100%), transparent)`;
function matchingParen(text, start) {
  let depth = 1, quote = '';
  for (let i = start + 1; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === quote && text[i - 1] !== '\\') quote = ''; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')' && !--depth) return i;
  }
  return text.length - 1;
}
function gradientColors(value) {
  // Transform colors inside gradients/stops, preserving angles and positions.
  // Gradient-stop variables are lists, whereas theme color variables are colors.
  let output = '', i = 0;
  while (i < value.length) {
    const rest = value.slice(i);
    const fn = rest.match(/^([\w-]+)\(/);
    if (fn) {
      const open = i + fn[1].length, end = matchingParen(value, open);
      const token = value.slice(i, end + 1);
      if (/^(?:rgb|rgba|hsl|hsla|oklch|oklab|color|color-mix)$/i.test(fn[1]) ||
          (fn[1] === 'var' && /^var\(--(?:color-|v2-(?:bg|accent)|cn-(?:bg|panel))/.test(token))) output += mix(token);
      else if (/gradient$/i.test(fn[1])) output += fn[1] + '(' + gradientColors(value.slice(open + 1, end)) + ')';
      else output += token;
      i = end + 1;
    } else {
      const color = rest.match(/^(?:#[\da-f]{3,8}\b|(?:white|black|transparent)\b)/i);
      if (color) { output += mix(color[0]); i += color[0].length; }
      else { output += value[i]; i++; }
    }
  }
  return output;
}
function splitSelectors(value) {
  const selectors = []; let start = 0, depth = 0, quote = '';
  for (let i = 0; i < value.length; i++) {
    if (value[i - 1] === '\\') continue;
    const c = value[i];
    if (quote) { if (c === quote) quote = ''; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && !depth) { selectors.push(value.slice(start, i)); start = i + 1; }
  }
  selectors.push(value.slice(start)); return selectors;
}
function scopedSelector(value, foreground = false) {
  return splitSelectors(value).map(selector => {
    selector = selector.trim();
    if (/^(?:html|body|:root)$/.test(selector) || /#dev-background|#dev-edition-banner|#root\b|data-appearance-surface|data-dev-inline|dev-background-|dev-preview-(?:picture|mask)/.test(selector)) return '';
    // Keep pseudo-elements at the end; :is(::before) would be invalid CSS.
    const pseudo = selector.match(/::[\w-]+(?:\([^)]*\))?$/)?.[0] || '';
    const base = pseudo ? selector.slice(0, -pseudo.length) : selector;
    return `${scope} :is(${base})${excluded}${foreground ? ':not([data-dev-adaptive-text])' : ''}${pseudo}`;
  }).filter(Boolean).join(',');
}
function declarations(style) {
  const output = [];
  const backdrop = style.getPropertyValue('backdrop-filter');
  // Share one adjustable filter across plain CSS and Tailwind utility rules.
  // `none` at zero avoids a redundant compositing/resampling pass.
  if (/blur\(|--tw-backdrop-blur/.test(backdrop) || style.getPropertyValue('--tw-backdrop-blur'))
    output.push('backdrop-filter:var(--dev-panel-filter)!important');
  let color = style.getPropertyValue('background-color');
  const background = style.getPropertyValue('background');
  if (!color && background && CSS.supports('color', background)) color = background;
  if (color && CSS.supports('color', color)) output.push(`background-color:${mix(color)}!important`);
  const image = style.getPropertyValue('background-image');
  if (image && /gradient\(/.test(image)) {
    const transformed = gradientColors(image);
    if (CSS.supports('background-image', transformed)) output.push(`background-image:${transformed}!important`);
  }
  for (const name of ['--tw-gradient-from', '--tw-gradient-to', '--tw-gradient-stops']) {
    const value = style.getPropertyValue(name);
    if (value) output.push(`${name}:${gradientColors(value)}!important`);
  }
  const text = style.getPropertyValue('color'), foreground = [];
  if (output.length && /^(?:white|#fff(?:fff)?|rgb\(255,\s*255,\s*255\))$/i.test(text.trim())) foreground.push('color:var(--color-text-primary)!important');
  if (text && /var\(--(?:color-text-(?:muted|secondary)|v2-text-(?:muted|dim|secondary)|cn-ink-[234])/.test(text)) {
    foreground.push(`color:${text.replace(/var\(--(?:color-text-(?:muted|secondary)|v2-text-(?:muted|dim|secondary)|cn-ink-[234])\)/g,'var(--dev-readable-muted)')}!important`);
  }
  return {background:output.join(';'), foreground:foreground.join(';')};
}
function renderRules(rules) {
  let output = '';
  for (const rule of rules) {
    if (rule.selectorText && rule.style) {
      const selector = scopedSelector(rule.selectorText), values = declarations(rule.style);
      if (selector && values.background) output += `${selector}{${values.background}}\n`;
      // Adaptive text owns only foreground. Keep every original transparency
      // rule active on that same element, including buttons and image captions.
      const textSelector = values.foreground && scopedSelector(rule.selectorText, true);
      if (textSelector) output += `${textSelector}{${values.foreground}}\n`;
    } else if (rule.cssRules && !/keyframes/i.test(rule.constructor.name)) {
      const body = renderRules(rule.cssRules);
      if (body) output += rule.cssText.slice(0, rule.cssText.indexOf('{') + 1) + body + '}\n';
    }
  }
  return output;
}
function rebuild() {
  scheduled = false; let output = '';
  for (const source of document.styleSheets) {
    if (source.ownerNode === sheet || source.disabled) continue;
    try {
      const body = renderRules(source.cssRules), media = source.media.mediaText;
      output += media ? `@media ${media}{${body}}\n` : body;
    } catch { /* Cross-origin content cannot be inspected. */ }
  }
  if (sheet.textContent !== output) sheet.textContent = output;
}
function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(rebuild); } }
function adaptInline(element) {
  if (!(element instanceof HTMLElement) || element.closest('#dev-background,#dev-edition-banner') || element.matches('.dev-preview-picture,.dev-preview-mask,[role="img"],[role="progressbar"],.cn-dot,.cn-last')) return;
  let color = element.style.backgroundColor;
  if (!color && CSS.supports('color', element.style.background)) color = element.style.background;
  const image = element.style.backgroundImage;
  const state = `${color}\n${image}`;
  if (inline.get(element) === state) return;
  inline.set(element, state);
  if (color && CSS.supports('color', color)) {
    element.style.setProperty('--dev-inline-background', color);
    element.setAttribute('data-dev-inline-background', '');
  } else {
    element.removeAttribute('data-dev-inline-background'); element.style.removeProperty('--dev-inline-background');
  }
  if (/gradient\(/.test(image)) {
    element.style.setProperty('--dev-inline-gradient', gradientColors(image));
    element.setAttribute('data-dev-inline-gradient', '');
  } else {
    element.removeAttribute('data-dev-inline-gradient'); element.style.removeProperty('--dev-inline-gradient');
  }
}
export function registerMaterials() {
  if (sheet) return;
  registerOcclusion();
  sheet = document.createElement('style'); sheet.id = 'dev-glass-material';
  document.head.append(sheet); rebuild();
  new MutationObserver(records => {
    if (records.some(record => record.target !== sheet && !sheet.contains(record.target) &&
      (record.type === 'attributes' || record.type === 'characterData' || [...record.addedNodes, ...record.removedNodes].some(node => node !== sheet)))) schedule();
  }).observe(document.head, {childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['media','disabled','href','rel']});
  document.head.addEventListener('load', event => { if (event.target.tagName === 'LINK') schedule(); }, true);
  document.body.querySelectorAll('[style]').forEach(adaptInline);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') adaptInline(record.target);
      for (const node of record.addedNodes) if (node instanceof HTMLElement) {
        adaptInline(node); node.querySelectorAll('[style]').forEach(adaptInline);
      }
    }
  }).observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:['style']});
}
