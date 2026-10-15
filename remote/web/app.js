const $ = id => document.getElementById(id);
const errors = { LOGIN_REQUIRED:'请先登录。', INVALID_CREDENTIALS:'账号或密码不正确。', DEVICE_OFFLINE:'电脑已离线，请确认 ShineAI 正在运行且已开启连接。', NOT_SHARED:'电脑端已取消此会话的访问，请重新选择。', REMOTE_DISABLED:'电脑已关闭手机连接。', DEVICE_NOT_FOUND:'这台电脑已解除绑定。', RATE_LIMITED:'操作太频繁，请稍后再试。', DEVICE_BUSY:'电脑正在处理请求，请稍后再试。', COMMAND_OUTCOME_UNKNOWN:'连接中断，操作结果暂时无法确认。请先查看会话，再决定是否重新发送。', COMMAND_ID_CONFLICT:'操作编号冲突，请刷新页面后重试。', COMMAND_EXPIRED:'指令已过期，没有继续提交执行。', DESKTOP_ERROR:'电脑未能处理此请求，请到桌面端查看会话状态。', CSRF_REJECTED:'登录状态已更新，请刷新页面。', ORIGIN_REJECTED:'网页地址与服务器配置不一致。', TOO_MANY_DEVICES:'设备数量已达上限，请先解除不再使用的设备。' };
let csrf = '', devices = [], deviceId = '', sessionId = '', sessions = [], updating = false, sending = false, lastMessages = '', generation = 0, failedPolls = 0, draftKey = '', lastSnapshotAt = 0, pairIssuedAt = 0;
let noticeTimer;
function notice(message) { $('notice').textContent = message; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('notice').textContent = '', 9000); }
async function api(route, options = {}) {
  let response;
  try { response = await fetch(route, { credentials:'same-origin', cache:'no-store', ...options, signal:AbortSignal.timeout(options.method ? 35000 : 12000), headers:{ 'Content-Type':'application/json', ...(csrf ? { 'X-ShineAI-CSRF':csrf } : {}), ...options.headers } }); }
  catch { throw Object.assign(new Error('网络连接中断，请检查连接后再试。'), { code:'NETWORK_ERROR' }); }
  const result = await response.json();
  if (!response.ok) {
    if (result.error === 'LOGIN_REQUIRED') showLogin();
    throw Object.assign(new Error(errors[result.error] || '请求失败，请稍后重试。'), { code:result.error });
  }
  return result;
}
function showLogin() { csrf = ''; generation++; $('workspace-view').hidden = true; $('login-view').hidden = false; $('logout').hidden = true; }
function loggedIn() { $('workspace-view').hidden = false; $('login-view').hidden = true; $('logout').hidden = false; }
function connected() { return devices.find(d => d.id === deviceId)?.online === true && failedPolls < 2 && Date.now() - lastSnapshotAt < 10000; }
function controls() { const ready = connected() && Boolean(sessionId); $('prompt').disabled = !ready; $('send').disabled = !ready || sending; $('stop').disabled = !ready; }
function statusLabel(value) { return ({ running:'执行中', starting:'准备中', waiting_input:'等待输入', waiting_confirmation:'等待电脑端确认', idle:'空闲', completed:'已完成', terminated:'已结束', error:'出现错误' })[value] || value || '状态待更新'; }
function saveDraft() { if (draftKey) try { sessionStorage.setItem(draftKey, $('prompt').value); } catch {} }
function switchSession(next) {
  saveDraft(); sessionId = next; generation++; lastMessages = ''; draftKey = deviceId && next ? `draft:${deviceId}:${next}` : '';
  try { $('prompt').value = draftKey ? sessionStorage.getItem(draftKey) || '' : ''; } catch { $('prompt').value = ''; }
  renderSessions(); controls();
}
function empty(title, text) {
  const wrap = document.createElement('div'); wrap.className = 'empty';
  const heading = document.createElement('h3'); heading.textContent = title;
  const paragraph = document.createElement('p'); paragraph.textContent = text; wrap.append(heading, paragraph); $('messages').replaceChildren(wrap);
}
function renderSessions() {
  $('session-list').replaceChildren();
  for (const session of sessions) {
    const button = document.createElement('button'); button.type = 'button'; button.className = session.id === sessionId ? 'active' : ''; button.textContent = session.name;
    const label = document.createElement('small'); label.textContent = statusLabel(session.status); button.append(label);
    button.onclick = () => { switchSession(session.id); refresh().catch(error => notice(error.message)); };
    $('session-list').append(button);
  }
}
function renderMessages(result) {
  $('session-title').textContent = result.session.name;
  $('session-state').textContent = statusLabel(result.session.status);
  const serialized = JSON.stringify(result.messages);
  if (serialized === lastMessages) return;
  lastMessages = serialized;
  const pane = $('messages'), nearBottom = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 100;
  pane.replaceChildren();
  if (!result.messages.length) empty('会话已经接通', '发出下一条指令，由电脑继续处理。');
  for (const message of result.messages) {
    const article = document.createElement('article'); article.className = 'message ' + (message.role === 'user' ? 'user' : 'assistant');
    const role = document.createElement('div'); role.className = 'role'; role.textContent = message.role === 'user' ? '你' : message.role === 'assistant' ? 'SHINEAI' : '会话';
    const content = document.createElement('div'); content.className = 'content'; content.textContent = message.text;
    article.append(role, content); pane.append(article);
  }
  if (nearBottom) pane.scrollTop = pane.scrollHeight;
}
async function refresh() {
  if (!csrf || updating || document.hidden) return;
  updating = true; const version = generation;
  try {
    const result = await api('/api/devices'); if (version !== generation) return;
    devices = result.devices;
    if (pairIssuedAt && devices.some(d => d.createdAt >= pairIssuedAt)) { $('pair-panel').hidden = true; pairIssuedAt = 0; }
    if (!devices.some(d => d.id === deviceId)) { saveDraft(); deviceId = devices[0]?.id || ''; sessions = []; switchSession(''); }
    const selected = deviceId;
    $('device-select').replaceChildren(...devices.map(d => { const o = document.createElement('option'); o.value = d.id; o.textContent = d.name; return o; }));
    $('device-select').value = selected; $('revoke').hidden = !selected;
    const online = devices.find(d => d.id === selected)?.online === true;
    $('device-state').textContent = selected ? (online ? '电脑在线 · 任务在电脑执行' : '电脑离线 · 暂时无法操作') : '还没有绑定电脑';
    $('connection-dot').classList.toggle('online', online);
    if (!online) { failedPolls = 0; sessions = []; switchSession(''); renderSessions(); $('session-title').textContent = selected ? '等待电脑上线' : '接着做，随时看。'; empty(selected ? '电脑暂时离线' : '先连接一台电脑', selected ? '请在电脑端开启手机连接，并保持程序运行和联网。' : '点击“连接电脑”，然后在电脑端输入绑定码。'); controls(); return; }
    const listing = await api(`/api/devices/${selected}/sessions`);
    if (selected !== deviceId || !csrf) return;
    sessions = listing.result.sessions;
    if (!sessions.some(s => s.id === sessionId)) switchSession(sessions[0]?.id || '');
    renderSessions();
    if (sessionId) {
      const requestedSession = sessionId, requestedGeneration = generation;
      const read = await api(`/api/devices/${selected}/sessions/${requestedSession}`);
      if (selected === deviceId && requestedSession === sessionId && requestedGeneration === generation) renderMessages(read.result);
    } else empty('还没有共享会话', '在电脑端打开“手机协同”，选择允许访问的会话并保存。');
    failedPolls = 0; lastSnapshotAt = Date.now(); controls();
  } catch (error) {
    failedPolls++; controls();
    if (failedPolls >= 2) { $('device-state').textContent = '连接中断 · 正在重新连接'; $('connection-dot').classList.remove('online'); }
    if (failedPolls === 1) notice(error.message);
  } finally { updating = false; }
}
$('login-form').onsubmit = async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true;
  try { const result = await api('/api/login', { method:'POST', body:JSON.stringify({ username:$('username').value, password:$('password').value }) }); csrf = result.csrf; $('password').value = ''; loggedIn(); await refresh(); }
  catch (error) { notice(error.message); } finally { button.disabled = false; }
};
$('logout').onclick = async () => { try { await api('/api/logout', { method:'POST', body:'{}' }); saveDraft(); showLogin(); } catch (error) { notice(error.message); } };
$('pair').onclick = async () => {
  try { pairIssuedAt = Date.now(); const result = await api('/api/pairing', { method:'POST', body:'{}' }); $('pair-panel').hidden = false; $('pair-code').textContent = result.code; $('pair-expiry').textContent = `绑定码有效至 ${new Date(result.expiresAt).toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' })}，只能使用一次。`; }
  catch (error) { notice(error.message); }
};
$('device-select').onchange = async () => { saveDraft(); deviceId = $('device-select').value; sessions = []; switchSession(''); await refresh(); };
$('revoke').onclick = async () => {
  if (!deviceId || !confirm('解除这台电脑的绑定？再次连接需要重新输入绑定码。')) return;
  try { await api(`/api/devices/${deviceId}`, { method:'DELETE', body:'{}' }); await refresh(); } catch (error) { notice(error.message); }
};
$('prompt').oninput = saveDraft;
$('compose').onsubmit = async event => {
  event.preventDefault(); if (sending || !connected() || !sessionId || !$('prompt').value.trim()) return;
  const target = { deviceId, sessionId, text:$('prompt').value, draftKey }; sending = true; controls();
  const commandId = crypto.randomUUID();
  try {
    await api(`/api/devices/${target.deviceId}/sessions/${target.sessionId}/messages`, { method:'POST', body:JSON.stringify({ commandId, text:target.text }) });
    if (deviceId === target.deviceId && sessionId === target.sessionId && $('prompt').value === target.text) { $('prompt').value = ''; saveDraft(); }
    notice('电脑已接收，请在会话中查看执行结果。'); await refresh();
  } catch (error) { notice(error.message); }
  finally { sending = false; controls(); }
};
$('stop').onclick = async () => {
  if (!connected() || !sessionId) return;
  try { await api(`/api/devices/${deviceId}/sessions/${sessionId}/stop`, { method:'POST', body:JSON.stringify({ commandId:crypto.randomUUID() }) }); notice('电脑已处理中断请求。'); await refresh(); }
  catch (error) { notice(error.message); }
};
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
setInterval(refresh, 2000);
try { const me = await api('/api/me'); csrf = me.csrf; loggedIn(); await refresh(); } catch (error) { showLogin(); if (error.code !== 'LOGIN_REQUIRED') notice(error.message); }
