export function petImageUrl(id, poster = false) {
  return typeof id === 'string' && /^[a-f0-9]{32}\.(png|gif)$/.test(id) ? `shineai-pet://avatar/${id}${poster ? '.poster.png' : ''}` : null;
}
export function createPetPersonaUI({ React, jsx, store, species, personalities, Builtin, reducedMotion, language }) {
  const zh = () => language().startsWith('zh');
  function CustomImage({ id, size = 48, alt = '', className = '' }) {
    const reduced = reducedMotion(), [failed, setFailed] = React.useState(false);
    const src = petImageUrl(id, reduced);
    React.useEffect(() => setFailed(false), [src]);
    if (!src || failed) return jsx.jsx('span', { role: 'img', 'aria-label': zh() ? '形象图片不可用' : 'Avatar unavailable', style: { width: size, height: size, display: 'inline-grid', placeItems: 'center' }, children: '🖼️' });
    return jsx.jsx('img', { 'data-testid': 'pet-custom-image', src, alt, draggable: false, className: `select-none object-contain ${className}`, style: { width: size, height: size, objectFit: 'contain' }, onError: () => setFailed(true) });
  }
  function Avatar(props) {
    const persona = store(s => s.persona);
    return props.avatarType === 'custom' ? jsx.jsx(CustomImage, { id: props.customAvatarId ?? persona?.customAvatarId, size: props.size, alt: props.alt, className: props.className }) : jsx.jsx(Builtin, props);
  }
  function Panel({ onClose }) {
    const persona = store(s => s.persona), update = store(s => s.updatePersona);
    const [draft, setDraft] = React.useState(() => ({ ...persona }));
    const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(''), [fileName, setFileName] = React.useState('');
    const pending = React.useRef(new Set()), savedId = React.useRef(persona?.customAvatarId);
    React.useEffect(() => { savedId.current = persona?.customAvatarId; }, [persona?.customAvatarId]);
    React.useEffect(() => () => { for (const id of pending.current) if (id !== savedId.current) void window.development.pet.discardImage(id); }, []);
    const change = patch => { setDraft(value => ({ ...value, ...patch })); setError(''); };
    async function importImage() {
      setBusy(true); setError('');
      try {
        const result = await window.development.pet.importImage();
        if (result.canceled) return;
        if (!result.success) throw Error(result.error);
        pending.current.add(result.media.id);
        // Decode in Chromium as well, including the GIF decoder, before using it.
        const image = new Image(); image.src = result.media.url; await image.decode();
        setFileName(result.media.name);
        change({ avatarType: 'custom', customAvatarId: result.media.id });
      } catch (e) { setError(e.message || (zh() ? '导入失败，请换一张图片' : 'Import failed')); }
      finally { setBusy(false); }
    }
    async function save() {
      setBusy(true); setError('');
      try {
        await update({ name: draft.name, personality: draft.personality, avatarType: draft.avatarType, petSpecies: draft.petSpecies || 'cat_black', customAvatarId: draft.customAvatarId || null });
        savedId.current = draft.customAvatarId; pending.current.delete(draft.customAvatarId); onClose();
      } catch (e) { setError(e.message); }
      finally { setBusy(false); }
    }
    const text = (cn, en) => zh() ? cn : en;
    const buttonClass = 'rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary hover:bg-bg-hover disabled:opacity-50';
    const card = selected => `${buttonClass} flex flex-col items-center gap-1 ${selected ? 'border-accent-blue bg-accent-blue/10' : ''}`;
    const label = (title, content) => jsx.jsxs('div', { className: 'space-y-2', children: [jsx.jsx('div', { className: 'text-xs text-text-secondary', children: title }), content] });
    return jsx.jsxs('div', { 'data-testid': 'pet-persona-panel', className: 'space-y-4', children: [
      jsx.jsxs('div', { className: 'flex items-center justify-between', children: [jsx.jsx('h3', { className: 'text-sm font-medium text-text-primary', children: text('人格配置', 'Persona') }), jsx.jsx('button', { type: 'button', disabled: busy, className: 'text-xs text-text-muted', onClick: onClose, children: text('取消', 'Cancel') })] }),
      label(text('小光名称', 'Name'), jsx.jsx('input', { 'aria-label': text('小光名称', 'Name'), maxLength: 20, value: draft.name || '', disabled: busy, onChange: e => change({ name: e.target.value }), className: 'w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary' })),
      label(text('内置形象', 'Built-in avatar'), jsx.jsx('div', { 'data-testid': 'pet-species-grid', className: 'grid grid-cols-3 gap-2', children: species().map(item => jsx.jsxs('button', { type: 'button', disabled: busy, 'aria-label': item.displayNameZh, 'aria-pressed': draft.avatarType !== 'custom' && (draft.petSpecies || 'cat_black') === item.species, className: card(draft.avatarType !== 'custom' && (draft.petSpecies || 'cat_black') === item.species), onClick: () => change({ avatarType: item.avatarType, petSpecies: item.species }), children: [jsx.jsx(Builtin, { mood: 'idle', avatarType: item.avatarType, species: item.species, size: 40, reducedMotion: true }), jsx.jsx('span', { className: 'text-tiny text-text-muted', children: item.displayNameZh })] }, item.species)) })),
      label(text('自定义形象', 'Custom avatar'), jsx.jsxs('div', { className: 'space-y-2', children: [
        jsx.jsxs('div', { className: 'flex items-center gap-3', children: [
          draft.customAvatarId && jsx.jsxs('button', { type: 'button', disabled: busy, 'aria-label': text('使用自定义形象', 'Use custom avatar'), 'aria-pressed': draft.avatarType === 'custom', className: card(draft.avatarType === 'custom'), onClick: () => change({ avatarType: 'custom' }), children: [jsx.jsx(CustomImage, { id: draft.customAvatarId, size: 64 }), jsx.jsx('span', { className: 'text-tiny', children: text('自定义', 'Custom') })] }),
          jsx.jsx('button', { type: 'button', disabled: busy, className: buttonClass, onClick: importImage, children: text('导入 PNG / GIF', 'Import PNG / GIF') })
        ] }),
        fileName && jsx.jsx('p', { className: 'break-all text-xs text-text-secondary', children: fileName }),
        jsx.jsx('p', { className: 'text-xs leading-relaxed text-text-muted', children: text('支持透明 PNG、GIF 动画，最大 10 MB、4096×4096。保存后同步到所有小光窗口。', 'Transparent PNG or animated GIF, up to 10 MB and 4096×4096. Save to update all assistant windows.') })
      ] })),
      label(text('预览', 'Preview'), jsx.jsxs('div', { className: 'flex items-center gap-3', children: [
        draft.avatarType === 'custom' ? jsx.jsx(CustomImage, { id: draft.customAvatarId, size: 80, alt: draft.name }) : jsx.jsx(Builtin, { mood: 'idle', avatarType: draft.avatarType, species: draft.petSpecies, size: 80 }),
        jsx.jsx('span', { className: 'text-xs text-text-muted', children: text('点击“保存配置”后生效', 'Changes apply when saved') })
      ] })),
      jsx.jsxs('div', { className: 'space-y-1 text-xs text-text-muted', children: [jsx.jsx('div', { children: text('成长阶位：当前仅支持幼体', 'Growth stage: juvenile only') }), jsx.jsx('p', { children: text('成体、觉醒及经验成长暂未实现，当前无法通过等级或经验解锁。', 'Adult, awakened and experience-based growth are not implemented yet.') })] }),
      label(text('性格风格', 'Personality'), jsx.jsx('div', { className: 'grid grid-cols-3 gap-2', children: personalities().map(item => jsx.jsxs('button', { type: 'button', disabled: busy, 'aria-pressed': draft.personality === item.type, onClick: () => change({ personality: item.type }), className: card(draft.personality === item.type), children: [jsx.jsx('span', { children: item.emoji }), jsx.jsx('span', { children: item.label }), jsx.jsx('span', { className: 'text-tiny text-text-muted', children: item.description })] }, item.type)) })),
      error && jsx.jsx('p', { role: 'alert', className: 'text-xs text-accent-red', children: error }),
      jsx.jsx('button', { type: 'button', disabled: busy || !draft.name?.trim(), className: `${buttonClass} w-full`, onClick: save, children: busy ? text('处理中…', 'Working…') : text('保存配置', 'Save persona') })
    ] });
  }
  return { Avatar, Panel };
}
