import { r as reactExports, u as useTranslation, d as useTeamStore, g as useReducedMotion, a as useForceUpgradeState, h as getSceneMembers, j as jsxRuntimeExports, F as ForceUpgradeGate, Z as ZoomOut, R as RotateCcw, k as ZoomIn, M as Minus, m as Square, n as Maximize2, X, C as CANVAS_HEIGHT, o as CANVAS_WIDTH, O as OfficeSceneCore } from "./index-0LVJEr5c.js";
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;
const PAN_MARGIN = 180;
function parseInstanceIdFromHash() {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf("?");
  if (queryIndex < 0) return null;
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  return params.get("instanceId");
}
function clampZoom(nextZoom) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2))));
}
function getCenteredPan(viewport, zoom) {
  return {
    x: (viewport.width - CANVAS_WIDTH * zoom) / 2,
    y: (viewport.height - CANVAS_HEIGHT * zoom) / 2
  };
}
function clampAxis(offset, viewportLength, scaledLength) {
  if (viewportLength <= 0) return offset;
  if (scaledLength <= viewportLength) {
    const centeredOffset = (viewportLength - scaledLength) / 2;
    return Math.min(centeredOffset + PAN_MARGIN, Math.max(centeredOffset - PAN_MARGIN, offset));
  }
  const minOffset = viewportLength - scaledLength - PAN_MARGIN;
  const maxOffset = PAN_MARGIN;
  return Math.min(maxOffset, Math.max(minOffset, offset));
}
function clampPan(nextPan, viewport, zoom) {
  const scaledWidth = CANVAS_WIDTH * zoom;
  const scaledHeight = CANVAS_HEIGHT * zoom;
  return {
    x: clampAxis(nextPan.x, viewport.width, scaledWidth),
    y: clampAxis(nextPan.y, viewport.height, scaledHeight)
  };
}
const TITLE_BAR_BTN = "flex h-8 w-10 items-center justify-center text-text-muted transition-colors hover:text-text-primary";
const OfficeSceneWindow = reactExports.memo(function OfficeSceneWindow2() {
  const { t } = useTranslation("teamsAssignTaskDialog");
  const teamInstances = useTeamStore((state) => state.teamInstances);
  const activeInstanceId = useTeamStore((state) => state.activeInstanceId);
  const tasks = useTeamStore((state) => state.tasks);
  const messages = useTeamStore((state) => state.messages);
  const prefersReducedMotion = useReducedMotion();
  const viewportRef = reactExports.useRef(null);
  const [initializing, setInitializing] = reactExports.useState(true);
  const updateState = useForceUpgradeState();
  const [zoom, setZoom] = reactExports.useState(1);
  const [pan, setPan] = reactExports.useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = reactExports.useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = reactExports.useState(false);
  const [hasUserTransformed, setHasUserTransformed] = reactExports.useState(false);
  const dragStateRef = reactExports.useRef(null);
  const zoomRef = reactExports.useRef(zoom);
  const panRef = reactExports.useRef(pan);
  reactExports.useEffect(() => {
    const init = async () => {
      const store = useTeamStore.getState();
      try {
        await store.loadTeamInstances();
        const urlInstanceId = parseInstanceIdFromHash();
        const { teamInstances: loaded } = useTeamStore.getState();
        const targetId = urlInstanceId ?? loaded.find((i) => i.status === "running")?.id ?? loaded[0]?.id ?? null;
        if (targetId) {
          store.setActiveInstanceId(targetId);
          await Promise.all([
            store.loadTasks(targetId),
            store.loadMessages(targetId),
            store.loadProductivitySnapshot(targetId)
          ]);
        }
        store.initTeamListeners();
      } catch (e) {
        console.error("[OfficeSceneWindow] init failed:", e);
      } finally {
        setInitializing(false);
      }
    };
    init();
    return () => {
      useTeamStore.getState().cleanupTeamListeners();
    };
  }, []);
  reactExports.useEffect(() => {
    const electronBridge = window.electron;
    const ipcRenderer = electronBridge?.ipcRenderer;
    if (!ipcRenderer?.on) return;
    const cleanup = ipcRenderer.on("office:switch-instance", async (newInstanceId) => {
      const store = useTeamStore.getState();
      try {
        await store.loadTeamInstances();
        store.setActiveInstanceId(newInstanceId);
        await Promise.all([
          store.loadTasks(newInstanceId),
          store.loadMessages(newInstanceId),
          store.loadProductivitySnapshot(newInstanceId)
        ]);
      } catch (e) {
        console.error("[OfficeSceneWindow] switch failed:", e);
      }
    });
    return typeof cleanup === "function" ? cleanup : void 0;
  }, []);
  reactExports.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  reactExports.useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  reactExports.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setViewportSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  reactExports.useEffect(() => {
    if (viewportSize.width <= 0 || viewportSize.height <= 0 || hasUserTransformed) return;
    setPan(clampPan(getCenteredPan(viewportSize, zoomRef.current), viewportSize, zoomRef.current));
  }, [hasUserTransformed, viewportSize]);
  const activeInstance = reactExports.useMemo(
    () => teamInstances.find((instance) => instance.id === activeInstanceId),
    [activeInstanceId, teamInstances]
  );
  const sceneMembers = reactExports.useMemo(
    () => getSceneMembers(activeInstance),
    [activeInstance?.members, activeInstance?.goalRound]
  );
  reactExports.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        window.shineAI?.office?.closeWindow();
      } else if (event.key === "F11") {
        event.preventDefault();
        window.shineAI?.office?.toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const applyZoom = (nextZoomValue, anchorPoint) => {
    const el = viewportRef.current;
    const clamped = clampZoom(nextZoomValue);
    if (!el) {
      setZoom(clamped);
      return;
    }
    const anchor = anchorPoint ?? { x: el.clientWidth / 2, y: el.clientHeight / 2 };
    const cur = zoomRef.current || 1;
    const worldX = (anchor.x - panRef.current.x) / cur;
    const worldY = (anchor.y - panRef.current.y) / cur;
    const nextPan = clampPan(
      { x: anchor.x - worldX * clamped, y: anchor.y - worldY * clamped },
      viewportSize,
      clamped
    );
    zoomRef.current = clamped;
    setZoom(clamped);
    setPan(nextPan);
    setHasUserTransformed(true);
  };
  const resetView = () => {
    const next = 1;
    zoomRef.current = next;
    setZoom(next);
    setHasUserTransformed(false);
    setPan(clampPan(getCenteredPan(viewportSize, next), viewportSize, next));
  };
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    applyZoom(zoomRef.current + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP), anchor);
  };
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('[data-no-pan="true"]')) return;
    dragStateRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originPan: panRef.current
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setHasUserTransformed(true);
  };
  const handlePointerMove = (e) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    setPan(clampPan(
      { x: ds.originPan.x + e.clientX - ds.startClientX, y: ds.originPan.y + e.clientY - ds.startClientY },
      viewportSize,
      zoomRef.current
    ));
  };
  const endDrag = (e) => {
    const ds = dragStateRef.current;
    if (!ds || ds.pointerId !== e.pointerId) return;
    dragStateRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };
  if (updateState?.isForcedUpgrade) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ForceUpgradeGate, { updateState });
  }
  if (initializing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-screen w-screen items-center justify-center bg-bg-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-text-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-medium", children: t("officeWindow.loading") }) }) });
  }
  if (!activeInstance || sceneMembers.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-screen w-screen items-center justify-center bg-bg-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-text-muted", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-medium", children: t("officeWindow.noData") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-sm", children: t("officeWindow.activateHint") })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col overflow-hidden bg-bg-primary", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex h-9 shrink-0 items-center justify-between border-b border-border bg-[#161b22]",
        style: { WebkitAppRegion: "drag" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "select-none pl-3 text-xs text-text-muted", children: [
            t("officeWindow.title"),
            " ",
            activeInstance.name
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center",
              style: { WebkitAppRegion: "no-drag" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => applyZoom(zoomRef.current - ZOOM_STEP), className: TITLE_BAR_BTN, "aria-label": t("officeWindow.zoomOut"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomOut, { className: "h-3.5 w-3.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: resetView, className: TITLE_BAR_BTN, "aria-label": t("officeWindow.resetView"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3.5 w-3.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => applyZoom(zoomRef.current + ZOOM_STEP), className: TITLE_BAR_BTN, "aria-label": t("officeWindow.zoomIn"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomIn, { className: "h-3.5 w-3.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "w-10 text-center text-tiny text-text-muted", children: [
                  Math.round(zoom * 100),
                  "%"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-1 h-4 w-px bg-border" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => window.shineAI?.office?.minimizeWindow(), className: TITLE_BAR_BTN, "aria-label": t("officeWindow.minimize"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-3.5 w-3.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => window.shineAI?.office?.maximizeWindow(), className: TITLE_BAR_BTN, "aria-label": t("officeWindow.maximize"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3 w-3" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => window.shineAI?.office?.toggleFullscreen(), className: TITLE_BAR_BTN, "aria-label": t("officeWindow.fullscreen"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize2, { className: "h-3.5 w-3.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => window.shineAI?.office?.closeWindow(),
                    className: "flex h-8 w-10 items-center justify-center text-text-muted transition-colors hover:bg-accent-red/20 hover:text-accent-red",
                    "aria-label": t("officeWindow.close"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
                  }
                )
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: viewportRef,
        className: [
          "relative flex-1 min-h-0 overflow-hidden select-none touch-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        ].join(" "),
        onWheel: handleWheel,
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute left-0 top-0 will-change-transform",
            style: {
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transformOrigin: "0 0",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              OfficeSceneCore,
              {
                activeInstance,
                tasks,
                messages,
                enableSceneRuntime: true,
                prefersReducedMotion: prefersReducedMotion ?? false
              }
            )
          }
        )
      }
    )
  ] });
});
OfficeSceneWindow.displayName = "OfficeSceneWindow";
export {
  OfficeSceneWindow as default
};
