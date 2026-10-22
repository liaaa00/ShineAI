# Playwright 交互验证

先查看项目已有测试约定。以下为 Python 示例；使用目标项目选择的解释器，在任务临时目录运行，并替换 URL、控件名称和期望结果。

```python
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

output = Path("artifacts/webapp-testing").resolve()
output.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto("http://127.0.0.1:5173", wait_until="domcontentloaded")
        field = page.get_by_role("textbox", name="姓名")
        expect(field).to_be_visible()
        field.fill("测试用户")
        page.get_by_role("button", name="保存", exact=True).click()
        expect(page.get_by_role("status")).to_have_text("已保存：测试用户")
        page.screenshot(path=str(output / "saved.png"), full_page=True)
        assert not errors, errors
    finally:
        browser.close()
```

仅对真实存在的控件与真实业务状态编写断言。需要验证持久化时再刷新页面或重开上下文，不把当前 DOM 中出现成功提示当成保存成功。截图必须打开查看后才能给出视觉结论。

遇到选择器超时，先读取页面和截图定位原因；不要用不断增加等待时间或固定 sleep 掩盖问题。下载、弹窗和新页面使用对应事件等待。涉及 Electron 时优先使用项目已有的独立配置测试入口，避免操作用户正在工作的窗口。
