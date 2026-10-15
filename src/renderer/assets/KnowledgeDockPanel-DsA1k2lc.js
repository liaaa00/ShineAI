import { u as useTranslation, aP as useContainerWidth, aQ as useKnowledgeLibraryStore, c as useSessionStore, r as reactExports, aR as deriveProjectPath, aS as sortLibraries, aT as projectDisplayName, j as jsxRuntimeExports, aU as KnowledgeSidebarView, aV as Settings2, aW as KnowledgeDocList, aX as KnowledgeDocEditor, aY as KnowledgeToastHost, ax as ArrowLeft } from "./index-0LVJEr5c.js";
const WIDE_MIN_WIDTH = 640;
function KnowledgeDockPanel() {
  const { t } = useTranslation("knowledge");
  const [containerRef, width] = useContainerWidth();
  const wide = width >= WIDE_MIN_WIDTH;
  const libraries = useKnowledgeLibraryStore((s) => s.libraries);
  const activeLibraryId = useKnowledgeLibraryStore((s) => s.activeLibraryId);
  const activeRelPath = useKnowledgeLibraryStore((s) => s.activeRelPath);
  const projectPath = useKnowledgeLibraryStore((s) => s.projectPath);
  const init = useKnowledgeLibraryStore((s) => s.init);
  const setProjectPath = useKnowledgeLibraryStore((s) => s.setProjectPath);
  const selectLibrary = useKnowledgeLibraryStore((s) => s.selectLibrary);
  const sessions = useSessionStore((s) => s.sessions);
  const selectedSessionId = useSessionStore((s) => s.selectedSessionId);
  const [view, setView] = reactExports.useState("list");
  reactExports.useEffect(() => {
    void setProjectPath(deriveProjectPath(sessions, selectedSessionId));
  }, [sessions, selectedSessionId, setProjectPath]);
  reactExports.useEffect(() => {
    void init();
  }, []);
  const prevRelPath = reactExports.useRef(activeRelPath);
  reactExports.useEffect(() => {
    if (activeRelPath === prevRelPath.current) return;
    prevRelPath.current = activeRelPath;
    setView((current) => {
      if (current === "libraries") return current;
      return activeRelPath ? "doc" : "list";
    });
  }, [activeRelPath]);
  const prevLibraryId = reactExports.useRef(activeLibraryId);
  reactExports.useEffect(() => {
    if (activeLibraryId === prevLibraryId.current) return;
    prevLibraryId.current = activeLibraryId;
    setView((current) => current === "libraries" ? "list" : current);
  }, [activeLibraryId]);
  const projectLibraries = reactExports.useMemo(() => sortLibraries(libraries, "project"), [libraries]);
  const globalLibraries = reactExports.useMemo(() => sortLibraries(libraries, "global"), [libraries]);
  const projectName = projectDisplayName(projectPath);
  const showLibraries = view === "libraries" || libraries.length === 0;
  const backButton = (label, onClick, testId) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick,
      "data-testid": testId,
      className: "inline-flex min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-caption text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3 w-3 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: label })
      ]
    }
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: containerRef,
      className: "relative flex h-full w-full min-h-0 flex-col overflow-hidden bg-bg-primary",
      "data-testid": "knowledge-dock-panel",
      "data-layout": wide ? "wide" : "narrow",
      children: [
        showLibraries ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          libraries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex shrink-0 items-center border-b border-border px-2 py-1", children: backButton(t("dock.backToDocs"), () => setView("list"), "knowledge-dock-back-docs") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KnowledgeSidebarView, {}) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-1.5 border-b border-border px-2 py-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: activeLibraryId ?? "",
                onChange: (event) => void selectLibrary(event.target.value),
                "aria-label": t("dock.switchLibrary"),
                title: t("dock.switchLibrary"),
                "data-testid": "knowledge-dock-library-select",
                className: "min-w-0 flex-1 truncate rounded border border-border bg-bg-secondary px-2 py-1 text-xs text-text-primary focus:border-accent-blue focus:outline-none",
                children: [
                  !activeLibraryId && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("doc.selectLibrary") }),
                  projectLibraries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "optgroup",
                    {
                      label: projectPath ? t("library.groupProject", { project: projectName ?? "" }) : t("library.groupAllProjects"),
                      children: projectLibraries.map((library) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: library.id, children: library.name }, library.id))
                    }
                  ),
                  globalLibraries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("optgroup", { label: t("library.groupGlobal"), children: globalLibraries.map((library) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: library.id, children: library.name }, library.id)) })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                title: t("dock.manageLibraries"),
                "aria-label": t("dock.manageLibraries"),
                onClick: () => setView("libraries"),
                "data-testid": "knowledge-dock-manage",
                className: "shrink-0 rounded p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "h-3.5 w-3.5" })
              }
            )
          ] }),
          wide ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full min-h-0 w-[280px] shrink-0 overflow-hidden border-r border-border/60", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KnowledgeDocList, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full min-h-0 min-w-0 flex-1 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KnowledgeDocEditor, {}) })
          ] }) : view === "doc" && activeRelPath ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1 flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex shrink-0 items-center border-b border-border px-2 py-1", children: backButton(t("dock.backToList"), () => setView("list"), "knowledge-dock-back-list") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KnowledgeDocEditor, {}) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KnowledgeDocList, { onOpenDoc: () => setView("doc") }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(KnowledgeToastHost, {})
      ]
    }
  );
}
export {
  WIDE_MIN_WIDTH,
  KnowledgeDockPanel as default
};
