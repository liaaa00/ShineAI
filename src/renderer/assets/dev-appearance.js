// Local background preferences. All filesystem access stays behind the preload.
import {registerMaterials} from './dev-material.js';
import {applyTextAppearance,defaultText} from './dev-text-appearance.js';
const bridge = window.development?.appearance;
let config, media, stage, activeMedia, serial = 0, revision = 0, saveTimer, saveQueue = Promise.resolve();
const listeners = new Set();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mode = () => document.documentElement.style.colorScheme === 'dark' ? 'dark' : 'light';
const clone = value => JSON.parse(JSON.stringify(value));
let status = '', failure = false;
function announce(message, error = false) { status = message; failure = error; listeners.forEach(fn => fn()); }
function ensureStage() {
  if (stage) return;
  stage = document.createElement('div');
  stage.id = 'dev-background'; stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = '<div class="dev-background-media"></div><div class="dev-background-mask"></div>';
  document.body.prepend(stage);
}
function isMoving() { return config?.motion && !document.hidden && !reducedMotion.matches; }
function updateMotion() {
  if (!activeMedia) return;
  const moving = isMoving();
  const video = activeMedia.element.tagName === 'VIDEO';
  // Pause the full-resolution video in place; the smaller poster is for preview.
  activeMedia.element.hidden = !video && !moving && !!activeMedia.poster;
  if (activeMedia.poster) activeMedia.poster.hidden = video || moving;
  if (activeMedia.element.tagName === 'VIDEO') {
    if (moving && config.enabled) activeMedia.element.play().catch(() => announce('视频无法播放，可关闭动态播放使用静态画面', true));
    else activeMedia.element.pause();
  } else if (activeMedia.poster) {
    // Removing the source stops GIF/WebP decoding while a captured frame is shown.
    if (moving && config.enabled) { if (activeMedia.element.getAttribute('src') !== activeMedia.url) activeMedia.element.src = activeMedia.url; }
    else activeMedia.element.removeAttribute('src');
  }
}
function paint() {
  if (!config) return;
  ensureStage();
  const root = document.documentElement, values = config[mode()];
  root.dataset.devBackground = config.enabled && !!activeMedia ? 'on' : 'off';
  registerMaterials();
  root.dataset.devMaterial = config.enabled && !!activeMedia && values.transparency > 0 ? 'on' : 'off';
  root.style.setProperty('--dev-material-scale', (100 - values.transparency) / 200);
  root.style.setProperty('--dev-background-strength', values.strength / 100);
  root.style.setProperty('--dev-background-mask', values.mask / 100);
  root.style.setProperty('--dev-surface-opacity', (100 - values.transparency) + '%');
  root.style.setProperty('--dev-background-blur', values.blur + 'px');
  root.style.setProperty('--dev-background-filter', values.blur > 0 ? `blur(${values.blur}px)` : 'none');
  root.style.setProperty('--dev-panel-blur', (values.panelBlur ?? 16) + 'px');
  root.style.setProperty('--dev-panel-filter', (values.panelBlur ?? 16) > 0 ? `blur(${values.panelBlur ?? 16}px)` : 'none');
  root.style.setProperty('--dev-background-fit', config.fit);
  root.style.setProperty('--dev-background-position', config.positionX + '% ' + config.positionY + '%');
  applyTextAppearance(values.text,config.enabled&&!!activeMedia);
  updateMotion();
  listeners.forEach(fn => fn());
}
// Xterm paints its own background; CSS on its parent cannot remove that fill.
// Keep ANSI/text/selection colors and change only the terminal's canvas fill.
export function appearanceTerminalTheme(theme) {
  return {...theme, background: document.documentElement.dataset.devMaterial === 'on' ? '#00000000' : theme.background};
}
export function bindTerminalAppearance(terminal, getTheme) {
  let disposed = false;
  const refresh = () => { if (!disposed) terminal.options.theme = appearanceTerminalTheme(getTheme()); };
  listeners.add(refresh); ready.then(refresh); refresh();
  return () => { disposed = true; listeners.delete(refresh); };
}
async function prepareMedia(next) {
  const element = document.createElement(next.type.startsWith('video/') ? 'video' : 'img');
  element.className = 'dev-background-content';
  element.crossOrigin = 'anonymous';
  if (element.tagName === 'VIDEO') { element.muted = true; element.loop = true; element.playsInline = true; element.preload = 'auto'; }
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('背景加载超时，请尝试较小的文件')), 20000);
      const loaded = element.tagName === 'VIDEO' ? 'loadeddata' : 'load';
      const finish = error => { clearTimeout(timer); element.removeEventListener(loaded, onLoad); element.removeEventListener('error', onError); error ? reject(error) : resolve(); };
      const onLoad = () => finish(), onError = () => finish(new Error('无法解码此图片或视频，请换用有效图片或 H.264 MP4 / WebM'));
      element.addEventListener(loaded, onLoad); element.addEventListener('error', onError); element.src = next.url;
    });
    const width = element.videoWidth || element.naturalWidth, height = element.videoHeight || element.naturalHeight;
    if (!width || !height || width * height > 40000000) throw new Error('背景尺寸过大，请使用不超过 4000 万像素的图片或视频');
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1920 / width, 1080 / height);
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    canvas.getContext('2d').drawImage(element, 0, 0, canvas.width, canvas.height);
    const poster = document.createElement('img'); poster.className = 'dev-background-content'; poster.src = canvas.toDataURL('image/png'); poster.hidden = true;
    return {id: next.id, url: next.url, element, poster};
  } catch (error) { dispose({element}); throw error; }
}
function dispose(item) { if (!item) return; if (item.element.tagName === 'VIDEO') item.element.pause(); item.element.removeAttribute('src'); item.element.remove(); item.poster?.remove(); }
function commitMedia(prepared) {
  ensureStage(); dispose(activeMedia); activeMedia = prepared;
  const host = stage.querySelector('.dev-background-media'); host.replaceChildren();
  if (prepared) host.append(prepared.element, prepared.poster);
}
async function loadSnapshot(snapshot) {
  const ticket = ++serial;
  let prepared;
  try { if (snapshot.media && activeMedia?.id !== snapshot.media.id) prepared = await prepareMedia(snapshot.media); }
  catch (error) { announce(error.message, true); return; }
  if (ticket !== serial) { dispose(prepared); return; }
  if (!snapshot.media) commitMedia(null); else if (prepared) commitMedia(prepared);
  config = clone(snapshot.config); media = snapshot.media;
  for(const theme of ['light','dark'])config[theme].text??=defaultText(theme);
  paint();
  if(config.media && !media) announce('背景文件已丢失，请重新导入或恢复默认', true);
}
function scheduleSave() {
  revision++; clearTimeout(saveTimer);
  announce('正在保存…');
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const current = revision, next = clone(config);
    saveQueue = saveQueue.then(async () => {
      const result = await bridge.save(next);
      if (current === revision) announce(result.success ? '已保存到本机' : result.error, !result.success);
    }).catch(error => announce(error.message, true));
  }, 220);
}
function change(mutator) { mutator(config); paint(); scheduleSave(); }
const ready = bridge ? bridge.get().then(async result => {
  if (!result.success) throw new Error(result.error);
  await loadSnapshot(result);
  bridge.onChanged(snapshot => {
    // Own save events need no repaint; stale responses must not replace a draft.
    if (JSON.stringify(snapshot.config) === JSON.stringify(config)) return;
    if (!saveTimer && status !== '正在保存…') loadSnapshot(snapshot);
  });
  new MutationObserver(paint).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
  document.addEventListener('visibilitychange', updateMotion); reducedMotion.addEventListener('change', updateMotion);
}).catch(error => announce(error.message, true)) : Promise.resolve();

export function mountAppearancePanel(host) {
  host.className = 'dev-appearance';
  host.innerHTML = `
    <div class="dev-appearance-heading"><div><h3>背景与玻璃效果</h3><p>让壁纸透过界面，同时保留清晰的文字。</p></div><label><input type="checkbox" data-control="enabled"> 启用背景</label></div>
    <div class="dev-appearance-layout">
      <div><div class="dev-preview" aria-label="背景效果预览"><div class="dev-preview-picture"></div><div class="dev-preview-mask"></div><aside><b>ShineAI</b><span>新建对话</span><span>我的项目</span><span>技能市场</span></aside><main><small>你的工作空间</small><h4>让灵感有自己的风景。</h4><div class="dev-preview-message">背景、面板与文字各自独立。<br>代码和输入保持易读。</div><code>const idea = '开始创造';</code><div class="dev-preview-input">向 AI 提问… <span>↑</span></div></main></div>
      <div class="dev-media-info">尚未选择背景</div><div class="dev-buttons"><button type="button" data-action="import">选择图片或视频</button><button type="button" data-action="clear">清除背景</button></div><p class="dev-help">图片 ≤ 20 MB · 视频 ≤ 150 MB · 支持 GIF / 动态 WebP<br>导入后保存在本机，移动原文件不会影响背景。</p></div>
      <div class="dev-controls"><div class="dev-mode-row"><strong data-mode-label></strong><span>明暗主题分别保存</span></div>
      <div class="dev-presets"><button type="button" data-preset="original">原画视频</button><button type="button" data-preset="wallpaper">清晰壁纸</button><button type="button" data-preset="glass">柔和玻璃</button><button type="button" data-preset="focus">专注阅读</button></div>
      ${[['strength','背景强度',100],['mask','背景遮罩',100],['transparency','面板透明度',100],['blur','背景模糊',24],['panelBlur','浮层模糊',24]].map(([key,label,max])=>`<label class="dev-slider"><span>${label}<output data-output="${key}"></output></span><input aria-label="${label}" type="range" min="0" max="${max}" step="1" data-control="${key}"></label>`).join('')}
      <p class="dev-help">背景模糊影响整张画面；浮层模糊影响面板和菜单后方。原画视频去掉模糊和遮罩，并完整显示画面；文字可能随画面变得难读。</p>
      <section class="dev-text-controls" aria-label="手动文字设置">
        <div class="dev-text-heading"><label><input type="checkbox" data-text-control="enabled"> 手动调整文字</label><button type="button" data-action="reset-text">恢复默认文字</button></div>
        <p class="dev-help">默认沿用主题字体和颜色。开启后仅对壁纸界面的普通文字生效，不改变字重、代码配色或增加底板。</p>
        <fieldset data-text-options><legend class="dev-sr-only">文字颜色与细描边</legend>
          <div class="dev-text-color-row"><label>文字颜色 <select aria-label="文字颜色模式" data-text-control="colorMode"><option value="theme">跟随主题</option><option value="custom">自定义</option></select></label><input type="color" aria-label="自定义文字颜色" data-text-control="color"></div>
          <label class="dev-slider"><span>描边宽度<output data-text-output="outlineWidth"></output></span><input type="range" aria-label="描边宽度" min="0" max="1" step="0.1" data-text-control="outlineWidth"></label>
          <label class="dev-slider"><span>描边强度<output data-text-output="outlineOpacity"></output></span><input type="range" aria-label="描边强度" min="0" max="100" step="1" data-text-control="outlineOpacity"></label>
          <div class="dev-text-color-row"><label for="dev-text-outline-color">描边颜色</label><input id="dev-text-outline-color" type="color" aria-label="描边颜色" data-text-control="outlineColor"></div>
          <p class="dev-help">宽度或强度设为 0 即关闭描边。壁纸关闭时恢复主题文字；明暗主题分别保存。</p>
        </fieldset>
      </section>
      <div class="dev-fit"><label>显示方式 <select aria-label="背景显示方式" data-control="fit"><option value="cover">铺满窗口</option><option value="contain">完整显示</option></select></label><label><input type="checkbox" data-control="motion"> 动态播放</label></div>
      ${[['positionX','水平位置'],['positionY','垂直位置']].map(([key,label])=>`<label class="dev-slider dev-position"><span>${label}<output data-output="${key}"></output></span><input aria-label="${label}" type="range" min="0" max="100" data-control="${key}"></label>`).join('')}
      <div class="dev-appearance-footer"><button type="button" data-action="reset">恢复默认</button><span role="status" aria-live="polite"></span></div></div>
    </div>`;
  let importing = false;
  function render() {
    host.querySelector('[role="status"]').textContent = status; host.querySelector('[role="status"]').dataset.error = failure;
    if (!config) return;
    const values = config[mode()];
    const text=values.text;
    host.querySelector('[data-text-options]').disabled=!text.enabled;
    for(const input of host.querySelectorAll('[data-text-control]')) {
      const key=input.dataset.textControl;
      if(key==='enabled')input.checked=text.enabled;
      else if(key==='colorMode')input.value=text.color?'custom':'theme';
      else if(key==='color') {input.value=text.color||getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim();input.disabled=!text.color;}
      else input.value=text[key];
      const output=host.querySelector(`[data-text-output="${key}"]`);if(output)output.textContent=text[key]+(key==='outlineWidth'?' px':'%');
    }
    host.querySelector('[data-mode-label]').textContent = mode() === 'dark' ? '暗色效果' : '浅色效果';
    host.querySelector('[data-control="enabled"]').disabled = !media;
    for (const input of host.querySelectorAll('[data-control]')) {
      const key = input.dataset.control, value = key in values ? values[key] : config[key];
      if (input.type === 'checkbox') input.checked = value; else input.value = value;
      const output = host.querySelector(`[data-output="${key}"]`); if (output) output.textContent = value + (key === 'blur' || key === 'panelBlur' ? ' px' : '%');
    }
    host.querySelector('.dev-media-info').textContent = media ? media.name + ' · ' + (media.size / 1024 / 1024).toFixed(1) + ' MB' : '尚未选择背景';
    host.querySelector('[data-action="clear"]').disabled = !media;
    host.querySelector('[data-action="import"]').disabled = importing;
    const preview = host.querySelector('.dev-preview');
    preview.dataset.enabled = config.enabled && !!media;
    const picture = host.querySelector('.dev-preview-picture');
    // A small frozen frame avoids a second animation/decoder in the settings preview.
    picture.style.backgroundImage = activeMedia?.poster ? `url("${activeMedia.poster.src}")` : '';
    picture.style.backgroundSize = config.fit;
    picture.style.backgroundPosition = config.positionX + '% ' + config.positionY + '%';
  }
  const onInput = event => {
    const textKey=event.target.dataset.textControl;
    if(textKey&&config) {
      change(next=>{const text=next[mode()].text;
        if(textKey==='enabled')text.enabled=event.target.checked;
        else if(textKey==='colorMode')text.color=event.target.value==='custom'?getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim():null;
        else text[textKey]=event.target.type==='range'?Number(event.target.value):event.target.value;
      });return;
    }
    const key = event.target.dataset.control; if (!key || !config) return;
    change(next => { const target = key in next[mode()] ? next[mode()] : next; target[key] = event.target.type === 'checkbox' ? event.target.checked : event.target.tagName === 'SELECT' ? event.target.value : Number(event.target.value); });
  };
  const onClick = async event => {
    const button = event.target.closest('button'); if (!button || !config) return;
    if (button.dataset.preset) {
      const recipes = {original:{strength:100,mask:0,transparency:100,blur:0,panelBlur:0},wallpaper:{strength:95,mask:15,transparency:65,blur:0,panelBlur:0},glass:{strength:85,mask:25,transparency:55,blur:8,panelBlur:16},focus:{strength:60,mask:55,transparency:20,blur:3,panelBlur:16}};
      change(next => {
        Object.assign(next[mode()], recipes[button.dataset.preset]);
        if (button.dataset.preset === 'original') {next.motion = true; next.fit = 'contain'; next.positionX = next.positionY = 50;}
      });
    }
    if (button.dataset.action === 'clear') { serial++; commitMedia(null); media = null; change(next => {next.media = null; next.enabled = false;}); }
    if (button.dataset.action === 'reset-text') change(next=>{next[mode()].text=defaultText(mode());});
    if (button.dataset.action === 'reset') change(next => {next.enabled = false; next.motion = true; next.fit = 'cover'; next.positionX = next.positionY = 50; next.light = {strength:80,mask:30,transparency:35,blur:0,panelBlur:16,text:defaultText('light')}; next.dark = {strength:85,mask:30,transparency:45,blur:0,panelBlur:16,text:defaultText('dark')};});
    if (button.dataset.action === 'import' && !importing) {
      importing = true; render();
      let candidate;
      try {
        const result = await bridge.importMedia();
        if (result.canceled) return;
        if (!result.success) throw new Error(result.error);
        candidate = result.media.id;
        const ticket = ++serial, prepared = await prepareMedia(result.media);
        if (ticket !== serial) { dispose(prepared); await bridge.discardMedia(candidate).catch(()=>{}); candidate = null; return; }
        commitMedia(prepared); media = result.media;
        candidate = null;
        change(next => {next.media = media.id; next.enabled = true;});
      } catch (error) { if(candidate) await bridge.discardMedia(candidate).catch(()=>{}); announce(error.message, true); }
      finally { importing = false; render(); }
    }
  };
  host.addEventListener('input', onInput); host.addEventListener('click', onClick);
  listeners.add(render); ready.then(render); render();
  return () => {listeners.delete(render); host.removeEventListener('input', onInput); host.removeEventListener('click', onClick);};
}
