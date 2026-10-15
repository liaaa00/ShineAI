const bridge = window.development?.remote;
const messages = { INVALID_SERVER_URL:'请填写完整的服务器地址，例如 https://ai.example.com。', HTTPS_REQUIRED:'公网连接需要 HTTPS；HTTP 仅用于本机测试。', PAIR_CODE_INVALID:'绑定码不正确或已过期，请在手机网页重新生成。', SYSTEM_ENCRYPTION_UNAVAILABLE:'系统安全存储暂不可用，无法保存设备凭证。', REMOTE_OPERATION_FAILED:'操作失败，请检查服务器地址和网络连接。', INVALID_SERVER_RESPONSE:'服务器响应不正确，请确认地址指向 ShineAI 协同服务。', REMOTE_START_FAILED:'连接启动失败，请检查系统安全存储和本地配置。', ALREADY_PAIRED:'请先解除当前绑定。', PAIR_FIRST:'请先绑定电脑。', SESSION_NOT_FOUND:'会话列表已变化，请刷新后重新选择。', SERVER_REVOCATION_UNCONFIRMED:'本机绑定已移除，服务器撤销尚未确认。请在手机设备列表中解除旧设备。', SETTINGS_BUSY:'上一项设置正在处理中，请稍后再试。' };
if (bridge) {
  const launch = document.createElement('button'); launch.className = 'shine-remote-launch'; launch.textContent = '手机协同'; launch.type = 'button';
  const dialog = document.createElement('dialog'); dialog.className = 'shine-remote-dialog'; dialog.setAttribute('aria-label', '手机协同');
  dialog.innerHTML = `<header><h2>手机协同</h2><button type="button" data-close aria-label="关闭手机协同">关闭</button></header><p>用手机接续这台电脑上的会话。任务由电脑执行，电脑需要保持运行和联网。</p><div data-body></div><p role="status" aria-live="polite"></p>`;
  document.body.append(launch, dialog);
  const area = dialog.querySelector('[data-body]'), status = dialog.querySelector('[role=status]');
  let state, busy = false;
  async function call(method, input) {
    if (busy) return; busy = true; status.textContent = '';
    dialog.querySelectorAll('button').forEach(button => { if (!button.hasAttribute('data-close')) button.disabled = true; });
    try {
      const result = await bridge[method](input);
      if (!result.success) throw new Error(messages[result.error] || '操作未完成，请检查连接后重试。');
      state = result; render(); if (result.warning) status.textContent = messages[result.warning] || result.warning;
    } catch (error) { status.textContent = error.message; }
    finally { busy = false; dialog.querySelectorAll('button').forEach(button => button.disabled = false); }
  }
  function render() {
    area.replaceChildren();
    if (!state.deviceId) {
      area.innerHTML = `<form data-pair><label>服务器地址<input name="serverUrl" type="url" placeholder="https://ai.example.com" required></label><label>电脑名称<input name="name" type="text" maxlength="80" required></label><label>手机网页生成的绑定码<input name="code" type="text" maxlength="16" autocomplete="off" required></label><p class="remote-warning">绑定后仍需选择共享会话并开启连接。服务商密钥不会发送到手机。</p><button type="submit" class="primary">绑定这台电脑</button></form>`;
      area.querySelector('[name=serverUrl]').value = state.serverUrl || '';
      area.querySelector('[name=name]').value = state.name || '我的电脑';
      area.querySelector('form').onsubmit = event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); call('pair', data); };
      return;
    }
    const paragraph = document.createElement('p'); paragraph.textContent = `${state.name} · ${state.serverUrl}`; area.append(paragraph);
    const badge = document.createElement('p'); badge.className = 'remote-status'; badge.dataset.connection = state.connection;
    badge.textContent = ({ online:'已连接 · 手机可以访问所选会话', connecting:'正在连接服务器…', offline:'服务器连接中断，正在重连', disabled:'手机连接已关闭', revoked:'设备已在服务器解除绑定' })[state.connection] || '连接状态待更新'; area.append(badge);
    const form = document.createElement('form');
    form.innerHTML = `<label class="remote-enabled"><input name="enabled" type="checkbox">允许手机连接这台电脑</label><p class="remote-warning">只共享勾选的会话。手机发送的指令具有该会话现有的操作权限；需要授权时，请在电脑端处理。</p><div class="remote-sessions" aria-label="允许访问的会话"></div><div class="remote-actions"><button class="primary" type="submit">保存访问设置</button><button type="button" data-disconnect>立即断开</button><button type="button" data-refresh>刷新会话</button><button type="button" class="danger" data-forget>解除绑定</button></div>`;
    form.querySelector('[name=enabled]').checked = state.enabled;
    const list = form.querySelector('.remote-sessions');
    if (!state.sessions.length) { const empty = document.createElement('p'); empty.textContent = '暂无会话。先在电脑端创建会话，再点击“刷新会话”。'; list.append(empty); }
    for (const session of state.sessions) {
      const label = document.createElement('label'), box = document.createElement('input'), title = document.createElement('span');
      box.type = 'checkbox'; box.name = 'sessionId'; box.value = session.id; box.checked = state.sessionIds.includes(session.id); title.textContent = session.name;
      label.append(box, title); list.append(label);
    }
    form.onsubmit = event => { event.preventDefault(); call('setAccess', { enabled:form.querySelector('[name=enabled]').checked, sessionIds:[...form.querySelectorAll('[name=sessionId]:checked')].map(box => box.value) }); };
    form.querySelector('[data-disconnect]').onclick = () => call('disconnect');
    form.querySelector('[data-refresh]').onclick = () => call('get');
    form.querySelector('[data-forget]').onclick = () => { if (confirm('解除手机绑定？再次使用时需要重新生成绑定码。')) call('forget'); };
    area.append(form);
    if (state.error) status.textContent = messages[state.error] || '读取连接配置失败。';
  }
  launch.onclick = async () => { dialog.showModal(); await call('get'); };
  dialog.querySelector('[data-close]').onclick = () => dialog.close();
  // Refresh connection text without replacing unsaved checkbox choices.
  setInterval(async () => {
    if (!dialog.open || busy || !state?.deviceId) return;
    try {
      const next = await bridge.get();
      if (!next.success) return;
      if (!next.deviceId) { state = next; render(); return; }
      const badge = area.querySelector('.remote-status');
      if (badge) { badge.dataset.connection = next.connection; badge.textContent = ({ online:'已连接 · 手机可以访问所选会话', connecting:'正在连接服务器…', offline:'服务器连接中断，正在重连', disabled:'手机连接已关闭' })[next.connection] || '连接已断开'; }
    } catch {}
  }, 2000);
}
