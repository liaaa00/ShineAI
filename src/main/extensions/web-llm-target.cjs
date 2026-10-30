'use strict';
function validateConversationUrl(siteUrl, conversationUrl) {
  if (conversationUrl === undefined) return;
  let site, target;
  try { site = new URL(siteUrl); target = new URL(conversationUrl); }
  catch { throw Error('续聊地址无效，请使用所选站点的会话链接。'); }
  if (!['http:', 'https:'].includes(target.protocol) || target.origin !== site.origin || target.username || target.password) {
    throw Error('续聊地址必须属于所选站点，不能把问题发送到其他网站。');
  }
}
module.exports = { validateConversationUrl };
