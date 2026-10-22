'use strict';
const { randomUUID } = require('node:crypto');
const seen = new WeakMap();
function handleImageView(adapter, sessionId, state, timestamp, item, completed) {
  if (!['imageView', 'image_view'].includes(item?.type)) return false;
  if (!item.id) return true;
  let sessions = seen.get(state);
  if (!sessions) seen.set(state, sessions = new Map());
  const previous = sessions.get(item.id);
  if (previous === 'done' || (!completed && previous)) return true;
  const input = { path: item.path || item.filePath || item.file_path || item.imagePath || '' };
  const emit = message => {
    const value = { id: randomUUID(), sessionId, timestamp, toolName: 'view_image', toolUseId: item.id, toolInput: input, ...message };
    if (adapter.pushSessionMessage) adapter.pushSessionMessage(sessionId, state, value);
    else state.adapter.messages.push(value);
    adapter.emit('conversation-message', sessionId, value);
    return value;
  };
  if (!previous) {
    emit({ role: 'tool_use', content: input.path || '查看图片' });
    adapter.trackPendingTool(state, { id: item.id, kind: 'image', displayLabel: '查看图片', startedAt: Date.now() });
    adapter.emitEvent(sessionId, { type: 'tool_use_start', sessionId, timestamp, data: { toolName: 'view_image', toolUseId: item.id, toolInput: input } });
  }
  sessions.set(item.id, completed ? 'done' : 'started');
  if (completed) {
    adapter.clearPendingTool(state, item.id);
    const isError = !!item.error || ['failed', 'cancelled'].includes(item.status);
    // Never persist raw image bytes or invent a screenshot / comprehension result.
    const toolResult = isError ? '图片查看未完成' : '图片查看工具已完成';
    emit({ role: 'tool_result', content: toolResult, toolResult, isError });
    adapter.emitEvent(sessionId, { type: 'tool_use_end', sessionId, timestamp, data: { toolName: 'view_image', toolUseId: item.id, toolResult, isError } });
  }
  return true;
}
module.exports = { handleImageView };
