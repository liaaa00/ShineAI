import { u as useTranslation, p as useButlerStore, q as useHubPendingCount, s as useButlerGoalPendingCount, r as reactExports, t as startProposalSync, v as useButlerAssistantStore, d as useTeamStore, w as usePetInteraction, x as resolveSpeciesFromAvatarType, y as isToastMuted, j as jsxRuntimeExports, z as motion, A as PET_INTERACTION, B as AnimatePresence, D as ClipboardList, E as Minimize2, X, H as ButlerSessionOverview, I as ButlerAssistantChatWindow, J as FileText, K as instance, L as getPetMoodVisual, N as usePrefersReducedMotion, Q as adaptWholeMotionToRenderBox, T as resolvePetShellMotion, U as LayeredPetRenderer, V as PET_STAGES, W as PetEffects, Y as PetSpeechBubble, _ as getToastActionKind, $ as canShowMuteButton, a0 as buildInterventionToast, a1 as ArrowRight, a2 as Send, a3 as THEMES, a4 as DEFAULT_THEME_ID } from "./index-0LVJEr5c.js";
const FLOAT_WINDOW_COLLAPSED_SIZE = 80;
const FLOAT_WINDOW_EXPANDED_WIDTH = 470;
const FLOAT_WINDOW_EXPANDED_HEIGHT = 700;
const FLOAT_WINDOW_TOAST_WIDTH = 300;
const FLOAT_WINDOW_TOAST_HEIGHT = 220;
const FLOAT_TOAST_DURATION_MS = 5e3;
const FLOAT_DRAG_THRESHOLD_PX = 4;
const THEME_STORAGE_KEY = "claudeops-theme";
const BASE_FLOAT_TABS = [
  { key: "overview", label: instance.t("butlerButlerAssistant:floatWindow.tabs.overview"), helper: instance.t("butlerButlerAssistant:floatWindow.tabs.overviewHelper") },
  { key: "light", label: instance.t("butlerButlerAssistant:floatWindow.tabs.light"), helper: instance.t("butlerButlerAssistant:floatWindow.tabs.lightHelper") }
];
const ASSISTANT_FLOAT_TABS = [
  { key: "chat", label: instance.t("butlerButlerAssistant:floatWindow.tabs.chat"), helper: instance.t("butlerButlerAssistant:floatWindow.tabs.chatHelper") }
];
function resolveStoredThemeId() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme && THEMES[storedTheme]) {
      return storedTheme;
    }
  } catch {
  }
  return DEFAULT_THEME_ID;
}
function applyStoredThemeClass() {
  const theme = resolveStoredThemeId();
  const html = document.documentElement;
  Array.from(html.classList).forEach((cls) => {
    if (cls.startsWith("theme-")) html.classList.remove(cls);
  });
  html.classList.add(`theme-${theme}`);
}
const INTERVENTION_STYLE = {
  confirmation: { icon: "🔐", color: "bg-accent-blue/20 border-accent-blue/30", label: instance.t("butlerButlerAssistant:floatWindow.interventionType.confirmation") },
  question: { icon: "❓", color: "bg-accent-purple/20 border-accent-purple/30", label: instance.t("butlerButlerAssistant:floatWindow.interventionType.question") },
  plan_approval: { icon: "📋", color: "bg-accent-yellow/20 border-accent-yellow/30", label: instance.t("butlerButlerAssistant:floatWindow.interventionType.planApproval") },
  stuck: { icon: "⏳", color: "bg-accent-yellow/20 border-accent-yellow/30", label: instance.t("butlerButlerAssistant:floatWindow.interventionType.stuck") },
  error: { icon: "⚠️", color: "bg-accent-red/20 border-accent-red/30", label: instance.t("butlerButlerAssistant:floatWindow.interventionType.error") },
  task_complete: { icon: "✅", color: "bg-accent-green/20 border-accent-green/30", label: instance.t("butlerButlerAssistant:floatWindow.interventionType.complete") },
  greeting: { icon: "👋", color: "bg-accent-cyan/20 border-accent-cyan/30", label: instance.t("butlerButlerAssistant:floatWindow.interventionType.greeting") }
};
function getElementRectInFloatWindow(element) {
  const rect = element.getBoundingClientRect();
  if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top) || rect.width <= 0 || rect.height <= 0) {
    return null;
  }
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height
  };
}
function FloatAvatar({ persona, mood, badge, taunt }) {
  const visual = getPetMoodVisual(mood);
  const reduced = usePrefersReducedMotion();
  const speciesKey = resolveSpeciesFromAvatarType(persona.avatarType, persona.petSpecies);
  const moodMotion = adaptWholeMotionToRenderBox(
    resolvePetShellMotion(mood, reduced, speciesKey, PET_STAGES[0]),
    FLOAT_WINDOW_COLLAPSED_SIZE
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      className: `
        relative flex h-20 w-20 items-center justify-center rounded-full
        border-2 ${visual.css.border} ${visual.css.glow}
        cursor-grab bg-[var(--v2-bg-elevated)] shadow-lg backdrop-blur-sm
        transition-shadow duration-200 active:cursor-grabbing hover:border-opacity-80 hover:shadow-xl pet-hover-glow
      `,
      animate: moodMotion.animate,
      transition: moodMotion.transition,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LayeredPetRenderer,
          {
            mood,
            avatarType: persona.avatarType,
            species: persona.petSpecies,
            stage: PET_STAGES[0],
            size: FLOAT_WINDOW_COLLAPSED_SIZE,
            alt: persona.name,
            applyMoodMotion: false
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PetEffects, { effects: visual.effects, size: FLOAT_WINDOW_COLLAPSED_SIZE }),
        badge > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          motion.span,
          {
            className: "absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-red px-1 text-tiny font-bold leading-none text-white",
            initial: { scale: 0 },
            animate: { scale: 1 },
            transition: { type: "spring", stiffness: 500, damping: 20 },
            children: badge > 99 ? "99+" : badge
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PetSpeechBubble, { text: taunt })
      ]
    }
  );
}
function FloatToast({
  intervention,
  onClick,
  onDismiss,
  onConfirm,
  onMute
}) {
  const { t } = useTranslation("butlerButlerAssistant");
  const kind = getToastActionKind(intervention);
  const showMute = canShowMuteButton(intervention);
  reactExports.useEffect(() => {
    if (kind !== "dismiss_only") return;
    const timer = window.setTimeout(onDismiss, FLOAT_TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [kind, onDismiss]);
  const stop = (event) => {
    event.stopPropagation();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      className: "pointer-events-auto absolute bottom-[88px] right-3 z-40 max-w-[260px] cursor-pointer rounded-lg border border-[color:var(--v2-border-default)] bg-[var(--v2-bg-elevated)] px-3 py-2 shadow-xl backdrop-blur-md",
      style: { backgroundColor: "var(--v2-bg-elevated)" },
      initial: { y: 10, opacity: 0, scale: 0.9 },
      animate: { y: 0, opacity: 1, scale: 1 },
      exit: { y: 10, opacity: 0, scale: 0.9 },
      transition: { duration: 0.2 },
      onClick: (event) => {
        event.stopPropagation();
        onClick();
      },
      title: intervention.sessionId ? t("shared.clickToJump") : t("floatWindow.clickToExpandCockpit"),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "line-clamp-2 text-xs leading-snug text-[var(--v2-text-primary)]", children: buildInterventionToast(intervention) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex flex-wrap items-center gap-1", children: [
          kind === "confirm_in_place" && onConfirm && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "rounded bg-accent-green px-1.5 py-0.5 text-tiny text-white hover:bg-accent-green/85",
              onClick: (event) => {
                stop(event);
                onConfirm();
              },
              children: t("common:actions.confirm")
            }
          ),
          (kind === "confirm_in_place" || kind === "goto_only") && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: "inline-flex items-center gap-0.5 rounded border border-[color:var(--v2-border-default)] px-1.5 py-0.5 text-tiny text-[var(--v2-accent)]",
              onClick: (event) => {
                stop(event);
                onClick();
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 10 }),
                intervention.sessionId ? t("shared.jump") : t("common:actions.expand")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "rounded px-1.5 py-0.5 text-tiny text-[var(--v2-text-muted)] hover:text-[var(--v2-text-primary)]",
              onClick: (event) => {
                stop(event);
                onDismiss();
              },
              children: t("common:actions.close")
            }
          ),
          showMute && onMute && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "rounded px-1.5 py-0.5 text-tiny text-[var(--v2-text-muted)] hover:text-[var(--v2-text-primary)]",
              onClick: (event) => {
                stop(event);
                onMute();
              },
              children: t("shared.muteType")
            }
          )
        ] })
      ]
    }
  );
}
function InterventionItem({
  intervention,
  onRespond,
  onGoto,
  onDismiss
}) {
  const [replyText, setReplyText] = reactExports.useState("");
  const { t } = useTranslation("butlerButlerAssistant");
  const style = INTERVENTION_STYLE[intervention.type] ?? INTERVENTION_STYLE.confirmation;
  const needsTextReply = ["question", "stuck", "error"].includes(intervention.type);
  const handleSubmitReply = (event) => {
    event.preventDefault();
    const text = replyText.trim();
    if (!text) return;
    onRespond(intervention.id, {
      action: intervention.type === "question" ? "answer" : "message",
      answer: text,
      text,
      answers: { answer: text, text, "0": text }
    });
    setReplyText("");
  };
  const handleConfirm = () => {
    if (intervention.type === "plan_approval") {
      onRespond(intervention.id, { action: "approve", approved: true });
    } else {
      onRespond(intervention.id, { action: "confirm", answer: "yes" });
    }
  };
  const handleReject = () => {
    if (intervention.type === "plan_approval") {
      onRespond(intervention.id, { action: "reject", approved: false });
    } else {
      onRespond(intervention.id, { action: "reject", answer: "no" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `rounded-lg border p-2.5 ${style.color}
        ${intervention.resolved ? "opacity-50" : ""}
        ${intervention.riskLevel === "high" ? "ring-1 ring-accent-red/50" : ""}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs text-[var(--v2-text-secondary)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: style.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate font-medium", children: intervention.sessionName }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-black/10 px-1 py-0.5 text-tiny text-[var(--v2-text-muted)]", children: style.label }),
          intervention.riskLevel === "high" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-tiny text-accent-red", children: t("shared.highRisk") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "rounded p-0.5 text-[var(--v2-text-muted)] transition-colors hover:bg-[var(--v2-accent-subtle)] hover:text-[var(--v2-text-primary)]",
              onClick: () => onDismiss(intervention.id),
              title: t("floatWindow.markHandled"),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 12 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-xs text-[var(--v2-text-muted)]", children: intervention.detail || intervention.summary }),
        !intervention.resolved && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 space-y-2", children: [
          (intervention.type === "confirmation" || intervention.type === "plan_approval") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "flex-1 rounded bg-accent-green px-2 py-1 text-tiny font-medium text-white hover:bg-accent-green/85",
                onClick: handleConfirm,
                children: t("common:actions.confirm")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "flex-1 rounded bg-accent-red px-2 py-1 text-tiny font-medium text-white hover:bg-accent-red/85",
                onClick: handleReject,
                children: t("shared.reject")
              }
            )
          ] }),
          needsTextReply && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "flex items-center gap-1.5", onSubmit: handleSubmitReply, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: replyText,
                onChange: (event) => setReplyText(event.target.value),
                placeholder: intervention.type === "question" ? t("shared.placeholderAnswer") : t("shared.placeholderReply"),
                className: "min-w-0 flex-1 rounded border border-[color:var(--v2-border-default)] bg-[var(--v2-bg-surface)] px-2 py-1 text-caption text-[var(--v2-text-primary)] outline-none placeholder:text-[var(--v2-text-muted)] focus:border-[var(--v2-accent)]"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "submit",
                disabled: !replyText.trim(),
                className: "rounded bg-[var(--v2-accent)] px-2 py-1 text-tiny font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
                title: t("shared.sendReply"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 11 })
              }
            )
          ] }),
          intervention.sessionId && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: "flex items-center gap-0.5 rounded border border-[color:var(--v2-border-default)] bg-[var(--v2-bg-surface)] px-2 py-1 text-tiny font-medium text-[var(--v2-text-secondary)] transition-colors hover:bg-[var(--v2-accent-subtle)] hover:text-[var(--v2-text-primary)]",
              onClick: () => onGoto(intervention.sessionId),
              title: t("shared.jumpToSession"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 9 }),
                t("shared.openSession")
              ]
            }
          )
        ] })
      ]
    }
  );
}
function ButlerFloatWindow() {
  const { t } = useTranslation("butlerButlerAssistant");
  const persona = useButlerStore((s) => s.persona);
  const rawMood = useButlerStore((s) => s.mood);
  const goalPendingCount = useHubPendingCount(useButlerGoalPendingCount());
  const mood = goalPendingCount > 0 ? "alert" : rawMood;
  reactExports.useEffect(() => startProposalSync(), []);
  const status = useButlerStore((s) => s.status);
  const config = useButlerStore((s) => s.config);
  const sessionOverview = useButlerStore((s) => s.sessionOverview);
  const pendingInterventions = useButlerStore((s) => s.pendingInterventions);
  const respondToIntervention = useButlerStore((s) => s.respondToIntervention);
  const dismissIntervention = useButlerStore((s) => s.dismissIntervention);
  const muteToastType = useButlerStore((s) => s.muteToastType);
  const toastMuteRules = useButlerStore((s) => s.toastMuteRules);
  const clearAllInterventions = useButlerStore((s) => s.clearAllInterventions);
  const executeQuickAction = useButlerStore((s) => s.executeQuickAction);
  const fetchStatus = useButlerStore((s) => s.fetchStatus);
  const fetchConfig = useButlerStore((s) => s.fetchConfig);
  const fetchPersona = useButlerStore((s) => s.fetchPersona);
  const fetchOverview = useButlerStore((s) => s.fetchOverview);
  const fetchInterventions = useButlerStore((s) => s.fetchInterventions);
  const initButlerListeners = useButlerStore((s) => s.initListeners);
  const assistantEnabled = useButlerAssistantStore((s) => s.enabled);
  const setAssistantMode = useButlerAssistantStore((s) => s.setEntryMode);
  const refreshAssistantFeatureFlag = useButlerAssistantStore((s) => s.refreshFeatureFlag);
  const teamInstances = useTeamStore((s) => s.teamInstances);
  const loadTeamInstances = useTeamStore((s) => s.loadTeamInstances);
  const acquireTeamListener = useTeamStore((s) => s.acquireTeamListener);
  const releaseTeamListener = useTeamStore((s) => s.releaseTeamListener);
  const [showPopover, setShowPopover] = reactExports.useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = reactExports.useState(false);
  const [activeTab, setActiveTab] = reactExports.useState("overview");
  const [toastIntervention, setToastIntervention] = reactExports.useState(null);
  const [isAvatarDragging, setIsAvatarDragging] = reactExports.useState(false);
  const prevUnresolvedCountRef = reactExports.useRef(0);
  const unresolvedInterventions = reactExports.useMemo(
    () => pendingInterventions.filter((item) => !item.resolved),
    [pendingInterventions]
  );
  const unresolvedCount = unresolvedInterventions.length;
  const { taunt: petTaunt, trigger: triggerPetTaunt } = usePetInteraction({
    greetings: persona.greetings,
    personality: persona.personality,
    species: resolveSpeciesFromAvatarType(persona.avatarType, persona.petSpecies)
  });
  const floatTabs = reactExports.useMemo(
    () => assistantEnabled ? [...BASE_FLOAT_TABS, ...ASSISTANT_FLOAT_TABS] : BASE_FLOAT_TABS,
    [assistantEnabled]
  );
  const activeTeamInstances = reactExports.useMemo(
    () => teamInstances.filter((team) => ["starting", "running", "paused", "waiting_user"].includes(team.status)).slice(0, 8),
    [teamInstances]
  );
  reactExports.useEffect(() => {
    const cleanup = initButlerListeners();
    void fetchStatus();
    void fetchConfig();
    void fetchPersona();
    void fetchOverview();
    void fetchInterventions();
    return cleanup;
  }, [fetchConfig, fetchInterventions, fetchOverview, fetchPersona, fetchStatus, initButlerListeners]);
  reactExports.useEffect(() => {
    void refreshAssistantFeatureFlag();
  }, [refreshAssistantFeatureFlag]);
  reactExports.useEffect(() => {
    acquireTeamListener();
    void loadTeamInstances();
    return () => releaseTeamListener();
  }, [acquireTeamListener, loadTeamInstances, releaseTeamListener]);
  reactExports.useEffect(() => {
    document.documentElement.dataset.butlerView = showPopover ? "expanded" : toastIntervention ? "toast" : "avatar";
    if (showPopover) {
      window.shineAI?.butler?.resizeFloatWindow?.(FLOAT_WINDOW_EXPANDED_WIDTH, FLOAT_WINDOW_EXPANDED_HEIGHT);
    } else if (toastIntervention) {
      window.shineAI?.butler?.resizeFloatWindow?.(FLOAT_WINDOW_TOAST_WIDTH, FLOAT_WINDOW_TOAST_HEIGHT);
    } else {
      window.shineAI?.butler?.resizeFloatWindow?.(FLOAT_WINDOW_COLLAPSED_SIZE, FLOAT_WINDOW_COLLAPSED_SIZE);
    }
  }, [showPopover, toastIntervention]);
  reactExports.useEffect(() => {
    if (unresolvedCount > prevUnresolvedCountRef.current && !showPopover) {
      const latest = unresolvedInterventions[0];
      if (latest && !isToastMuted(latest, toastMuteRules)) setToastIntervention(latest);
    }
    prevUnresolvedCountRef.current = unresolvedCount;
  }, [unresolvedCount, unresolvedInterventions, showPopover, toastMuteRules]);
  reactExports.useEffect(() => {
    if (showPopover) setToastIntervention(null);
  }, [showPopover]);
  const ignoreMouseRef = reactExports.useRef(true);
  const popoverRef = reactExports.useRef(null);
  const requestIgnoreMouse = reactExports.useCallback((ignore) => {
    if (ignoreMouseRef.current === ignore) return;
    ignoreMouseRef.current = ignore;
    window.shineAI?.butler?.setIgnoreMouse?.(ignore);
  }, []);
  reactExports.useEffect(() => {
    window.shineAI?.butler?.setIgnoreMouse?.(true);
    ignoreMouseRef.current = true;
  }, []);
  const hasInteractiveContent = showPopover || showAvatarMenu || toastIntervention && !isAvatarDragging;
  reactExports.useEffect(() => {
    if (hasInteractiveContent) {
      requestIgnoreMouse(false);
    } else {
      requestIgnoreMouse(true);
    }
  }, [hasInteractiveContent, requestIgnoreMouse]);
  reactExports.useEffect(() => {
    if (!showPopover) return;
    const refreshDashboardData = () => {
      void fetchOverview();
      void fetchInterventions();
      void loadTeamInstances();
    };
    refreshDashboardData();
    const timer = window.setInterval(refreshDashboardData, Math.max(3e3, config.pollIntervalMs || 3e3));
    return () => window.clearInterval(timer);
  }, [config.pollIntervalMs, fetchInterventions, fetchOverview, loadTeamInstances, showPopover, status]);
  reactExports.useEffect(() => {
    if (!assistantEnabled && (activeTab === "chat" || activeTab === "remote")) {
      setActiveTab("overview");
    }
  }, [activeTab, assistantEnabled]);
  reactExports.useEffect(() => {
    const syncTheme = () => {
      applyStoredThemeClass();
    };
    const handleStorage = (event) => {
      if (event.key === null || event.key === THEME_STORAGE_KEY) {
        syncTheme();
      }
    };
    syncTheme();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncTheme);
    document.addEventListener("visibilitychange", syncTheme);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncTheme);
      document.removeEventListener("visibilitychange", syncTheme);
    };
  }, []);
  const dragStateRef = reactExports.useRef(null);
  const dragCleanupRef = reactExports.useRef(null);
  const suppressNextFloatClickRef = reactExports.useRef(false);
  const finishFloatDrag = reactExports.useCallback((pointerId) => {
    const state = dragStateRef.current;
    if (!state) return;
    if (typeof pointerId === "number" && state.pointerId !== pointerId) return;
    if (state.rafId !== null) {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    if (state.hasMoved) {
      void window.shineAI?.butler?.moveFloatWindow?.(state.nextX, state.nextY, state.moveOptions);
    }
    try {
      if (state.releaseTarget?.hasPointerCapture(state.pointerId)) {
        state.releaseTarget.releasePointerCapture(state.pointerId);
      }
    } catch {
    }
    dragStateRef.current = null;
    dragCleanupRef.current?.();
    dragCleanupRef.current = null;
    if (state.source === "avatar") {
      setIsAvatarDragging(false);
      if (state.hasMoved && state.dismissToastOnFinish) {
        setToastIntervention(null);
      }
    }
    suppressNextFloatClickRef.current = state.hasMoved;
    if (state.hasMoved) {
      window.setTimeout(() => {
        suppressNextFloatClickRef.current = false;
      }, 0);
    }
    if (!showPopover && !showAvatarMenu && !(toastIntervention && !isAvatarDragging)) {
      requestIgnoreMouse(true);
    }
  }, [showPopover, showAvatarMenu, toastIntervention, isAvatarDragging, requestIgnoreMouse]);
  const startFloatDrag = reactExports.useCallback((event, source = "window") => {
    if (event.button !== 0 || !event.isPrimary) return;
    const moveFloatWindow = window.shineAI?.butler?.moveFloatWindow;
    if (!moveFloatWindow) return;
    event.preventDefault();
    event.stopPropagation();
    finishFloatDrag();
    requestIgnoreMouse(false);
    const releaseTarget = event.currentTarget;
    const avatarClampRect = source === "avatar" ? getElementRectInFloatWindow(releaseTarget) : null;
    const moveOptions = avatarClampRect ? { mode: "avatar", clampRect: avatarClampRect } : void 0;
    const startWindowX = Number.isFinite(window.screenX) ? window.screenX : 0;
    const startWindowY = Number.isFinite(window.screenY) ? window.screenY : 0;
    if (source === "avatar") {
      setIsAvatarDragging(true);
    }
    const state = {
      pointerId: event.pointerId,
      source,
      startPointerX: event.screenX,
      startPointerY: event.screenY,
      startWindowX,
      startWindowY,
      nextX: startWindowX,
      nextY: startWindowY,
      hasMoved: false,
      dismissToastOnFinish: source === "avatar" && Boolean(toastIntervention) && !showPopover,
      moveOptions,
      rafId: null,
      releaseTarget
    };
    dragStateRef.current = state;
    try {
      releaseTarget.setPointerCapture(event.pointerId);
    } catch {
    }
    const handlePointerMove = (pointerEvent) => {
      const current = dragStateRef.current;
      if (!current || current.pointerId !== pointerEvent.pointerId) return;
      const dx = pointerEvent.screenX - current.startPointerX;
      const dy = pointerEvent.screenY - current.startPointerY;
      if (!current.hasMoved) {
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < FLOAT_DRAG_THRESHOLD_PX * FLOAT_DRAG_THRESHOLD_PX) return;
        current.hasMoved = true;
      }
      pointerEvent.preventDefault();
      current.nextX = current.startWindowX + dx;
      current.nextY = current.startWindowY + dy;
      if (current.rafId === null) {
        current.rafId = window.requestAnimationFrame(() => {
          current.rafId = null;
          void moveFloatWindow(current.nextX, current.nextY, current.moveOptions);
        });
      }
    };
    const handlePointerEnd = (pointerEvent) => {
      finishFloatDrag(pointerEvent.pointerId);
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    dragCleanupRef.current = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [finishFloatDrag, requestIgnoreMouse, showPopover, toastIntervention]);
  reactExports.useEffect(() => {
    return () => {
      const state = dragStateRef.current;
      if (state?.rafId !== null && state?.rafId !== void 0) {
        window.cancelAnimationFrame(state.rafId);
      }
      dragCleanupRef.current?.();
      dragCleanupRef.current = null;
      dragStateRef.current = null;
    };
  }, []);
  const handleRespond = reactExports.useCallback((id, response) => {
    void respondToIntervention(id, response);
  }, [respondToIntervention]);
  const handleDismiss = reactExports.useCallback((id) => {
    dismissIntervention(id);
  }, [dismissIntervention]);
  const handleGotoSession = reactExports.useCallback((sessionId) => {
    if (!sessionId) return;
    window.shineAI?.butler?.navigateToSession?.(sessionId);
    setShowPopover(false);
  }, []);
  const handleToastClick = reactExports.useCallback(() => {
    const current = toastIntervention;
    setToastIntervention(null);
    if (current?.sessionId) {
      window.shineAI?.butler?.navigateToSession?.(current.sessionId);
      return;
    }
    setShowPopover(true);
    setActiveTab("light");
  }, [toastIntervention]);
  const handleToastConfirm = reactExports.useCallback(async () => {
    const current = toastIntervention;
    if (!current) return;
    const result = await respondToIntervention(current.id, { action: "confirm", answer: "yes" });
    if (result.ok) {
      setToastIntervention(null);
      return;
    }
    setToastIntervention({
      ...current,
      type: "greeting",
      summary: t("floatWindow.jumpFailed"),
      detail: "",
      riskLevel: "low"
    });
    if (current.sessionId) window.shineAI?.butler?.navigateToSession?.(current.sessionId);
  }, [toastIntervention, respondToIntervention]);
  const handleToastDismiss = reactExports.useCallback(() => {
    const current = toastIntervention;
    setToastIntervention(null);
    if (current?.id) dismissIntervention(current.id);
  }, [toastIntervention, dismissIntervention]);
  const handleToastMute = reactExports.useCallback(() => {
    const current = toastIntervention;
    setToastIntervention(null);
    if (!current) return;
    void muteToastType(current);
    dismissIntervention(current.id);
  }, [toastIntervention, muteToastType, dismissIntervention]);
  const handleClose = reactExports.useCallback(() => {
    window.shineAI?.butler?.closeFloatWindow?.();
  }, []);
  const togglePopover = reactExports.useCallback(() => {
    setShowAvatarMenu(false);
    setShowPopover((prev) => {
      const next = !prev;
      if (next) setActiveTab("overview");
      return next;
    });
  }, []);
  const handleAvatarClick = reactExports.useCallback((event) => {
    event.stopPropagation();
    if (suppressNextFloatClickRef.current) {
      event.preventDefault();
      suppressNextFloatClickRef.current = false;
      return;
    }
    triggerPetTaunt();
    togglePopover();
  }, [togglePopover, triggerPetTaunt]);
  const handleAvatarContextMenu = reactExports.useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setShowPopover(true);
    setActiveTab("overview");
    setShowAvatarMenu(true);
  }, []);
  const handleSelectTab = reactExports.useCallback((tab) => {
    setActiveTab(tab);
    setShowAvatarMenu(false);
    if (tab === "chat" || tab === "light") {
      setAssistantMode(tab === "light" ? "light" : "chat");
    }
  }, [setAssistantMode]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-screen w-screen select-none overflow-hidden bg-transparent", onClick: () => setShowAvatarMenu(false), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 right-0 z-30 flex items-end gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        className: "h-20 w-20 cursor-grab rounded-full active:cursor-grabbing",
        style: { touchAction: "none" },
        whileHover: { scale: 1.06 },
        whileTap: { ...PET_INTERACTION.tap.animate, transition: PET_INTERACTION.tap.transition },
        onPointerDown: (event) => startFloatDrag(event, showPopover ? "window" : "avatar"),
        onClick: handleAvatarClick,
        onContextMenu: handleAvatarContextMenu,
        onPointerEnter: () => requestIgnoreMouse(false),
        onPointerLeave: () => {
          if (!hasInteractiveContent) requestIgnoreMouse(true);
        },
        title: t("floatWindow.avatarHint"),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(FloatAvatar, { persona, mood, badge: unresolvedCount, taunt: petTaunt })
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: toastIntervention && !showPopover && !isAvatarDragging && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        onPointerEnter: () => requestIgnoreMouse(false),
        onPointerLeave: () => requestIgnoreMouse(true),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          FloatToast,
          {
            intervention: toastIntervention,
            onClick: handleToastClick,
            onDismiss: handleToastDismiss,
            onConfirm: handleToastConfirm,
            onMute: handleToastMute
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: showPopover && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        ref: popoverRef,
        className: "absolute bottom-[76px] left-3 right-3 top-3 z-10 flex flex-col overflow-hidden rounded-2xl border border-[color:var(--v2-border-default)] bg-[var(--v2-bg-surface)]",
        style: {
          backgroundColor: "var(--v2-bg-surface)",
          boxShadow: "var(--v2-shadow-card)"
        },
        initial: { y: 20, opacity: 0, scale: 0.95 },
        animate: { y: 0, opacity: 1, scale: 1 },
        exit: { y: 10, opacity: 0, scale: 0.95 },
        transition: { duration: 0.2, ease: "easeOut" },
        onAnimationComplete: () => {
          if (popoverRef.current) popoverRef.current.style.transform = "none";
        },
        onClick: (event) => event.stopPropagation(),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-[color:var(--v2-border-default)] bg-[var(--v2-bg-surface)] px-3 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex min-w-0 flex-1 cursor-grab items-center gap-2 pr-3 active:cursor-grabbing",
                style: { touchAction: "none" },
                onPointerDown: startFloatDrag,
                title: t("floatWindow.dragToMove"),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { size: 15, className: "shrink-0 text-[var(--v2-accent)]" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium text-[var(--v2-text-primary)]", children: `${persona.name && persona.name !== "Butler" ? persona.name : instance.language.startsWith("zh") ? "小光" : "Assistant"} · ${instance.language.startsWith("zh") ? "任务总览" : "Overview"}` }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-accent-green/25 px-1.5 py-0.5 text-tiny text-accent-green", children: t("floatWindow.badge") })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "rounded p-1 text-[var(--v2-text-secondary)] transition-colors hover:bg-[var(--v2-accent-subtle)] hover:text-[var(--v2-text-primary)]",
                  onClick: handleClose,
                  title: t("floatWindow.closeFloatWindow"),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minimize2, { size: 14 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "rounded p-1 text-[var(--v2-text-secondary)] transition-colors hover:bg-[var(--v2-accent-subtle)] hover:text-[var(--v2-text-primary)]",
                  onClick: () => setShowPopover(false),
                  title: t("common:actions.collapse"),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-[color:var(--v2-border-default)] bg-[var(--v2-bg-surface)] px-2 py-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "grid gap-1 rounded-lg border border-[color:var(--v2-border-default)] bg-[var(--v2-bg-elevated)] p-1",
              style: { gridTemplateColumns: `repeat(${floatTabs.length}, minmax(0, 1fr))` },
              children: floatTabs.map((tab) => {
                const active = activeTab === tab.key;
                return /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleSelectTab(tab.key),
                    title: tab.helper,
                    className: `rounded-md px-2 py-1 text-caption font-medium transition-colors ${active ? "bg-[var(--v2-accent-subtle)] text-[var(--v2-accent)] shadow-sm" : "text-[var(--v2-text-secondary)] hover:bg-[var(--v2-bg-surface)] hover:text-[var(--v2-text-primary)]"}`,
                    children: tab.label
                  },
                  tab.key
                );
              })
            }
          ) }),
          activeTab === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            ButlerSessionOverview,
            {
              sessions: sessionOverview,
              interventions: pendingInterventions,
              teams: activeTeamInstances,
              onNavigateSession: handleGotoSession,
              compact: true
            }
          ) }),
          assistantEnabled && activeTab === "chat" && /* @__PURE__ */ jsxRuntimeExports.jsx(ButlerAssistantChatWindow, { variant: "compact" }),
          activeTab === "light" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1 flex-col", children: [
            unresolvedCount > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 border-b border-[color:var(--v2-border-default)] bg-[var(--v2-bg-elevated)] px-3 py-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-tiny text-[var(--v2-text-secondary)]", children: t("shared.pendingCount", { count: unresolvedCount }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "rounded bg-accent-green/70 px-2 py-0.5 text-tiny font-medium text-white hover:bg-accent-green/85",
                  onClick: () => executeQuickAction("confirm_all"),
                  children: t("shared.confirmAll")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "rounded bg-accent-red/70 px-2 py-0.5 text-tiny font-medium text-white hover:bg-accent-red/85",
                  onClick: () => executeQuickAction("reject_all"),
                  children: t("shared.rejectAll")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "rounded border border-[color:var(--v2-border-default)] bg-[var(--v2-bg-surface)] px-2 py-0.5 text-tiny text-[var(--v2-text-secondary)] transition-colors hover:bg-[var(--v2-accent-subtle)] hover:text-[var(--v2-text-primary)]",
                  onClick: clearAllInterventions,
                  children: t("shared.clear")
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2", children: pendingInterventions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-6 text-center text-xs text-[var(--v2-text-muted)]", children: mood === "sleeping" ? t("shared.butlerSleeping") : t("shared.noPendingEvents") }) : pendingInterventions.map((intervention) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              InterventionItem,
              {
                intervention,
                onRespond: handleRespond,
                onGoto: handleGotoSession,
                onDismiss: handleDismiss
              },
              intervention.id
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 border-t border-[color:var(--v2-border-default)] bg-[var(--v2-bg-elevated)] px-2 py-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  className: "flex items-center gap-1 rounded px-2 py-1 text-tiny text-[var(--v2-text-secondary)] transition-colors hover:bg-[var(--v2-accent-subtle)] hover:text-[var(--v2-text-primary)]",
                  onClick: () => executeQuickAction("briefing"),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 10 }),
                    " ",
                    t("shared.briefing")
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  className: "flex items-center gap-1 rounded px-2 py-1 text-tiny text-[var(--v2-text-muted)] transition-colors hover:bg-[var(--v2-accent-subtle)] hover:text-[var(--v2-text-primary)]",
                  onClick: handleClose,
                  title: t("floatWindow.closeDetachedWindow"),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Minimize2, { size: 10 }),
                    " ",
                    t("floatWindow.closeFloatWindow")
                  ]
                }
              )
            ] })
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: showAvatarMenu && showPopover && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        className: "absolute bottom-[76px] right-3 z-50 w-44 overflow-hidden rounded-xl border border-[color:var(--v2-border-default)] bg-[var(--v2-bg-surface)] p-1 text-xs shadow-2xl",
        initial: { opacity: 0, y: 8, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 6, scale: 0.98 },
        onClick: (event) => event.stopPropagation(),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "w-full rounded-lg px-3 py-2 text-left text-[var(--v2-text-secondary)] hover:bg-[var(--v2-accent-subtle)] hover:text-[var(--v2-text-primary)]",
              onClick: () => {
                setShowAvatarMenu(false);
                setShowPopover(false);
              },
              children: t("floatWindow.collapseLayer")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "w-full rounded-lg px-3 py-2 text-left text-accent-red hover:bg-accent-red/10 hover:text-accent-red",
              onClick: handleClose,
              children: t("floatWindow.closeFloatWindow")
            }
          )
        ]
      }
    ) })
  ] });
}
export {
  ButlerFloatWindow as default
};
