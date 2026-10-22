// Keep a background alert and the answer it refers to visible together. These
// alerts are status evidence, not replacements for the user's final answer.
export function backgroundVisibleGroups(groups) {
  const visible = new Set();
  let previousAnswer;
  for (const group of groups) {
    if (group.type !== 'message') continue;
    const message = group.message;
    if (message.role === 'assistant' && !message.isThinking && !message.isDelta && message.content?.trim()) previousAnswer = message.id;
    if (message.role !== 'system') continue;
    const notice = message.metadata?.backgroundToolNotice;
    // Also support old, explicit notices without changing saved messages.
    if (!notice && !/^后台任务已结束 \((?:exited|error|killed)\) · exit /.test(message.content || '')) continue;
    visible.add(message.id);
    const answer = notice?.relatedAnswerId || previousAnswer;
    if (answer) visible.add(answer);
  }
  return visible;
}
