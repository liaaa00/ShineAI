---
name: webapp-testing
description: 网页测试、页面测试、前端测试、界面验收、复现页面问题、截图检查、浏览器日志；使用 Playwright 验证本地 Web 应用的交互与显示。Use for testing web UI behavior, reproducing frontend bugs, inspecting DOM, screenshots and browser errors.
license: Apache-2.0; see LICENSE.txt
---

# Webapp Testing

验证用户实际看到和操作到的页面，以浏览器中的证据判断结果。

## 使用方式

用户要求测试网页、排查页面异常，或修改前端后需要验证交互时使用。用户明确指定 `webapp-testing` 或 `/webapp-testing` 时也使用。普通聊天、纯后端工作或只解释代码时，不为使用技能而启动浏览器。允许按任务自动选择，但是否调用由模型结合任务判断。

## 选择工具与环境

- 优先沿用目标项目已有的 Playwright 测试及运行命令。
- 临时检查可使用 Python Playwright；先确认所用解释器能 `import playwright`，浏览器能启动。技能安装本身不安装 Python 包或浏览器，也不代表依赖已就绪。
- 需要自动操作 ShineAI 内置浏览器、且当前会话提供 ShineAI Claw 时，可通过 `search_mcp_tools` 查找 `browser_get_app_state`、`browser_execute_action`、`browser_screenshot` 等工具。先读取页面，再操作；在内置浏览器中验证目标应用即可。
- 不要假定所有 Provider 都提供相同的工具。缺少工具或运行依赖时说明具体缺项，遵守项目的依赖约定；没有执行就不能宣称测试通过。

## 验证流程

1. 确认目标 URL、启动命令及用户期望行为。复用已运行的本地服务；需要启动服务时记录自己启动的进程，完成后只清理这些进程。
2. 等待目标页面的可观察状态，例如标题、按钮出现或加载提示消失。持续轮询或 WebSocket 页面不要仅依赖 `networkidle`。
3. 先检查渲染后的 DOM，优先按 role、label、可访问名称或已有 test id 定位。操作表单或按钮后，断言真实结果，不能仅以点击成功作为功能通过。
4. 记录相关控制台错误、页面异常和失败请求。涉及样式、透明度、壁纸或布局时，保存截图并实际查看，再判断是否存在遮挡、重叠或可读性问题；只保存截图不算完成视觉检查。
5. 修改后复测原问题，并检查相邻的关键交互。报告实际验证的步骤、结果和证据路径；区分浏览器探查、自动化断言与模型视觉检查。

测试从任务授权的页面和数据范围开始；优先使用独立浏览器上下文和测试数据。截图和报告保存在项目的临时产物目录，返回可打开的绝对路径。

## 页面探查与进一步测试

初次进入页面、收集截图与浏览器错误时，可运行本技能目录下的脚本（路径相对于技能目录）：

```text
python scripts/probe.py --url http://127.0.0.1:5173 --output-dir <项目的临时产物目录> --wait-for "main"
```

`probe.py` 是页面探查，不会代替业务验收。需要验证输入、提交、导航、持久化等行为时，按 [Playwright 示例](references/playwright.md) 编写任务对应的断言。

本技能改编自 Apache-2.0 授权的 webapp-testing，增加 ShineAI 工具选择、中文发现说明和页面探查脚本。它不会新增“已查看 N 张图像”界面提示；工具记录的展示由宿主程序负责。
