import { a5 as React, u as useTranslation, ag as useMeetingStore, r as reactExports, j as jsxRuntimeExports, M as Minus, m as Square, X, ah as MeetingPanel } from "./index-0LVJEr5c.js";
const TITLE_BAR_BTN = "flex items-center justify-center w-9 h-8 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue";
const MeetingWindow = React.memo(function MeetingWindow2() {
  const { t } = useTranslation("layoutTypes");
  const setMeetingPanelOpen = useMeetingStore((state) => state.setMeetingPanelOpen);
  reactExports.useEffect(() => {
    setMeetingPanelOpen(true);
  }, [setMeetingPanelOpen]);
  const handleMinimize = reactExports.useCallback(() => {
    window.shineAI?.meeting?.minimizeWindow?.();
  }, []);
  const handleMaximize = reactExports.useCallback(() => {
    window.shineAI?.meeting?.maximizeWindow?.();
  }, []);
  const handleClose = reactExports.useCallback(() => {
    window.shineAI?.meeting?.closeWindow?.();
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col overflow-hidden bg-bg-primary text-text-primary", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-9 shrink-0 select-none items-center border-b border-border bg-bg-secondary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "flex h-full flex-1 items-center px-3",
          style: { WebkitAppRegion: "drag" },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-text-secondary", children: t("meetingWindow.title") })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center",
          style: { WebkitAppRegion: "no-drag" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleMinimize, className: TITLE_BAR_BTN, title: t("meetingWindow.minimize"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleMaximize, className: TITLE_BAR_BTN, title: t("meetingWindow.maximizeRestore"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5" }) }),
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
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative min-h-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MeetingPanel, { variant: "window", onRequestClose: handleClose }) })
  ] });
});
MeetingWindow.displayName = "MeetingWindow";
export {
  MeetingWindow as default
};
