import { r as reactExports, j as jsxRuntimeExports, aO as ShellPanelHost } from "./index-0LVJEr5c.js";
function TerminalDockPanel() {
  const rootRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e) => {
      if (e.key === "Escape" && e.target instanceof Element && e.target.closest(".xterm")) e.stopPropagation();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: rootRef, className: "h-full w-full min-h-0 min-w-0 overflow-hidden", "data-dock-panel": "terminal", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShellPanelHost, { embedded: true }) });
}
export {
  TerminalDockPanel as default
};
