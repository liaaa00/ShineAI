import { u as useTranslation, r as reactExports, a as useForceUpgradeState, j as jsxRuntimeExports, F as ForceUpgradeGate, P as PrototypeWorkspace } from "./index-0LVJEr5c.js";
function getRuntime() {
  return window.shineAI;
}
function parseThemeConfig(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function PrototypeCanvasWindow() {
  const { t } = useTranslation("prototype");
  const { projectId, initialPageId, sessionId } = reactExports.useMemo(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    return {
      projectId: params.get("projectId") || "",
      initialPageId: params.get("pageId") || "",
      sessionId: params.get("sessionId") || ""
    };
  }, []);
  const [projectName, setProjectName] = reactExports.useState("");
  const [projectThemeConfig, setProjectThemeConfig] = reactExports.useState(null);
  const [ready, setReady] = reactExports.useState(false);
  const updateState = useForceUpgradeState();
  reactExports.useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void getRuntime().prototypeProject.get(projectId).then((row) => {
      if (cancelled || !row) return;
      setProjectName(row.name || "");
      const themeConfig = parseThemeConfig(row.themeConfig) ?? parseThemeConfig(row.theme_config);
      if (themeConfig) {
        setProjectThemeConfig(themeConfig);
      }
      setReady(true);
    }).catch(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);
  const [switchPageId, setSwitchPageId] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const unsubscribe = getRuntime().prototype.onSwitchPage((pageId) => {
      setSwitchPageId(pageId);
    });
    return unsubscribe;
  }, []);
  if (updateState?.isForcedUpgrade) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ForceUpgradeGate, { updateState });
  }
  if (!ready && projectId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-screen bg-bg-primary text-text-muted text-sm", children: t("window.loadingProject") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-screen flex flex-col bg-bg-primary", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 flex items-center px-3 py-2 border-b border-border bg-bg-secondary/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-text-primary truncate", children: projectName || t("window.title") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex flex-col", style: { overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      PrototypeWorkspace,
      {
        embedded: false,
        projectId: projectId || null,
        sessionId: sessionId || null,
        projectName,
        projectThemeConfig,
        pagesOverride: void 0,
        activePageIdOverride: switchPageId || initialPageId,
        onPageSelect: (pageId) => {
          setSwitchPageId(null);
        }
      }
    ) })
  ] });
}
export {
  PrototypeCanvasWindow as default
};
