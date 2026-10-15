import { u as useTranslation, r as reactExports, a as useForceUpgradeState, i as initRendererStoreListeners, l as loadRendererStoreData, b as useSettingsStore, c as useSessionStore, d as useTeamStore, S as SURFACE_META, j as jsxRuntimeExports, F as ForceUpgradeGate, e as SurfaceHost, G as GlobalToast, f as isDetachableSurfaceKind } from "./index-0LVJEr5c.js";
function parseSurfaceFromHash() {
  const query = window.location.hash.split("?")[1] || "";
  const params = new URLSearchParams(query);
  const raw = params.get("kind");
  const kind = isDetachableSurfaceKind(raw) ? raw : null;
  const sessionId = params.get("sessionId")?.trim();
  const instanceId = params.get("instanceId")?.trim();
  return { kind, boundSessionId: sessionId || void 0, instanceId: instanceId || void 0 };
}
function SurfaceWindow() {
  const { t } = useTranslation("settingsWecomSettingsTab");
  const initialized = reactExports.useRef(false);
  const [query, setQuery] = reactExports.useState(parseSurfaceFromHash);
  const [ready, setReady] = reactExports.useState(false);
  const updateState = useForceUpgradeState();
  const { kind, boundSessionId, instanceId } = query;
  reactExports.useEffect(() => {
    const off = window.shineAI?.surfaceWindow?.onParamsChanged?.((next) => {
      setQuery((prev) => ({
        ...prev,
        boundSessionId: next.boundSessionId ?? prev.boundSessionId,
        instanceId: next.instanceId ?? void 0
      }));
    });
    return () => off?.();
  }, []);
  reactExports.useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initRendererStoreListeners({ commandExecution: true });
    void loadRendererStoreData().then(() => {
      const fontSize = useSettingsStore.getState().settings.fontSize || 14;
      document.documentElement.style.setProperty("--font-size-base", `${fontSize}px`);
      if (boundSessionId) useSessionStore.getState().selectSession(boundSessionId);
      setReady(true);
    });
  }, [boundSessionId]);
  reactExports.useEffect(() => {
    if (kind !== "teams" || !instanceId) return;
    useTeamStore.getState().setActiveInstanceId(instanceId);
  }, [kind, instanceId]);
  reactExports.useEffect(() => {
    if (kind) document.title = SURFACE_META[kind].label;
  }, [kind]);
  if (updateState?.isForcedUpgrade) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ForceUpgradeGate, { updateState });
  }
  if (!kind) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-screen items-center justify-center bg-bg-primary text-text-muted", children: t("surfaceWindow.invalidParams") });
  }
  if (!ready) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-screen items-center justify-center bg-bg-primary text-text-muted text-sm", children: t("surfaceWindow.loading") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen flex-col bg-bg-primary", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex h-9 shrink-0 items-center border-b border-border bg-bg-secondary px-20",
        style: { WebkitAppRegion: "drag" },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "select-none text-xs text-text-muted", style: { WebkitAppRegion: "no-drag" }, children: SURFACE_META[kind].label })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SurfaceHost, { kind, boundSessionId }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GlobalToast, {})
  ] });
}
export {
  SurfaceWindow as default
};
