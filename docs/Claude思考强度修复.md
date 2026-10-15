> 历史开发记录：下文记录此前版本的检查，产品称呼已统一为 ShineAI；历史安装包、哈希、路径与测试结果不代表本轮改名后重新生成或验收。当前状态见 `SHINEAI-DELIVERY-2026-10-15.md`。

# Claude 思考强度传递修复

日期：2026-10-13。范围：开发版 `claude-sdk` 适配器，自备第三方中转。

## 原因

应用内置 Claude Code 2.1.112 的模型能力判断认识部分 4.x 模型名，但把 `claude-opus-5-5` 这样的未知别名判断为不支持 effort。即使 SDK 收到 `effort: high`，实际 Messages 请求也可能没有 `output_config.effort`。这与界面是否显示思考内容是两回事。

此外，旧适配器在会话内修改强度时只更新 `sessionEfforts` 内存，未更新正在运行的 CLI 管线。用户和项目设置中的环境变量也可能覆盖应用选择。

## 改动

- `src/main/extensions/claude-effort.cjs`：校验强度；同时传递 SDK effort 和进程环境。对自定义服务端点启用 CLI 已有的 `CLAUDE_CODE_ALWAYS_ENABLE_EFFORT` 兼容开关，保持真实模型名，不改成其他模型。
- 用 CLI flag settings 层固定所选 effort，防止用户/项目环境设置覆盖。无显式强度时沿用原有默认配置；官方 Anthropic 地址继续保留模型能力判断。
- 会话内切换强度后，在下一次空闲输入前通过原有模型切换/恢复路径重建 CLI 管线，不中断当前生成。清除强度同时清除旧会话配置，避免旧值再次生效。
- `scripts/patch-claude-effort.mjs` 使用语法树定位适配器的方法，将修复保存到可重复应用的开发变换中，原始归档及 SDK 依赖未修改。

Claude Messages 请求的字段是 `output_config.effort`，不是 OpenAI 的 `reasoning_effort`。本次没有强行改变现有 `thinking` 模式，也未安装新 CLI；测试请求中的 thinking 仍为 enabled。第三方服务必须支持相应参数，客户端无法证明中转后端是否执行了它。

## 验证

`npm run smoke:claude` 启动真实开发版和真实内置 Claude CLI，通过应用的创建会话、发送消息、修改强度接口，捕获本地模拟中转收到的 JSON。

| 模型 | 三次实际出站请求 |
|---|---|
| claude-opus-5-5 | output_config.effort 分别为 low、high、max |

5 项检查通过，报告 `artifacts/claude-effort-report.json`。3 项针对模块的测试覆盖别名、继承环境、默认配置和动态更新。模拟中转测试不验证真实模型推理质量、不调用付费模型。

第一次完整链路测试未能隔离用户 Claude 配置，一次简短请求走到了已有中转服务并回复 OK。随后停止该测试，加入仅允许 loopback 的测试 CLI 包装器，排除用户/项目 settings，并使用最高优先级本地地址。最终通过的报告来自隔离后的三次本地请求，不代表用户中转已经验收。

日常开发版没有自动复制官方版的 Claude 凭据或更改服务商配置。需要在开发版选择自己的 Claude 服务商与强度。官方安装不受此修复影响。
