import { ao as useBrowserCopy, r as reactExports, ap as isMacPlatform, a as useForceUpgradeState, aq as hostFromUrl, ar as getBrowserBridge, as as normalizeBrowserUrl, j as jsxRuntimeExports, F as ForceUpgradeGate, at as WifiOff, au as isSecureUrl, av as BrowserTabStrip, aw as BrowserPolicyBar, ax as ArrowLeft, a1 as ArrowRight, X, ay as RefreshCw, az as Lock, aA as Globe, aB as Copy, aC as ExternalLink, aD as cn, aE as Search, aF as Star, aG as History, aH as Bookmark, aI as Bot, aJ as TriangleAlert, aK as AiActivityDrawer, aL as BrowserHistoryPanel, aM as BrowserBookmarksPanel, an as isPrimaryModifierPressed } from "./index-0LVJEr5c.js";
const EMPTY_STATE = { tabs: [], activeTabId: null };
const AI_HIGHLIGHT_MS = 6e3;
const MAX_AI_EVENTS = 60;
const DRAG = { WebkitAppRegion: "drag" };
const NO_DRAG = { WebkitAppRegion: "no-drag" };
const PANEL_WIDTH = 320;
const isBookmarkable = (url) => Boolean(url && /^https?:/i.test(url));
const TOOL_BTN = "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent";
function ToolbarButton({
  label,
  disabled,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      title: label,
      "aria-label": label,
      disabled,
      onClick,
      style: NO_DRAG,
      className: TOOL_BTN,
      children
    }
  );
}
function BrowserWindowApp() {
  const copy = useBrowserCopy();
  const isMac = reactExports.useMemo(() => isMacPlatform(), []);
  const updateState = useForceUpgradeState();
  const [bridge, setBridge] = reactExports.useState(null);
  const [kernelChecked, setKernelChecked] = reactExports.useState(false);
  const [retryTick, setRetryTick] = reactExports.useState(0);
  const [state, setState] = reactExports.useState(EMPTY_STATE);
  const [aiEvents, setAiEvents] = reactExports.useState([]);
  const [panel, setPanel] = reactExports.useState("none");
  const [bookmarks, setBookmarks] = reactExports.useState([]);
  const [addressValue, setAddressValue] = reactExports.useState("");
  const [addressFocused, setAddressFocused] = reactExports.useState(false);
  const [addressError, setAddressError] = reactExports.useState(null);
  const [copied, setCopied] = reactExports.useState(false);
  const [nowTs, setNowTs] = reactExports.useState(() => Date.now());
  const barRef = reactExports.useRef(null);
  const drawerRef = reactExports.useRef(null);
  const addressRef = reactExports.useRef(null);
  const lastClosedUrls = reactExports.useRef([]);
  const [canReopenClosed, setCanReopenClosed] = reactExports.useState(false);
  const [menuOpen, setMenuOpen] = reactExports.useState(false);
  const { tabs, activeTabId, cdpPort } = state;
  const activeTab = reactExports.useMemo(() => tabs.find((tab) => tab.tabId === activeTabId) ?? null, [tabs, activeTabId]);
  const hasError = Boolean(activeTab?.errorText?.trim());
  const hasTabs = tabs.length > 0;
  const tabTitles = reactExports.useMemo(() => {
    const map = {};
    for (const tab of tabs) map[tab.tabId] = tab.title?.trim() || hostFromUrl(tab.url);
    return map;
  }, [tabs]);
  const aiActiveTabIds = reactExports.useMemo(() => {
    const ids = /* @__PURE__ */ new Set();
    for (const event of aiEvents) {
      if (nowTs - event.at < AI_HIGHLIGHT_MS) ids.add(event.tabId);
    }
    return ids;
  }, [aiEvents, nowTs]);
  reactExports.useEffect(() => {
    if (!bridge) return;
    let disposed = false;
    bridge.listBookmarks().then((result) => {
      if (!disposed) setBookmarks(result?.entries ?? []);
    }).catch((err) => console.error("[BrowserWindowApp] listBookmarks failed:", err));
    return () => {
      disposed = true;
    };
  }, [bridge, retryTick]);
  const isCurrentBookmarked = reactExports.useMemo(
    () => bookmarks.some((entry) => entry.url === activeTab?.url),
    [bookmarks, activeTab?.url]
  );
  reactExports.useEffect(() => {
    const nextBridge = getBrowserBridge();
    setBridge(nextBridge);
    setKernelChecked(true);
    if (!nextBridge) {
      setState(EMPTY_STATE);
      return;
    }
    let disposed = false;
    nextBridge.getState().then((snapshot) => {
      if (!disposed && snapshot) setState(snapshot);
    }).catch((err) => console.error("[BrowserWindowApp] getState failed:", err));
    const offState = nextBridge.onStateChanged((snapshot) => {
      if (!disposed && snapshot) setState(snapshot);
    });
    const offAi = nextBridge.onAiActivity?.((event) => {
      if (disposed || !event) return;
      setAiEvents((prev) => [event, ...prev].slice(0, MAX_AI_EVENTS));
      setNowTs(Date.now());
    });
    return () => {
      disposed = true;
      offState?.();
      offAi?.();
    };
  }, [retryTick]);
  reactExports.useEffect(() => {
    if (aiEvents.length === 0) return;
    const timer = window.setInterval(() => setNowTs(Date.now()), 1e3);
    return () => window.clearInterval(timer);
  }, [aiEvents.length]);
  reactExports.useEffect(() => {
    if (addressFocused) return;
    setAddressValue(activeTab?.url ?? "");
    setAddressError(null);
  }, [activeTab?.url, addressFocused]);
  reactExports.useEffect(() => {
    const title = activeTab?.title?.trim();
    document.title = title ? `${title} — ${copy.windowTitle}` : copy.windowTitleFallback;
  }, [activeTab?.title, copy.windowTitle, copy.windowTitleFallback]);
  const panelOpen = panel !== "none";
  const reportBounds = reactExports.useCallback(() => {
    if (!bridge) return;
    const barHeight = Math.round(barRef.current?.getBoundingClientRect().height ?? 0);
    const panelWidth = panelOpen ? Math.round(drawerRef.current?.getBoundingClientRect().width ?? PANEL_WIDTH) : 0;
    const contentWidth = window.innerWidth;
    const contentHeight = window.innerHeight;
    const hideView = hasError || !hasTabs || menuOpen;
    bridge.setViewBounds({
      x: 0,
      y: barHeight,
      width: Math.max(0, contentWidth - panelWidth),
      height: hideView ? 0 : Math.max(0, contentHeight - barHeight)
    });
  }, [bridge, panelOpen, hasError, hasTabs, menuOpen]);
  reactExports.useEffect(() => {
    if (!bridge) return;
    reportBounds();
    const observer = new ResizeObserver(() => reportBounds());
    if (barRef.current) observer.observe(barRef.current);
    if (drawerRef.current) observer.observe(drawerRef.current);
    window.addEventListener("resize", reportBounds);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reportBounds);
    };
  }, [bridge, reportBounds]);
  const createTab = reactExports.useCallback(
    async (url) => {
      if (!bridge) return;
      try {
        await bridge.createTab(url);
      } catch (err) {
        console.error("[BrowserWindowApp] createTab failed:", err);
      }
    },
    [bridge]
  );
  const closeTab = reactExports.useCallback(
    async (tabId) => {
      if (!bridge) return;
      const closing = tabs.find((tab) => tab.tabId === tabId);
      if (closing?.url && closing.url !== "about:blank") {
        lastClosedUrls.current = [closing.url, ...lastClosedUrls.current].slice(0, 10);
        setCanReopenClosed(true);
      }
      try {
        await bridge.closeTab(tabId);
      } catch (err) {
        console.error("[BrowserWindowApp] closeTab failed:", err);
      }
    },
    [bridge, tabs]
  );
  const activateTab = reactExports.useCallback(
    async (tabId) => {
      if (!bridge || tabId === activeTabId) return;
      try {
        await bridge.activateTab(tabId);
      } catch (err) {
        console.error("[BrowserWindowApp] activateTab failed:", err);
      }
    },
    [bridge, activeTabId]
  );
  const takeoverTab = reactExports.useCallback(
    async (tabId) => {
      if (!bridge) return;
      try {
        await bridge.takeoverTab?.(tabId);
      } catch (err) {
        console.error("[BrowserWindowApp] takeoverTab failed:", err);
      }
    },
    [bridge]
  );
  const resolvePolicy = reactExports.useCallback(
    (action) => {
      if (!bridge) return;
      void bridge.resolvePolicy?.(action).catch((err) => {
        console.error("[BrowserWindowApp] resolvePolicy failed:", err);
      });
    },
    [bridge]
  );
  const openUrl = reactExports.useCallback(
    async (url) => {
      if (!bridge || !url) return;
      try {
        if (activeTabId) {
          const result = await bridge.navigate(activeTabId, url);
          if (!result?.ok && result?.error) setAddressError(result.error);
        } else {
          await bridge.createTab(url);
        }
      } catch (err) {
        console.error("[BrowserWindowApp] navigate failed:", err);
      }
    },
    [bridge, activeTabId]
  );
  const submitAddress = reactExports.useCallback(
    async (raw) => {
      if (!bridge) return;
      const target = normalizeBrowserUrl(raw);
      if (!target) {
        setAddressError(copy.navFailed);
        return;
      }
      setAddressError(null);
      await openUrl(target);
    },
    [bridge, copy.navFailed, openUrl]
  );
  const toggleBookmark = reactExports.useCallback(async () => {
    const url = activeTab?.url;
    if (!bridge || !isBookmarkable(url)) return;
    try {
      const result = isCurrentBookmarked ? await bridge.removeBookmark(url) : await bridge.addBookmark(url, activeTab?.title?.trim() || void 0);
      if (result?.entries) setBookmarks(result.entries);
    } catch (err) {
      console.error("[BrowserWindowApp] toggle bookmark failed:", err);
    }
  }, [bridge, activeTab?.title, activeTab?.url, isCurrentBookmarked]);
  const removeBookmark = reactExports.useCallback(
    async (url) => {
      if (!bridge) return;
      try {
        const result = await bridge.removeBookmark(url);
        if (result?.entries) setBookmarks(result.entries);
      } catch (err) {
        console.error("[BrowserWindowApp] removeBookmark failed:", err);
      }
    },
    [bridge]
  );
  const reloadActive = reactExports.useCallback(() => {
    if (!bridge || !activeTabId) return;
    void bridge.reload(activeTabId).catch((err) => console.error("[BrowserWindowApp] reload failed:", err));
  }, [bridge, activeTabId]);
  const reloadTab = reactExports.useCallback(
    (tabId) => {
      if (!bridge) return;
      void bridge.reload(tabId).catch((err) => console.error("[BrowserWindowApp] reloadTab failed:", err));
    },
    [bridge]
  );
  const duplicateTab = reactExports.useCallback(
    (tabId) => {
      const tab = tabs.find((item) => item.tabId === tabId);
      const url = tab?.url && tab.url !== "about:blank" ? tab.url : void 0;
      void createTab(url);
    },
    [createTab, tabs]
  );
  const closeOtherTabs = reactExports.useCallback(
    (tabId) => {
      for (const tab of tabs) {
        if (tab.tabId !== tabId) void closeTab(tab.tabId);
      }
    },
    [closeTab, tabs]
  );
  const closeTabsToRight = reactExports.useCallback(
    (tabId) => {
      const index = tabs.findIndex((tab) => tab.tabId === tabId);
      if (index < 0) return;
      for (const tab of tabs.slice(index + 1)) void closeTab(tab.tabId);
    },
    [closeTab, tabs]
  );
  const reopenClosedTab = reactExports.useCallback(() => {
    const url = lastClosedUrls.current.shift();
    setCanReopenClosed(lastClosedUrls.current.length > 0);
    if (url) void createTab(url);
  }, [createTab]);
  const closeBrowserWindow = reactExports.useCallback(() => {
    window.close();
  }, []);
  reactExports.useEffect(() => {
    const onKeyDown = (event) => {
      if (!isPrimaryModifierPressed(event) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "t") {
        event.preventDefault();
        if (event.shiftKey) {
          reopenClosedTab();
        } else {
          void createTab();
        }
        return;
      }
      if (key === "w") {
        event.preventDefault();
        if (activeTabId) void closeTab(activeTabId);
        return;
      }
      if (key === "l") {
        event.preventDefault();
        addressRef.current?.focus();
        addressRef.current?.select();
        return;
      }
      if (key === "r") {
        event.preventDefault();
        reloadActive();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createTab, closeTab, activeTabId, reloadActive, reopenClosedTab]);
  const handleCopyUrl = reactExports.useCallback(() => {
    if (!activeTab?.url) return;
    navigator.clipboard.writeText(activeTab.url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch((err) => console.error("[BrowserWindowApp] copy failed:", err));
  }, [activeTab?.url]);
  const closePanel = reactExports.useCallback(() => setPanel("none"), []);
  const togglePanel = reactExports.useCallback(
    (next) => setPanel((prev) => prev === next ? "none" : next),
    []
  );
  if (updateState?.isForcedUpgrade) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ForceUpgradeGate, { updateState });
  }
  if (!kernelChecked) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-screen w-screen bg-bg-primary" });
  }
  if (!bridge) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col items-center justify-center gap-4 bg-bg-primary px-8 text-center text-text-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { className: "h-10 w-10 text-text-muted" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-base font-semibold", children: copy.kernelNotReadyTitle }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-md text-xs leading-relaxed text-text-muted", children: copy.kernelNotReadyHint })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setRetryTick((tick) => tick + 1),
          className: "rounded-md bg-accent-blue px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90",
          children: copy.kernelNotReadyRetry
        }
      )
    ] });
  }
  const canGoBack = Boolean(activeTab?.canGoBack);
  const canGoForward = Boolean(activeTab?.canGoForward);
  const isLoading = Boolean(activeTab?.isLoading);
  const secure = activeTab ? isSecureUrl(activeTab.url) : false;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex h-screen w-screen flex-col overflow-hidden bg-bg-primary text-text-primary", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: barRef, className: "relative flex shrink-0 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        BrowserTabStrip,
        {
          tabs,
          activeTabId,
          aiActiveTabIds,
          copy,
          isMac,
          policy: state.policy,
          onActivate: (tabId) => void activateTab(tabId),
          onTakeover: (tabId) => void takeoverTab(tabId),
          onClose: (tabId) => void closeTab(tabId),
          onNewTab: () => void createTab(),
          onReloadTab: reloadTab,
          onDuplicateTab: duplicateTab,
          onCloseOthers: closeOtherTabs,
          onCloseToRight: closeTabsToRight,
          onReopenClosed: reopenClosedTab,
          onCloseWindow: closeBrowserWindow,
          canReopenClosed,
          onMenuOpenChange: setMenuOpen
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BrowserPolicyBar, { policy: state.policy, copy, onResolve: resolvePolicy }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex h-10 shrink-0 items-center gap-1 border-b border-border bg-bg-primary px-2",
          style: DRAG,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { label: copy.back, disabled: !canGoBack, onClick: () => bridge && activeTabId && bridge.back(activeTabId), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ToolbarButton,
              {
                label: copy.forward,
                disabled: !canGoForward,
                onClick: () => bridge && activeTabId && bridge.forward(activeTabId),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
              }
            ),
            isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { label: copy.stop, onClick: () => bridge && activeTabId && bridge.stop(activeTabId), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { label: copy.reload, disabled: !activeTabId, onClick: () => void reloadActive(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "form",
              {
                className: "flex min-w-0 flex-1 items-center",
                style: NO_DRAG,
                onSubmit: (event) => {
                  event.preventDefault();
                  void submitAddress(addressValue);
                  addressRef.current?.blur();
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: cn(
                        "flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md border bg-bg-secondary px-2 transition-colors",
                        addressFocused ? "border-accent-blue" : "border-border"
                      ),
                      children: [
                        secure ? /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3.5 w-3.5 shrink-0 text-accent-green", "aria-label": copy.secure }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-3.5 w-3.5 shrink-0 text-text-muted", "aria-label": copy.insecure }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            ref: addressRef,
                            value: addressValue,
                            spellCheck: false,
                            placeholder: copy.addressPlaceholder,
                            onChange: (event) => {
                              setAddressValue(event.target.value);
                              if (addressError) setAddressError(null);
                            },
                            onFocus: (event) => {
                              setAddressFocused(true);
                              event.target.select();
                            },
                            onBlur: () => setAddressFocused(false),
                            className: "min-w-0 flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
                          }
                        ),
                        isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-tiny text-text-muted", children: copy.loading }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            title: copied ? copy.copied : copy.copyUrl,
                            "aria-label": copy.copyUrl,
                            disabled: !activeTab?.url,
                            onClick: handleCopyUrl,
                            className: "flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:text-text-primary disabled:opacity-30",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3" })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            title: copy.openInSystem,
                            "aria-label": copy.openInSystem,
                            disabled: !activeTab?.url || !/^https?:/i.test(activeTab.url) || typeof bridge?.openInSystem !== "function",
                            onClick: () => {
                              const url = activeTab?.url;
                              if (url) void bridge?.openInSystem?.(url);
                            },
                            className: "flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:text-text-primary disabled:opacity-30",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { label: copy.go, onClick: () => void submitAddress(addressValue), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }) })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ToolbarButton,
              {
                label: isCurrentBookmarked ? copy.bookmarkRemove : copy.bookmarkAdd,
                disabled: !isBookmarkable(activeTab?.url),
                onClick: () => void toggleBookmark(),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: cn("h-4 w-4", isCurrentBookmarked && "text-accent-yellow"), fill: isCurrentBookmarked ? "currentColor" : "none" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { label: copy.historyTitle, onClick: () => togglePanel("history"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { label: copy.bookmarksTitle, onClick: () => togglePanel("bookmarks"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                title: cdpPort ? copy.aiBadgeTooltipOn : copy.aiBadgeTooltipOff,
                onClick: () => togglePanel("ai"),
                className: cn(
                  "relative flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-caption font-medium transition-colors",
                  cdpPort ? "border-accent-purple/40 bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20" : "border-border bg-bg-secondary text-text-muted hover:bg-bg-hover"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-3.5 w-3.5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: cdpPort ? copy.aiBadgeOn(cdpPort) : copy.aiBadgeOff }),
                  panel !== "ai" && aiActiveTabIds.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent-purple" })
                ]
              }
            )
          ]
        }
      ),
      isLoading && // ponytail: 用 pulse 近似不确定进度条，避免改动 tailwind keyframes。
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-x-0 bottom-0 h-0.5 animate-pulse bg-accent-blue/70" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex min-h-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-w-0 flex-1 items-center justify-center", children: hasError ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex max-w-md flex-col items-center gap-3 px-8 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-9 w-9 text-accent-yellow" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-text-primary", children: copy.errorTitle }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-text-secondary", children: activeTab?.errorText }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-caption text-text-muted", children: copy.errorHint }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => void reloadActive(),
              className: "flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
                copy.errorRetry
              ]
            }
          ),
          activeTab?.canGoBack && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => bridge && activeTabId && bridge.back(activeTabId),
              className: "flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3.5 w-3.5" }),
                copy.back
              ]
            }
          )
        ] })
      ] }) : !hasTabs ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex max-w-md flex-col items-center gap-3 px-8 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-10 w-10 text-text-muted/70" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-text-primary", children: copy.emptyTitle }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-text-muted", children: copy.emptyHint }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => void createTab(),
            className: "mt-1 rounded-md bg-accent-blue px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90",
            children: copy.emptyNewTab
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-caption text-text-muted/80", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "⌘/Ctrl+T ",
            copy.shortcutNewTab
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "⌘/Ctrl+W ",
            copy.shortcutCloseTab
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "⌘/Ctrl+L ",
            copy.shortcutAddress
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "⌘/Ctrl+R ",
            copy.shortcutReload
          ] })
        ] })
      ] }) : null }),
      panel !== "none" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: drawerRef, className: "shrink-0", children: panel === "ai" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        AiActivityDrawer,
        {
          events: aiEvents,
          tabTitles,
          copy,
          onClose: closePanel,
          onClear: () => setAiEvents([])
        }
      ) : panel === "history" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        BrowserHistoryPanel,
        {
          bridge,
          copy,
          onClose: closePanel,
          onNavigate: (url) => void openUrl(url)
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        BrowserBookmarksPanel,
        {
          entries: bookmarks,
          copy,
          onClose: closePanel,
          onNavigate: (url) => void openUrl(url),
          onRemove: (url) => void removeBookmark(url)
        }
      ) })
    ] }),
    addressError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-x-0 top-[76px] flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-auto rounded-md bg-accent-red/90 px-3 py-1 text-caption text-white shadow", children: addressError }) })
  ] });
}
export {
  BrowserWindowApp as default
};
