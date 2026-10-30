'use strict';

// Uses the same local browser driver as settings, without hosted services.
const fs = require('node:fs');
const {
  Server,
  StdioServerTransport
} = require('../chunks/stdio-Doqlz0ZT.js');
const {
  ListToolsRequestSchema,
  CallToolRequestSchema
} = require('../chunks/stdio-DXmbQghg.js');
const driver = require('../upstream108/presets.cjs');
const { validateConversationUrl } = require('./web-llm-target.cjs');
const tools = [{
  name: 'web_llm_list_sites',
  description: '列出用户配置的网页大模型及其登录、测试状态。',
  inputSchema: {
    type: 'object',
    properties: {}
  }
}, {
  name: 'web_llm_ask',
  description: '在用户已启用的网页大模型中提问。内容会发送给所选网站；本地文件需显式列入 files，疑似密钥文件默认拒绝。失败后按照提示处理，不要反复重试。',
  inputSchema: {
    type: 'object',
    properties: {
      site: {
        type: 'string'
      },
      prompt: {
        type: 'string'
      },
      files: {
        type: 'array',
        maxItems: 20,
        items: {
          type: 'string'
        }
      },
      answer_format: {
        enum: ['text', 'diff']
      },
      conversation_url: {
        type: 'string'
      },
      new_chat: {
        type: 'boolean'
      },
      timeout_sec: {
        type: 'number'
      }
    },
    required: ['prompt']
  }
}];
async function call(name, args = {}) {
  const storePath = process.env.WEB_LLM_STORE_PATH;
  if (!storePath) throw Error('缺少本地网页大模型配置。');
  const store = driver.readStore(storePath);
  if (!store.riskAcknowledgedAt || !store.enabled) throw Error('请先在设置 → 网页大模型中启用此功能。');
  if (name === 'web_llm_list_sites') return store.sites.map(s => ({
    id: s.id,
    name: s.name,
    status: s.status,
    enabled: s.enabled,
    isDefault: s.isDefault,
    lastError: s.lastError
  }));
  if (name !== 'web_llm_ask') throw Error('未知工具。');
  if (typeof args.prompt !== 'string' || !args.prompt.trim()) throw Error('问题不能为空。');
  let site = args.site ? store.sites.find(s => s.id === args.site) : args.conversation_url ? store.sites.find(s => {
    try {
      return new URL(s.url).origin === new URL(args.conversation_url).origin;
    } catch {
      return false;
    }
  }) : driver.pickDefaultSite(store);
  if (!site || !site.enabled) throw Error('没有可用站点，请在设置 → 网页大模型中添加、登录并测试。');
  site = driver.withPresetDefaults(storePath, site);
  validateConversationUrl(site.url, args.conversation_url);
  if (args.files && (!Array.isArray(args.files) || args.files.length > 20 || args.files.some(f => typeof f !== 'string'))) throw Error('文件列表无效。');
  for (const file of args.files || []) if (fs.statSync(file).size > 2 * 1024 * 1024) throw Error('文件过大，请截取需要的内容。');
  const files = driver.loadFiles(args.files || [], store.sensitiveAllowlist || []),
    prompt = driver.buildPrompt(args.prompt, files, {
      answerFormat: args.answer_format || 'text'
    });
  driver.assertLength(prompt, site.maxChars || driver.DEFAULT_MAX_CHARS);
  const port = JSON.parse(fs.readFileSync(process.env.WEB_LLM_CONNECTION_PATH, 'utf8')).port;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('浏览器通道不可用，请重启应用。');
  return driver.askSite(site, {
    port,
    storePath,
    prompt,
    conversationUrl: args.conversation_url,
    newChat: args.new_chat ?? !args.conversation_url,
    timeoutMs: Math.max(30, Math.min(600, Number(args.timeout_sec) || 540)) * 1000
  });
}
async function start() {
  const server = new Server({
    name: 'shineai-web-llm',
    version: '1.0.0'
  }, {
    capabilities: {
      tools: {}
    }
  });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools
  }));
  server.setRequestHandler(CallToolRequestSchema, async ({
    params
  }) => {
    try {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(await call(params.name, params.arguments))
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: driver.formatToolError(error)
        }]
      };
    }
  });
  await server.connect(new StdioServerTransport());
}
if (require.main === module) start().catch(() => {
  process.stderr.write('网页大模型工具启动失败。\n');
  process.exitCode = 1;
});
module.exports = {
  call,
  tools
};
