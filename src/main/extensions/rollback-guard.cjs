'use strict';
const wrapped = new WeakSet();
function approvedMode(request,preview) {
  if(request.mode==='files+dialog'&&!preview.snapshotAvailable)throw new Error('没有可用的文件快照，不能撤销文件。可在预览中选择仅回滚对话');
  return request.mode==='files+dialog'?'files+dialog':'dialog-only';
}
function protectRollback(service, manager) {
  if (!service || wrapped.has(service)) return service;
  wrapped.add(service);
  require('./snapshot-budget.cjs').installSnapshotBudget(service);
  require('./turn-snapshot.cjs').installTurnSnapshots(service,manager);
  const previews = new Map();
  const dryRun = service.dryRun.bind(service);
  service.previewForApply = dryRun;
  const apply = service.applyFilesOnly.bind(service);
  const redo = service.redoFilesOnly.bind(service);
  const busy = id => {
    const status=manager.getSession(id)?.status;
    return !!status&&!['waiting_input','idle','paused','terminated','completed','error','failed','stopped','cancelled'].includes(status);
  };
  const git=service.git.bind(service);
  service.git=async(...args)=>{
    const result=await git(...args);
    if(!result.ok) throw new Error('文件快照操作失败，请检查 Git 和目录权限');
    return result;
  };
  async function tree(id) {
    const cwd = service.resolveWorkingDirectory(id), dir = service.shadowDir(id);
    if (!cwd) throw new Error('工作目录不存在');
    const staged = await service.git(cwd, dir, ['add', '-A']);
    if (!staged.ok) throw new Error('无法核对当前文件，请检查目录权限');
    const result = await service.git(cwd, dir, ['write-tree']);
    if (!result.ok) throw new Error('无法核对当前文件');
    return result.stdout.trim();
  }
  service.dryRun = async request => {
    const result = await dryRun(request);
    if (result.snapshotAvailable && result.mode === 'files+dialog') {
      if (busy(request.sessionId)) throw new Error('任务正在运行，请停止后再审阅撤销');
      previews.set(request.sessionId, { target: request.targetMessageId, hash: await tree(request.sessionId) });
      while(previews.size>100)previews.delete(previews.keys().next().value);
    }
    return result;
  };
  service.applyFilesOnly = async request => {
    if (busy(request.sessionId)) throw new Error('任务正在运行，请停止后再撤销');
    if (request.mode !== 'files+dialog') return apply(request);
    const preview = previews.get(request.sessionId);
    if (!preview || preview.target !== request.targetMessageId) throw new Error('请先预览需要撤销的文件');
    if (preview.hash !== await tree(request.sessionId)) throw new Error('预览之后文件发生了变化，请关闭窗口并重新预览，以免覆盖新修改');
    const result = await apply(request);
    if (!result.ok || result.reason) throw new Error('文件恢复未完成，已保留对话。请检查文件后重试');
    previews.delete(request.sessionId);
    if (result.canRedo) previews.set(request.sessionId, { redoHash: await tree(request.sessionId) });
    return result;
  };
  service.redoFilesOnly = async request => {
    if (busy(request.sessionId)) throw new Error('任务正在运行，请停止后再恢复撤销');
    const expected = previews.get(request.sessionId)?.redoHash;
    if (!expected || expected !== await tree(request.sessionId)) throw new Error('撤销后文件已有新修改，不能直接重做，以免覆盖内容');
    const result = await redo(request);
    if (result.ok) previews.delete(request.sessionId);
    return result;
  };
  return service;
}
module.exports = { protectRollback, approvedMode };
