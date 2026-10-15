import { u as useTranslation, r as reactExports, a as useForceUpgradeState, d as useTeamStore, j as jsxRuntimeExports, F as ForceUpgradeGate, ai as MissionControlCockpit } from "./index-0LVJEr5c.js";
function parseInstanceId() {
  const hash = window.location.hash;
  const match = hash.match(/[?&]instanceId=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
function MissionControlWindowPage() {
  const { t } = useTranslation("rendererMisc");
  const instanceId = reactExports.useMemo(parseInstanceId, []);
  const [initializing, setInitializing] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const updateState = useForceUpgradeState();
  reactExports.useEffect(() => {
    if (!instanceId) {
      setInitializing(false);
      return;
    }
    let cancelled = false;
    const init = async () => {
      const store = useTeamStore.getState();
      try {
        await store.loadTeamInstances();
        let targetInstance = useTeamStore.getState().teamInstances.find((item) => item.id === instanceId) ?? null;
        if (!targetInstance) {
          const fetched = await window.shineAI?.team?.getInstance?.(instanceId);
          if (fetched) {
            useTeamStore.setState((state) => ({
              teamInstances: state.teamInstances.some((item) => item.id === fetched.id) ? state.teamInstances.map((item) => item.id === fetched.id ? fetched : item) : [fetched, ...state.teamInstances]
            }));
            targetInstance = fetched;
          }
        }
        if (!targetInstance) {
          if (!cancelled) setError(t("missionControlWindow.instanceNotFound"));
          return;
        }
        store.setActiveInstanceId(instanceId);
        await Promise.allSettled([
          store.loadTasks(instanceId),
          store.loadMessages(instanceId),
          store.fetchQueueStatus(instanceId),
          store.fetchReviewerPoolStatus(instanceId)
        ]);
        store.initTeamListeners();
      } catch (err) {
        console.error("[MissionControlWindowPage] init failed:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("missionControlWindow.loadFailed"));
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
      useTeamStore.getState().cleanupTeamListeners();
    };
  }, [instanceId]);
  if (updateState?.isForcedUpgrade) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ForceUpgradeGate, { updateState });
  }
  if (!instanceId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-screen items-center justify-center bg-bg-primary pt-9 text-text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t("missionControlWindow.missingInstanceId") }) });
  }
  if (initializing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-screen items-center justify-center bg-bg-primary pt-9 text-sm text-text-secondary", children: t("missionControlWindow.loading") });
  }
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-screen items-center justify-center bg-bg-primary pt-9 text-sm text-accent-pink", children: error });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-screen w-screen overflow-hidden bg-bg-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    MissionControlCockpit,
    {
      instanceId,
      variant: "window",
      onClose: () => window.close(),
      onDockBack: () => window.close()
    }
  ) });
}
export {
  MissionControlWindowPage as default
};
