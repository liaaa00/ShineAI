import { a5 as React, u as useTranslation, r as reactExports, a6 as attachLiveKitTrack, j as jsxRuntimeExports, a7 as Room, a8 as getRemoteParticipants, a9 as getParticipantIdentity, aa as getParticipantDisplayName, ab as getTrackPublications, ac as isPublicationMuted, ad as isScreenShareVideoPublication, ae as getPublicationTrack, af as getPublicationTrackId } from "./index-0LVJEr5c.js";
const TITLE_BAR_BTN = `
  flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition-colors cursor-pointer
  focus:outline-none focus:ring-2 focus:ring-white/30
`;
const DRAG_REGION = "flex-1 h-full cursor-move";
const SCREEN_WINDOW_EVENTS = [
  "trackSubscribed",
  "trackUnsubscribed",
  "trackMuted",
  "trackUnmuted",
  "participantConnected",
  "participantDisconnected",
  "connectionStateChanged"
];
function collectScreenShareTracks(room) {
  return getRemoteParticipants(room).flatMap((participant) => {
    const participantId = getParticipantIdentity(participant);
    if (!participantId) return [];
    const participantName = getParticipantDisplayName(participant, participantId);
    return getTrackPublications(participant).flatMap((publication) => {
      if (isPublicationMuted(publication) || !isScreenShareVideoPublication(publication)) return [];
      const track = getPublicationTrack(publication);
      if (!track) return [];
      return [{
        participant,
        publication,
        track,
        trackId: getPublicationTrackId(publication, participantId, "screen-video"),
        participantId,
        participantName,
        isLocal: false
      }];
    });
  });
}
const ScreenShareWindow = React.memo(function ScreenShareWindow2() {
  const { t } = useTranslation("screenshare");
  const [videoTracks, setVideoTracks] = reactExports.useState([]);
  const [isFullscreen, setIsFullscreen] = reactExports.useState(false);
  const [isMaximized, setIsMaximized] = reactExports.useState(false);
  const videoRef = reactExports.useRef(null);
  const roomRef = reactExports.useRef(null);
  const detachRef = reactExports.useRef(() => void 0);
  reactExports.useEffect(() => {
    let disposed = false;
    let cleanupRoomEvents = null;
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const initRoom = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
        const serverUrl = urlParams.get("serverUrl") || localStorage.getItem("meeting_serverUrl") || "";
        const token = urlParams.get("token") || localStorage.getItem("meeting_token") || "";
        if (!serverUrl || !token) {
          console.warn("[ScreenShareWindow] Missing serverUrl or token");
          return;
        }
        const room = new Room({
          adaptiveStream: true,
          dynacast: true
        });
        roomRef.current = room;
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        const updateTracks = () => {
          if (!disposed) setVideoTracks(collectScreenShareTracks(room));
        };
        const refresh = () => window.setTimeout(updateTracks, 0);
        SCREEN_WINDOW_EVENTS.forEach((eventName) => room.on?.(eventName, refresh));
        cleanupRoomEvents = () => {
          SCREEN_WINDOW_EVENTS.forEach((eventName) => room.off?.(eventName, refresh));
        };
        await room.connect(serverUrl, token);
        console.log("[ScreenShareWindow] Connected to room:", room.name);
        updateTracks();
      } catch (err) {
        console.error("[ScreenShareWindow] Failed to connect:", err);
      }
    };
    void initRoom();
    return () => {
      disposed = true;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      detachRef.current();
      detachRef.current = () => void 0;
      cleanupRoomEvents?.();
      cleanupRoomEvents = null;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, []);
  reactExports.useEffect(() => {
    detachRef.current();
    detachRef.current = () => void 0;
    const videoEl = videoRef.current;
    const firstTrack = videoTracks[0];
    if (!videoEl || !firstTrack?.track) {
      if (videoEl) videoEl.srcObject = null;
      return;
    }
    detachRef.current = attachLiveKitTrack(firstTrack.track, videoEl, { muted: false });
    return () => {
      detachRef.current();
      detachRef.current = () => void 0;
    };
  }, [videoTracks]);
  const handleMinimize = reactExports.useCallback(() => {
    window.shineAI?.screenshare?.minimizeWindow();
  }, []);
  const handleMaximize = reactExports.useCallback(async () => {
    await window.shineAI?.screenshare?.maximizeWindow();
    setIsMaximized((prev) => !prev);
  }, []);
  const handleClose = reactExports.useCallback(() => {
    window.shineAI?.screenshare?.closeWindow();
  }, []);
  const handleFullscreen = reactExports.useCallback(async () => {
    await window.shineAI?.screenshare?.toggleFullscreen();
    setIsFullscreen((prev) => !prev);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-screen w-screen bg-[#0D1117] text-white overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center h-10 bg-[#161B22] border-b border-white/10 select-none shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: DRAG_REGION, style: { WebkitAppRegion: "drag" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-3 text-sm text-text-secondary", children: t("title") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center mr-1", style: { WebkitAppRegion: "no-drag" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleFullscreen,
            className: TITLE_BAR_BTN,
            title: isFullscreen ? t("titleBar.exitFullscreen") : t("titleBar.fullscreen"),
            children: isFullscreen ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleMinimize,
            className: TITLE_BAR_BTN,
            title: t("titleBar.minimize"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M20 12H4" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleMaximize,
            className: TITLE_BAR_BTN,
            title: isMaximized ? t("titleBar.restore") : t("titleBar.maximize"),
            children: isMaximized ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 4H6a2 2 0 00-2 2v2m0 4v2a2 2 0 002 2h2m4 0h2a2 2 0 002-2v-2m0-4V6a2 2 0 00-2-2h-2" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleClose,
            className: `${TITLE_BAR_BTN} hover:bg-accent-red/80`,
            title: t("common:actions.close"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 relative bg-black overflow-hidden", children: videoTracks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "video",
        {
          ref: videoRef,
          autoPlay: true,
          playsInline: true,
          className: "absolute inset-0 w-full h-full object-contain"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-white", children: t("sharingNow", { name: videoTracks[0].participantName }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 bg-accent-green/20 text-accent-green text-xs rounded", children: t("title") })
      ] }),
      videoTracks.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-primary", children: t("screenCount", { count: videoTracks.length }) }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-8 h-8 text-text-muted", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-lg mb-2", children: t("waiting") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-muted text-sm", children: t("waitingHint") })
    ] }) })
  ] });
});
ScreenShareWindow.displayName = "ScreenShareWindow";
export {
  ScreenShareWindow as default
};
