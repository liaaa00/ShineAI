'use strict';

// Both settings screens must share one persistent switch and consent gate.
function installWebLlmState(database, driver, storePath, id) {
  const toggle = database.toggleMcp.bind(database),
    update = database.updateMcp.bind(database),
    remove = database.deleteMcp?.bind(database);
  function consent(enabled) {
    if (enabled && !driver.readStore(storePath).riskAcknowledgedAt) throw Error('请先在设置 → 网页大模型中确认向网站发送内容的提示。');
  }
  function sync() {
    const enabled = !!database.getMcp(id)?.isGlobalEnabled;
    driver.updateStore(storePath, store => ({
      ...store,
      enabled
    }));
  }
  database.toggleMcp = (target, enabled) => {
    if (target === id) consent(enabled);
    const result = toggle(target, enabled);
    if (target === id) sync();
    return result;
  };
  database.updateMcp = (target, input) => {
    if (target === id && input.isGlobalEnabled !== undefined) consent(input.isGlobalEnabled);
    const result = update(target, input);
    if (target === id) sync();
    return result;
  };
  if (remove) database.deleteMcp = target => {
    const result = remove(target);
    if (target === id) sync();
    return result;
  };
  if (database.getMcp(id)?.isGlobalEnabled && !driver.readStore(storePath).riskAcknowledgedAt) toggle(id, false);
  sync();
}
module.exports = {
  installWebLlmState
};
