import { u as useTranslation, r as reactExports, a as useForceUpgradeState, c as useSessionStore, aj as getSessionById, i as initRendererStoreListeners, l as loadRendererStoreData, b as useSettingsStore, j as jsxRuntimeExports, F as ForceUpgradeGate, X, ak as PinOff, al as Pin, M as Minus, m as Square, am as ConversationView, an as isPrimaryModifierPressed, G as GlobalToast } from "./index-0LVJEr5c.js";
const TITLE_BAR_BTN = "flex items-center justify-center w-9 h-8 rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue";
const CHROME_BASE = "flex h-full w-full flex-col overflow-hidden bg-bg-primary text-text-primary";
const CHROME_NORMAL = "rounded-[12px] border border-border/70";
const CHROME_MAXIMIZED = "rounded-none border-transparent";
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;
function parseSessionIdFromHash() {
  const query = window.location.hash.split("?")[1] || "";
  return new URLSearchParams(query).get("sessionId")?.trim() || "";
}
function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}
function applyZoom(value) {
  document.body.style.setProperty("zoom", String(value));
}
function WindowChrome({
  maximized,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `relative h-screen w-screen bg-transparent ${maximized ? "p-0" : "p-2"}`, children: [
    maximized ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${CHROME_BASE} ${CHROME_MAXIMIZED}`, children }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "session-chat-chrome-shadow h-full w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${CHROME_BASE} ${CHROME_NORMAL}`, children }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GlobalToast, {})
  ] });
}
function SessionChatWindow() {
  const { t } = useTranslation("screenshare");
  const sessionId = parseSessionIdFromHash();
  const initialized = reactExports.useRef(false);
  const zoomRef = reactExports.useRef(1);
  const [ready, setReady] = reactExports.useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = reactExports.useState(false);
  const [maximized, setMaximized] = reactExports.useState(false);
  const updateState = useForceUpgradeState();
  const session = useSessionStore((state) => sessionId ? getSessionById(state, sessionId) : void 0);
  const sessionName = session?.name || t("defaultSessionName");
  reactExports.useEffect(() => {
    document.title = sessionName;
  }, [sessionName]);
  reactExports.useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initRendererStoreListeners();
    void loadRendererStoreData().then(() => {
      const fontSize = useSettingsStore.getState().settings.fontSize || 14;
      document.documentElement.style.setProperty("--font-size-base", `${fontSize}px`);
      if (sessionId) {
        useSessionStore.getState().selectSession(sessionId);
      }
      setReady(true);
    });
  }, [sessionId]);
  reactExports.useEffect(() => {
    if (!sessionId) return;
    window.shineAI?.sessionChatWindow?.getAlwaysOnTop?.(sessionId).then((value) => setAlwaysOnTop(!!value)).catch(() => {
    });
  }, [sessionId]);
  reactExports.useEffect(() => {
    window.shineAI?.sessionChatWindow?.isMaximized?.(sessionId).then((value) => setMaximized(!!value)).catch(() => {
    });
    const unsubscribe = window.shineAI?.sessionChatWindow?.onMaximizedChanged?.((value) => {
      setMaximized(!!value);
    });
    return () => unsubscribe?.();
  }, [sessionId]);
  reactExports.useEffect(() => {
    const applyDelta = (delta) => {
      zoomRef.current = clampZoom(zoomRef.current + delta);
      applyZoom(zoomRef.current);
    };
    const resetZoom = () => {
      zoomRef.current = 1;
      applyZoom(1);
    };
    const handleKeyDown = (e) => {
      if (!isPrimaryModifierPressed(e) || e.altKey || e.shiftKey) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        applyDelta(ZOOM_STEP);
      } else if (e.key === "-") {
        e.preventDefault();
        applyDelta(-ZOOM_STEP);
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };
    const handleWheel = (e) => {
      if (!isPrimaryModifierPressed(e)) return;
      e.preventDefault();
      applyDelta(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);
  const handleMinimize = reactExports.useCallback(() => {
    window.shineAI?.sessionChatWindow?.minimizeWindow?.(sessionId);
  }, [sessionId]);
  const handleMaximize = reactExports.useCallback(() => {
    window.shineAI?.sessionChatWindow?.maximizeWindow?.(sessionId);
  }, [sessionId]);
  const handleTitleBarDoubleClick = reactExports.useCallback((event) => {
    event.stopPropagation();
    handleMaximize();
  }, [handleMaximize]);
  const handleClose = reactExports.useCallback(() => {
    window.shineAI?.sessionChatWindow?.closeWindow?.(sessionId);
  }, [sessionId]);
  const handleTogglePin = reactExports.useCallback(async () => {
    const next = !alwaysOnTop;
    await window.shineAI?.sessionChatWindow?.setAlwaysOnTop?.(next, sessionId);
    setAlwaysOnTop(next);
  }, [alwaysOnTop, sessionId]);
  if (updateState?.isForcedUpgrade) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ForceUpgradeGate, { updateState });
  }
  if (!sessionId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(WindowChrome, { maximized, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center text-text-muted", children: t("invalidSession") }) });
  }
  if (!ready) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(WindowChrome, { maximized, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center text-text-muted text-sm", children: t("loading") }) });
  }
  if (!session) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(WindowChrome, { maximized, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-9 shrink-0 select-none items-center border-b border-border/50 bg-bg-secondary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "flex h-full flex-1 items-center px-3",
            style: { WebkitAppRegion: "drag" },
            onDoubleClick: handleTitleBarDoubleClick,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "text-sm font-semibold text-text-primary",
                style: { WebkitAppRegion: "no-drag" },
                onDoubleClick: handleTitleBarDoubleClick,
                children: t("defaultSessionName")
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center", style: { WebkitAppRegion: "no-drag" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleClose, className: `${TITLE_BAR_BTN} hover:bg-accent-red/80 hover:text-white`, title: t("common:actions.close"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1 items-center justify-center text-sm text-text-muted", children: t("sessionNotFound") })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(WindowChrome, { maximized, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-9 shrink-0 select-none items-center border-b border-border/50 bg-bg-secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "flex h-full min-w-0 flex-1 items-center px-3",
          style: { WebkitAppRegion: "drag" },
          onDoubleClick: handleTitleBarDoubleClick,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "truncate text-sm font-semibold text-text-primary",
              style: { WebkitAppRegion: "no-drag" },
              onDoubleClick: handleTitleBarDoubleClick,
              children: sessionName
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center",
          style: { WebkitAppRegion: "no-drag" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: handleTogglePin,
                className: TITLE_BAR_BTN,
                title: alwaysOnTop ? t("titleBar.unpin") : t("titleBar.pin"),
                children: alwaysOnTop ? /* @__PURE__ */ jsxRuntimeExports.jsx(PinOff, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "h-3.5 w-3.5" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleMinimize, className: TITLE_BAR_BTN, title: t("titleBar.minimize"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleMaximize, className: TITLE_BAR_BTN, title: t("titleBar.maximizeOrRestore"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: handleClose,
                className: `${TITLE_BAR_BTN} hover:bg-accent-red/80 hover:text-white`,
                title: t("common:actions.close"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
              }
            )
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative flex min-h-0 flex-1 flex-col overflow-hidden", "data-conversation-scope": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ConversationView, { sessionId }) })
  ] });
}
export {
  SessionChatWindow as default
};
