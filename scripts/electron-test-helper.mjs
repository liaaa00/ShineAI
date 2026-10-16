import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { _electron } = createRequire(path.join(root, '.runtime/package.json'))('playwright-core');
export async function completeOnboarding(page) {
  // Fresh profiles render the wizard asynchronously after the bridge is ready.
  const checkbox = page.locator('[data-onboarding-wizard-container] input[type=checkbox]').first();
  await checkbox.waitFor({ state: 'visible', timeout: 30000 });
  await checkbox.check({ force: true });
  await page.getByRole('button', { name: /进入开发工作台|登录并开始|继续设置/ }).first().click();
  await page.locator('[data-onboarding-wizard-container]').waitFor({ state: 'hidden', timeout: 30000 });
}
export async function openTestApp(dataDir, ports = { auth: 19312, meeting: 18082 }, executablePath) {
  const env = { ...process.env, SHINEAI_DEV_USER_DATA_DIR: dataDir, SHINEAI_LOCAL_AUTH_PORT: String(ports.auth), SHINEAI_MEETING_GATEWAY_PORT: String(ports.meeting) };
  // Explicit legacy-install tests must also isolate the former development
  // edition's profile and ports; never fall through to the user's live data.
  if (executablePath) Object.assign(env, { SPECTRAI_DEV_USER_DATA_DIR: dataDir, SPECTRAI_LOCAL_AUTH_PORT: String(ports.auth), SPECTRAI_MEETING_GATEWAY_PORT: String(ports.meeting) });
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await _electron.launch({ executablePath: executablePath || path.join(root, '.runtime/electron/electron.exe'), args: executablePath ? [] : [root], cwd: executablePath ? path.dirname(executablePath) : root, env, timeout: 120000 });
  try {
    // Keep animation frames available to screenshot/actionability checks while
    // Codex or another window covers the isolated test app on Windows.
    await app.evaluate(({app,webContents})=>{
      for(const contents of webContents.getAllWebContents())contents.setBackgroundThrottling(false);
      app.on('web-contents-created',(_event,contents)=>contents.setBackgroundThrottling(false));
    });
    const deadline = Date.now() + 120000;
    let page;
    while (Date.now() < deadline) {
      page = app.windows().find(p => !p.isClosed() && p.url().includes('/renderer/index.html'));
      if (page) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (!page) throw new Error('Main renderer did not open');
    await page.waitForFunction(() => window.development?.getRuntimeInfo && (window.shineAI || window.spectrAI)?.session && document.querySelector('#root')?.children.length, undefined, { timeout: 120000 });
    return { app, page };
  } catch (error) { await app.close(); throw error; }
}
