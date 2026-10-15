// Transparent floating UI must reveal the wallpaper, not another UI's text.
// Clip only lower sibling branches: the floating panel and its children keep
// their original layout, focus, and stacking order. No second media decoder.
const candidates = '[data-workbench-goals],[data-canvas-drawer],[data-drawer-more-menu],.cn-peek,[role="dialog"],[role="menu"],[role="listbox"],[role="tooltip"],.fixed[class*="z-"],.absolute[class*="z-40"],.absolute[class*="z-50"],.fixed[class*="z-"] > :is([class*="bg-bg-"],[class*="bg-v2-"])';
const semantic = '[data-workbench-goals],[data-canvas-drawer],[data-drawer-more-menu],.cn-peek,[role="dialog"],[role="menu"],[role="listbox"],[role="tooltip"]';
let registered = false, pending = false;
const clipped = new Set();
const raised = new Set();
const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

function visible(element) {
  const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 &&
    rect.left < innerWidth && rect.top < innerHeight && style.display !== 'none' &&
    style.visibility === 'visible' && Number(style.opacity) > 0 && element.checkVisibility();
}
function isPanel(element) {
  if (!visible(element)) return false;
  if (element.matches(semantic)) return true;
  // Ignore empty portal/dismissal wrappers and full-screen dimming backdrops.
  return /\bbg-(?:bg-|v2-|white\b)/.test(element.className) ||
    /var\(--(?:color-bg|v2-bg)/.test(element.style.background + element.style.backgroundColor);
}
function isBelow(sibling, branch, level) {
  const a = getComputedStyle(sibling), b = getComputedStyle(branch);
  const az = Number.parseInt(a.zIndex) || 0, bz = level;
  if (az !== bz) return az < bz;
  if (a.position === 'static' && b.position !== 'static') return true;
  return Boolean(sibling.compareDocumentPosition(branch) & Node.DOCUMENT_POSITION_FOLLOWING);
}
function subtract(rect, hole) {
  if (!intersects(rect, hole)) return [rect];
  const left = Math.max(rect.left, hole.left), right = Math.min(rect.right, hole.right);
  const top = Math.max(rect.top, hole.top), bottom = Math.min(rect.bottom, hole.bottom);
  return [
    {left: rect.left, top: rect.top, right: rect.right, bottom: top},
    {left: rect.left, top: bottom, right: rect.right, bottom: rect.bottom},
    {left: rect.left, top, right: left, bottom},
    {left: right, top, right: rect.right, bottom}
  ].filter(r => r.right > r.left && r.bottom > r.top);
}
function refresh() {
  pending = false;
  const holes = new Map();
  const fronts = new Map();
  if (document.documentElement.dataset.devMaterial === 'on') {
    for (const panel of document.querySelectorAll(candidates)) {
      if (!(panel instanceof HTMLElement) || panel.closest('#dev-background,.dev-preview') || !isPanel(panel)) continue;
      const hole = panel.getBoundingClientRect();
      let level = 0;
      for (let branch = panel; branch.parentElement && branch !== document.body; branch = branch.parentElement) {
        const style = getComputedStyle(branch);
        // A z-50 dropdown can escape its static/relative-auto toolbar. Carry
        // that level up to the next real stacking context, rather than treating
        // the toolbar as z-0 and missing all the content following it.
        const z = raised.has(branch) ? 'auto' : style.zIndex;
        if (branch === panel || z !== 'auto' || style.transform !== 'none' ||
            style.filter !== 'none' || style.isolation === 'isolate' || Number(style.opacity) < 1)
          level = Number.parseInt(z) || 0;
        for (const sibling of branch.parentElement.children) {
          if (!(sibling instanceof HTMLElement) || sibling === branch || sibling.matches('#dev-background,#dev-edition-banner') || !isBelow(sibling, branch, level) || !visible(sibling)) continue;
          if (!intersects(sibling.getBoundingClientRect(), hole)) continue;
          if (!holes.has(sibling)) holes.set(sibling, []);
          holes.get(sibling).push(hole);
          // clip-path creates a stacking context on the lower sibling. Keep
          // positioned overlay hosts above it (including their close buttons).
          if (style.position !== 'static') fronts.set(branch, Math.max(fronts.get(branch) || 1, level));
        }
      }
    }
  }
  // Calculate all geometry before writing styles to avoid layout thrashing.
  const paths = new Map();
  for (const [element, cutouts] of holes) {
    const box = element.getBoundingClientRect();
    const width = element.offsetWidth, height = element.offsetHeight;
    if (!width || !height) continue;
    let remaining = [{left: 0, top: 0, right: width, bottom: height}];
    for (const cutout of cutouts) {
      const local = {left: (cutout.left - box.left) * width / box.width,
        right: (cutout.right - box.left) * width / box.width,
        top: (cutout.top - box.top) * height / box.height,
        bottom: (cutout.bottom - box.top) * height / box.height};
      remaining = remaining.flatMap(rect => subtract(rect, local));
    }
    const n = value => Math.round(value * 1000) / 1000;
    const path = remaining.map(r => `M${n(r.left)} ${n(r.top)}H${n(r.right)}V${n(r.bottom)}H${n(r.left)}Z`).join('');
    paths.set(element, `path("${path || 'M0 0Z'}")`);
  }
  for (const element of clipped) {
    if (!paths.has(element)) {
      element.removeAttribute('data-dev-occluded');
      element.style.removeProperty('--dev-occlusion-clip');
      clipped.delete(element);
    }
  }
  for (const [element, path] of paths) {
    if (element.style.getPropertyValue('--dev-occlusion-clip') !== path) element.style.setProperty('--dev-occlusion-clip', path);
    if (!element.hasAttribute('data-dev-occluded')) element.setAttribute('data-dev-occluded', '');
    clipped.add(element);
  }
  for (const element of raised) if (!fronts.has(element)) {
    element.removeAttribute('data-dev-occlusion-front'); element.style.removeProperty('--dev-occlusion-z'); raised.delete(element);
  }
  for (const [element, level] of fronts) {
    if (raised.has(element) && element.style.getPropertyValue('--dev-occlusion-z') !== String(level)) element.style.setProperty('--dev-occlusion-z', level);
    if (!element.hasAttribute('data-dev-occlusion-front') && getComputedStyle(element).zIndex === 'auto') {
      element.style.setProperty('--dev-occlusion-z', level);
      element.setAttribute('data-dev-occlusion-front', ''); raised.add(element);
    }
  }
}
function schedule() { if (!pending) { pending = true; requestAnimationFrame(refresh); } }
const withoutClip = value => (value || '').replace(/--dev-occlusion-(?:clip|z)\s*:[^;]*;?/g, '').trim();
export function registerOcclusion() {
  if (registered) return;
  registered = true;
  new MutationObserver(records => {
    if (records.some(record => record.type !== 'attributes' || record.attributeName !== 'style' ||
      withoutClip(record.oldValue) !== withoutClip(record.target.getAttribute('style')))) schedule();
  }).observe(document.body, {childList: true, subtree: true, attributes: true, attributeOldValue: true,
    attributeFilter: ['class', 'style', 'hidden', 'open', 'role']});
  new MutationObserver(schedule).observe(document.documentElement, {attributes: true, attributeFilter: ['data-dev-material']});
  for (const event of ['resize', 'scroll', 'pointermove', 'transitionend', 'animationend'])
    window.addEventListener(event, schedule, {passive: true, capture: true});
  schedule();
}
