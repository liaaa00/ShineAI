// Local integration controls use existing theme tokens and application state.
export function createLocal108Controls({
  reactExports: R,
  jsxRuntimeExports: J,
  useUIStore,
  useSessionStore,
  upstream
}) {
  const button = 'px-3 py-1.5 rounded-lg border border-border text-sm text-text-primary hover:bg-bg-hover disabled:opacity-40';
  const input = 'w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary';
  const zh = () => !(localStorage.getItem('shineai-language') || document.documentElement.lang)?.startsWith('en');
  const say = (cn, en) => zh() ? cn : en;
  function useAction() {
    const [busy, setBusy] = R.useState(false),
      [message, setMessage] = R.useState('');
    return {
      busy,
      message,
      run: async fn => {
        if (busy) return;
        setBusy(true);
        setMessage('');
        try {
          const result = await fn();
          if (result?.canceled) return;
          if (result?.ok === false || result?.success === false) throw Error(result.error || say('操作未完成。', 'The operation failed.'));
          return result;
        } catch (error) {
          setMessage(error.message);
        } finally {
          setBusy(false);
        }
      }
    };
  }
  function CookieImportSection() {
    const action = useAction(),
      [scope, setScope] = R.useState('shared');
    return J.jsxs('section', {
      'data-testid': 'cookie-import',
      className: 'space-y-3 border-t border-border pt-5',
      children: [J.jsx('h3', {
        className: 'text-sm font-medium text-text-primary',
        children: say('导入浏览器登录状态', 'Import browser sign-in')
      }), J.jsx('p', {
        className: 'text-caption text-text-muted',
        children: say('选择浏览器扩展导出的 Cookie JSON 或 cookies.txt 文件。仅保存到本机；开启会话隔离后，其他会话不会自动共享登录。', 'Choose an exported cookie JSON or cookies.txt file. Sign-in stays on this computer; isolated sessions do not automatically share it.')
      }), J.jsx('select', {
        'aria-label': say('登录状态导入目标', 'Cookie import target'),
        className: input,
        value: scope,
        onChange: e => setScope(e.target.value),
        children: [J.jsx('option', {
          value: 'shared',
          children: say('普通内置浏览器', 'Shared built-in browser')
        }), J.jsx('option', {
          value: 'web-llm',
          children: say('网页大模型浏览器', 'Web model browser')
        })]
      }), J.jsx('button', {
        type: 'button',
        className: button,
        disabled: action.busy,
        onClick: () => action.run(async () => {
          const result = await window.shineAI.browser.importCookies({
            scope
          });
          if (result.ok) useUIStore.getState().showToast(say(`已导入 ${result.imported} 条登录数据。`, `Imported ${result.imported} cookies.`), 'success');
          return result;
        }),
        children: say('选择文件并导入', 'Choose file and import')
      }), action.message && J.jsx('p', {
        role: 'alert',
        className: 'text-sm text-status-error',
        children: action.message
      })]
    });
  }
  function WorkspaceOrderSection() {
    const [rows, setRows] = R.useState([]),
      action = useAction();
    const refresh = () => window.shineAI.workspace.list().then(setRows);
    R.useEffect(() => {
      void refresh().catch(error => useUIStore.getState().showToast(error.message, 'error'));
    }, []);
    async function move(index, delta) {
      const next = [...rows];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      const result = await window.shineAI.workspace.reorder(next.map(w => w.id));
      if (result.success) {
        setRows(next);
        window.dispatchEvent(new CustomEvent('shineai:workspaces-reordered'));
      }
      return result;
    }
    return J.jsxs('section', {
      'data-testid': 'workspace-order',
      className: 'space-y-3 border-t border-border pt-5',
      children: [J.jsx('h3', {
        className: 'text-sm font-medium text-text-primary',
        children: say('工作区显示顺序', 'Workspace order')
      }), !rows.length && J.jsx('p', {
        className: 'text-sm text-text-muted',
        children: say('创建工作区后可在这里调整顺序。', 'Create a workspace to arrange its position here.')
      }), ...rows.map((w, i) => J.jsxs('div', {
        className: 'flex items-center gap-2 rounded-lg border border-border px-3 py-2',
        children: [J.jsx('span', {
          className: 'min-w-0 flex-1 truncate text-sm text-text-primary',
          children: w.name
        }), J.jsx('button', {
          className: button,
          disabled: action.busy || i === 0,
          'aria-label': say('上移 ', 'Move up ') + w.name,
          onClick: () => action.run(() => move(i, -1)),
          children: '↑'
        }), J.jsx('button', {
          className: button,
          disabled: action.busy || i === rows.length - 1,
          'aria-label': say('下移 ', 'Move down ') + w.name,
          onClick: () => action.run(() => move(i, 1)),
          children: '↓'
        })]
      }, w.id)), action.message && J.jsx('p', {
        role: 'alert',
        children: action.message
      })]
    });
  }
  function DailyBoardEntry() {
    const [providers, setProviders] = R.useState([]),
      [provider, setProvider] = R.useState(''),
      [model, setModel] = R.useState(''),
      action = useAction();
    R.useEffect(() => {
      void action.run(async () => {
        const [items, config] = await Promise.all([window.shineAI.provider.getAll(), window.shineAI.dailyBoard.model()]);
        setProviders(items.filter(p => p.enabled));
        setProvider(config.providerId);
        setModel(config.model);
      });
    }, []);
    return J.jsxs('section', {
      'data-testid': 'daily-board-entry',
      className: 'space-y-4',
      children: [J.jsx('h2', {
        className: 'text-lg font-semibold text-text-primary',
        children: say('工作日报', 'Daily work report')
      }), J.jsx('p', {
        className: 'text-sm text-text-muted',
        children: say('按日期汇总本机会话，可查看进展、手动编辑和导出。日报与长期记忆分开保存，定时生成默认关闭。', 'Review local conversations by day, edit the report and export it. Reports are separate from long-term memory. Scheduling is off by default.')
      }), J.jsx('button', {
        type: 'button',
        className: button,
        onClick: () => upstream.openDailyBoard(),
        children: say('打开工作日报', 'Open daily report')
      }), J.jsx('h3', {
        className: 'pt-3 text-sm font-medium text-text-primary',
        children: say('日报使用的模型', 'Report model')
      }), J.jsx('select', {
        'aria-label': say('日报模型服务', 'Report provider'),
        className: input,
        value: provider,
        onChange: e => {
          setProvider(e.target.value);
          setModel('');
        },
        children: [J.jsx('option', {
          value: '',
          children: say('跟随摘要模型设置', 'Use the summary model')
        }), ...providers.map(p => J.jsx('option', {
          value: p.id,
          children: p.name
        }, p.id))]
      }), J.jsx('input', {
        'aria-label': say('日报模型名称', 'Report model name'),
        className: input,
        value: model,
        placeholder: say('留空使用服务商默认模型', 'Use the provider default model'),
        onChange: e => setModel(e.target.value)
      }), J.jsx('button', {
        className: button,
        disabled: action.busy,
        onClick: () => action.run(async () => {
          const result = await window.shineAI.dailyBoard.model({
            providerId: provider,
            model
          });
          if (result.ok) useUIStore.getState().showToast(say('日报模型设置已保存', 'Report model saved'), 'success');
          return result;
        }),
        children: say('保存模型设置', 'Save report model')
      }), action.message && J.jsx('p', {
        role: 'alert',
        className: 'text-sm text-status-error',
        children: action.message
      })]
    });
  }
  function BrowserPageToChat({
    compact = false,
    tabId
  } = {}) {
    const action = useAction();
    async function prepare() {
      const context = await window.shineAI.browser.pageContext(tabId);
      if (!context.ok) return context;
      const selected = useSessionStore.getState().selectedSessionId;
      if (!selected) throw Error(say('请先选择一个会话。', 'Select a conversation first.'));
      const ui = useUIStore.getState();
      const text = say('请根据以下网页内容回答我的问题：', 'Please use this webpage to answer my question:') + '\n\n' + context.title + '\n' + context.url + '\n\n<webpage-content>\n' + context.text + '\n</webpage-content>';
      ui.requestComposerInsert(selected, text);
      ui.showToast(say('网页已放入当前会话输入框，确认后发送。', 'Webpage added to the current draft. Review it before sending.'), 'success');
      return {
        ok: true
      };
    }
    return J.jsxs('div', {
      'data-testid': 'browser-page-to-chat',
      className: compact ? 'relative shrink-0' : 'space-y-2',
      children: [J.jsx('button', {
        type: 'button',
        className: button,
        disabled: action.busy,
        title: say('将当前网页放入会话输入框', 'Add current page to chat draft'),
        onClick: () => action.run(prepare),
        children: compact ? say('交给 AI', 'Ask AI') : say('将当前网页放入会话输入框', 'Add current page to chat draft')
      }), action.message && J.jsx('p', {
        role: 'alert',
        className: compact ? 'absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-bg-secondary p-2 text-sm text-status-error' : 'text-sm text-status-error',
        children: action.message
      })]
    });
  }
  function Global108Host() {
    R.useEffect(() => window.shineAI.dailyBoard.onScheduledReady(notice => useUIStore.getState().showToast(say('工作日报已更新：', 'Daily report updated: ') + notice.date, 'success')), []);
    return J.jsxs(R.Fragment, {
      children: [J.jsx(upstream.DailyBoardModal, {}), J.jsx(upstream.WebLlmPendingBar, {})]
    });
  }
  return {
    CookieImportSection,
    WorkspaceOrderSection,
    DailyBoardEntry,
    BrowserPageToChat,
    Global108Host
  };
}
