'use strict';

const messages = {
  'errors.invalidUrl': ['请输入有效的 HTTP 或 HTTPS 网站地址。', 'Enter a valid HTTP or HTTPS website URL.'],
  'errors.unknown': ['操作失败，请检查配置。', 'The operation failed. Check the configuration.'],
  'errors.siteNotFound': ['站点不存在，请刷新列表。', 'Site not found. Refresh the list.'],
  'errors.cdpUnavailable': ['内置浏览器通道不可用，请开启后重启应用。', 'The built-in browser channel is unavailable. Enable it and restart.'],
  'errors.busy': ['该站点正在执行操作，请稍后再试。', 'This site is busy. Try again shortly.'],
  'errors.presetNotFound': ['没有找到该站点预设。', 'Site preset not found.'],
  'errors.invalidName': ['请输入站点名称。', 'Enter a site name.'],
  'errors.alreadyAdded': ['这个站点已经添加。', 'This site has already been added.'],
  'errors.invalidMaxChars': ['请输入有效的提示词长度上限。', 'Enter a valid prompt length limit.'],
  'errors.invalidField': ['请选择有效的页面元素。', 'Choose a valid page element.'],
  'errors.invalidPaths': ['文件列表无效。', 'Invalid file list.'],
  'errors.riskNotAcknowledged': ['请先确认网页大模型的使用说明。', 'Review the web model notice before enabling it.'],
  'login.captcha': ['请在浏览器中完成人机验证。', 'Complete verification in the browser.'],
  'login.timeout': ['等待登录超时，请重新打开登录页面。', 'Sign-in timed out. Open the sign-in page again.'],
  'pick.hint': ['请在网页上点击需要选择的元素，按 Esc 取消。', 'Click the desired webpage element, or press Esc to cancel.'],
  'pick.wrongTarget': ['当前页面不属于这个站点，请先打开正确页面。', 'Open the correct site before choosing an element.'],
  'errors.pickNoSelector': ['未找到可用的元素选择器，请重新选择。', 'No usable selector was found. Choose the element again.']
};
exports.wrap = base => ({
  ...base,
  t: (key, options) => {
    const pair = messages[String(key).replace(/^mainWebLlm:/, '')];
    return pair ? pair[base.getMainLanguage?.().startsWith('en') ? 1 : 0] : base.t(key, options);
  }
});
