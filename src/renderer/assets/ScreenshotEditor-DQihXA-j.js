import { r as reactExports, j as jsxRuntimeExports, u as useTranslation } from "./index-0LVJEr5c.js";
const PRESET_COLORS = [
  "#FF0000",
  // 红
  "#FF6600",
  // 橙
  "#FFCC00",
  // 黄
  "#00CC00",
  // 绿
  "#0099FF",
  // 蓝
  "#FFFFFF",
  // 白
  "#000000"
  // 黑
];
const LINE_WIDTHS = [2, 4, 6];
const DEFAULT_ANNOTATION_CONFIG = {
  color: "#FF0000",
  lineWidth: 2,
  fontSize: 16,
  mosaicBlockSize: 10
};
class HistoryStack {
  constructor() {
    this.stack = [];
    this.pointer = -1;
  }
  /** 压入新状态（清除 pointer 后的所有记录） */
  push(state) {
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push(state);
    this.pointer = this.stack.length - 1;
  }
  /** 撤销：回到上一步 */
  undo() {
    if (!this.canUndo()) return null;
    this.pointer--;
    return this.stack[this.pointer] ?? null;
  }
  /** 重做：前进一步 */
  redo() {
    if (!this.canRedo()) return null;
    this.pointer++;
    return this.stack[this.pointer];
  }
  /** 获取当前状态 */
  current() {
    if (this.pointer < 0 || this.pointer >= this.stack.length) return null;
    return this.stack[this.pointer];
  }
  canUndo() {
    return this.pointer > 0;
  }
  canRedo() {
    return this.pointer < this.stack.length - 1;
  }
  /** 清空历史 */
  clear() {
    this.stack = [];
    this.pointer = -1;
  }
}
function renderAnnotation(ctx, annotation) {
  switch (annotation.type) {
    case "freedraw":
      renderFreeDraw(ctx, annotation);
      break;
    case "arrow":
      renderArrow(ctx, annotation);
      break;
    case "rect":
      renderRect(ctx, annotation);
      break;
    case "ellipse":
      renderEllipse(ctx, annotation);
      break;
    case "text":
      renderText(ctx, annotation);
      break;
    case "mosaic":
      renderMosaic(ctx, annotation);
      break;
  }
}
function renderAllAnnotations(ctx, annotations) {
  for (const ann of annotations) {
    renderAnnotation(ctx, ann);
  }
}
function renderFreeDraw(ctx, ann) {
  if (ann.points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = ann.color;
  ctx.lineWidth = ann.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(ann.points[0].x, ann.points[0].y);
  if (ann.points.length === 2) {
    ctx.lineTo(ann.points[1].x, ann.points[1].y);
  } else {
    for (let i = 1; i < ann.points.length - 1; i++) {
      const midX = (ann.points[i].x + ann.points[i + 1].x) / 2;
      const midY = (ann.points[i].y + ann.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(ann.points[i].x, ann.points[i].y, midX, midY);
    }
    const last = ann.points[ann.points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
  ctx.restore();
}
function renderArrow(ctx, ann) {
  const { startX, startY, endX, endY } = ann;
  const headLength = Math.max(12, ann.lineWidth * 4);
  const angle = Math.atan2(endY - startY, endX - startX);
  ctx.save();
  ctx.strokeStyle = ann.color;
  ctx.fillStyle = ann.color;
  ctx.lineWidth = ann.lineWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function renderRect(ctx, ann) {
  ctx.save();
  ctx.strokeStyle = ann.color;
  ctx.lineWidth = ann.lineWidth;
  ctx.lineJoin = "round";
  ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
  ctx.restore();
}
function renderEllipse(ctx, ann) {
  ctx.save();
  ctx.strokeStyle = ann.color;
  ctx.lineWidth = ann.lineWidth;
  ctx.beginPath();
  ctx.ellipse(ann.cx, ann.cy, Math.abs(ann.rx), Math.abs(ann.ry), 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
function renderText(ctx, ann) {
  if (!ann.text) return;
  ctx.save();
  ctx.fillStyle = ann.color;
  ctx.font = `${ann.fontSize}px sans-serif`;
  ctx.textBaseline = "top";
  const lines = ann.text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], ann.x, ann.y + i * (ann.fontSize * 1.3));
  }
  ctx.restore();
}
function renderMosaic(ctx, ann) {
  if (ann.points.length === 0) return;
  const blockSize = ann.blockSize || 10;
  const brushRadius = ann.lineWidth * 3;
  ctx.save();
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const { data, width } = imageData;
  const processedBlocks = /* @__PURE__ */ new Set();
  for (const point of ann.points) {
    const minBx = Math.floor((point.x - brushRadius) / blockSize);
    const maxBx = Math.floor((point.x + brushRadius) / blockSize);
    const minBy = Math.floor((point.y - brushRadius) / blockSize);
    const maxBy = Math.floor((point.y + brushRadius) / blockSize);
    for (let bx = minBx; bx <= maxBx; bx++) {
      for (let by = minBy; by <= maxBy; by++) {
        const key = `${bx},${by}`;
        if (processedBlocks.has(key)) continue;
        processedBlocks.add(key);
        const px = bx * blockSize;
        const py = by * blockSize;
        const cx = Math.min(px + Math.floor(blockSize / 2), ctx.canvas.width - 1);
        const cy = Math.min(py + Math.floor(blockSize / 2), ctx.canvas.height - 1);
        const idx = (cy * width + cx) * 4;
        if (idx >= 0 && idx < data.length - 3) {
          ctx.fillStyle = `rgb(${data[idx]}, ${data[idx + 1]}, ${data[idx + 2]})`;
          ctx.fillRect(px, py, blockSize, blockSize);
        }
      }
    }
  }
  ctx.restore();
}
const HANDLE_SIZE = 8;
const SelectionOverlay = ({
  backgroundImage,
  onSelectionComplete,
  onCancel
}) => {
  const canvasRef = reactExports.useRef(null);
  const [selection, setSelection] = reactExports.useState(null);
  const dragRef = reactExports.useRef({
    creating: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    resizing: false,
    resizeHandle: null,
    moving: false,
    moveOffsetX: 0,
    moveOffsetY: 0
  });
  const draw = reactExports.useCallback(
    (sel) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      ctx.drawImage(backgroundImage, 0, 0, w, h);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, w, h);
      if (sel && sel.width !== 0 && sel.height !== 0) {
        const { x, y, width, height } = normalizeRect(sel);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        ctx.drawImage(backgroundImage, 0, 0, w, h);
        ctx.restore();
        ctx.strokeStyle = "#0099FF";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        const sizeText = `${Math.round(width)} × ${Math.round(height)}`;
        ctx.font = "12px sans-serif";
        const textMetrics = ctx.measureText(sizeText);
        const textY = y > 24 ? y - 8 : y + height + 18;
        ctx.fillRect(x, textY - 14, textMetrics.width + 8, 18);
        ctx.fillStyle = "#fff";
        ctx.fillText(sizeText, x + 4, textY);
        drawHandles(ctx, x, y, width, height);
      }
    },
    [backgroundImage]
  );
  function drawHandles(ctx, x, y, w, h) {
    const half = HANDLE_SIZE / 2;
    const positions = [
      { px: x, py: y },
      // tl
      { px: x + w, py: y },
      // tr
      { px: x, py: y + h },
      // bl
      { px: x + w, py: y + h },
      // br
      { px: x + w / 2, py: y },
      // tm
      { px: x + w / 2, py: y + h },
      // bm
      { px: x, py: y + h / 2 },
      // lm
      { px: x + w, py: y + h / 2 }
      // rm
    ];
    ctx.fillStyle = "#0099FF";
    for (const { px, py } of positions) {
      ctx.fillRect(px - half, py - half, HANDLE_SIZE, HANDLE_SIZE);
    }
  }
  function getHandleAtPoint(mx, my, sel) {
    const { x, y, width, height } = normalizeRect(sel);
    const margin = HANDLE_SIZE + 2;
    const handles = [
      { pos: "tl", px: x, py: y },
      { pos: "tr", px: x + width, py: y },
      { pos: "bl", px: x, py: y + height },
      { pos: "br", px: x + width, py: y + height },
      { pos: "tm", px: x + width / 2, py: y },
      { pos: "bm", px: x + width / 2, py: y + height },
      { pos: "lm", px: x, py: y + height / 2 },
      { pos: "rm", px: x + width, py: y + height / 2 }
    ];
    for (const h of handles) {
      if (Math.abs(mx - h.px) <= margin && Math.abs(my - h.py) <= margin) {
        return h.pos;
      }
    }
    return null;
  }
  function isPointInSelection(mx, my, sel) {
    const { x, y, width, height } = normalizeRect(sel);
    return mx >= x && mx <= x + width && my >= y && my <= y + height;
  }
  const handleMouseDown = reactExports.useCallback(
    (e) => {
      if (e.button !== 0) return;
      const mx = e.clientX;
      const my = e.clientY;
      if (selection) {
        const handle = getHandleAtPoint(mx, my, selection);
        if (handle) {
          dragRef.current = {
            ...dragRef.current,
            resizing: true,
            resizeHandle: handle,
            startX: mx,
            startY: my,
            creating: false,
            moving: false
          };
          return;
        }
        if (isPointInSelection(mx, my, selection)) {
          const norm = normalizeRect(selection);
          dragRef.current = {
            ...dragRef.current,
            moving: true,
            moveOffsetX: mx - norm.x,
            moveOffsetY: my - norm.y,
            creating: false,
            resizing: false
          };
          return;
        }
      }
      dragRef.current = {
        creating: true,
        startX: mx,
        startY: my,
        currentX: mx,
        currentY: my,
        resizing: false,
        resizeHandle: null,
        moving: false,
        moveOffsetX: 0,
        moveOffsetY: 0
      };
      setSelection(null);
    },
    [selection]
  );
  const handleMouseMove = reactExports.useCallback(
    (e) => {
      const mx = e.clientX;
      const my = e.clientY;
      const drag = dragRef.current;
      if (drag.creating) {
        const rect = {
          x: drag.startX,
          y: drag.startY,
          width: mx - drag.startX,
          height: my - drag.startY
        };
        setSelection(rect);
        draw(rect);
      } else if (drag.resizing && selection && drag.resizeHandle) {
        const newSel = resizeSelection(selection, drag.resizeHandle, mx, my, drag.startX, drag.startY);
        setSelection(newSel);
        draw(newSel);
        drag.startX = mx;
        drag.startY = my;
      } else if (drag.moving && selection) {
        const norm = normalizeRect(selection);
        const newSel = {
          x: mx - drag.moveOffsetX,
          y: my - drag.moveOffsetY,
          width: norm.width,
          height: norm.height
        };
        setSelection(newSel);
        draw(newSel);
      } else {
        updateCursor(e, selection);
      }
    },
    [selection, draw]
  );
  const handleMouseUp = reactExports.useCallback(() => {
    const drag = dragRef.current;
    if (drag.creating && selection) {
      const norm = normalizeRect(selection);
      if (norm.width > 5 && norm.height > 5) {
        onSelectionComplete(norm);
        return;
      }
    } else if (drag.resizing && selection) {
      setSelection(normalizeRect(selection));
    } else if (drag.moving && selection) {
      setSelection(normalizeRect(selection));
    }
    dragRef.current = {
      ...dragRef.current,
      creating: false,
      resizing: false,
      resizeHandle: null,
      moving: false
    };
  }, [selection, draw, onSelectionComplete]);
  const handleKeyDown = reactExports.useCallback(
    (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [onCancel]
  );
  reactExports.useEffect(() => {
    draw(null);
    const handleResize = () => draw(selection);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw, selection]);
  function updateCursor(e, sel) {
    const canvas = canvasRef.current;
    if (!canvas || !sel) {
      if (canvas) canvas.style.cursor = "crosshair";
      return;
    }
    const handle = getHandleAtPoint(e.clientX, e.clientY, sel);
    if (handle) {
      const cursorMap = {
        tl: "nw-resize",
        tr: "ne-resize",
        bl: "sw-resize",
        br: "se-resize",
        tm: "n-resize",
        bm: "s-resize",
        lm: "w-resize",
        rm: "e-resize"
      };
      canvas.style.cursor = cursorMap[handle];
    } else if (isPointInSelection(e.clientX, e.clientY, sel)) {
      canvas.style.cursor = "move";
    } else {
      canvas.style.cursor = "crosshair";
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      className: "fixed inset-0 z-10",
      style: { cursor: "crosshair" },
      tabIndex: 0,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onKeyDown: handleKeyDown,
      autoFocus: true
    }
  );
};
function normalizeRect(rect) {
  return {
    x: rect.width < 0 ? rect.x + rect.width : rect.x,
    y: rect.height < 0 ? rect.y + rect.height : rect.y,
    width: Math.abs(rect.width),
    height: Math.abs(rect.height)
  };
}
function resizeSelection(sel, handle, mx, my, prevX, prevY) {
  const dx = mx - prevX;
  const dy = my - prevY;
  const norm = normalizeRect(sel);
  let { x, y, width, height } = norm;
  switch (handle) {
    case "tl":
      x += dx;
      y += dy;
      width -= dx;
      height -= dy;
      break;
    case "tr":
      y += dy;
      width += dx;
      height -= dy;
      break;
    case "bl":
      x += dx;
      width -= dx;
      height += dy;
      break;
    case "br":
      width += dx;
      height += dy;
      break;
    case "tm":
      y += dy;
      height -= dy;
      break;
    case "bm":
      height += dy;
      break;
    case "lm":
      x += dx;
      width -= dx;
      break;
    case "rm":
      width += dx;
      break;
  }
  return { x, y, width, height };
}
SelectionOverlay.displayName = "SelectionOverlay";
let idCounter = 0;
function genId() {
  return `ann_${Date.now()}_${++idCounter}`;
}
const AnnotationCanvas = ({
  selection,
  annotations,
  activeTool,
  activeColor,
  activeLineWidth,
  backgroundImage,
  onAnnotationsChange
}) => {
  const canvasRef = reactExports.useRef(null);
  const [drawing, setDrawing] = reactExports.useState(false);
  const currentAnnotationRef = reactExports.useRef(null);
  const [textInput, setTextInput] = reactExports.useState({
    x: 0,
    y: 0,
    visible: false
  });
  const [textValue, setTextValue] = reactExports.useState("");
  const textInputRef = reactExports.useRef(null);
  const redraw = reactExports.useCallback((extraAnnotation) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = selection.width * dpr;
    canvas.height = selection.height * dpr;
    canvas.style.width = `${selection.width}px`;
    canvas.style.height = `${selection.height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, selection.width, selection.height);
    ctx.save();
    ctx.translate(-selection.x, -selection.y);
    renderAllAnnotations(ctx, annotations);
    if (extraAnnotation) {
      renderAnnotation(ctx, extraAnnotation);
    }
    ctx.restore();
  }, [selection, annotations]);
  reactExports.useEffect(() => {
    redraw();
  }, [redraw]);
  const getCanvasPoint = reactExports.useCallback((e) => {
    return { x: e.clientX, y: e.clientY };
  }, []);
  const handleMouseDown = reactExports.useCallback((e) => {
    if (e.button !== 0) return;
    if (activeTool === "select") return;
    const { x, y } = getCanvasPoint(e);
    if (activeTool === "text") {
      setTextInput({ x, y, visible: true });
      setTextValue("");
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }
    setDrawing(true);
    let ann;
    switch (activeTool) {
      case "freedraw":
        ann = {
          id: genId(),
          type: "freedraw",
          color: activeColor,
          lineWidth: activeLineWidth,
          points: [{ x, y }]
        };
        break;
      case "arrow":
        ann = {
          id: genId(),
          type: "arrow",
          color: activeColor,
          lineWidth: activeLineWidth,
          startX: x,
          startY: y,
          endX: x,
          endY: y
        };
        break;
      case "rect":
        ann = {
          id: genId(),
          type: "rect",
          color: activeColor,
          lineWidth: activeLineWidth,
          x,
          y,
          width: 0,
          height: 0
        };
        break;
      case "ellipse":
        ann = {
          id: genId(),
          type: "ellipse",
          color: activeColor,
          lineWidth: activeLineWidth,
          cx: x,
          cy: y,
          rx: 0,
          ry: 0
        };
        break;
      case "mosaic":
        ann = {
          id: genId(),
          type: "mosaic",
          color: "",
          lineWidth: activeLineWidth,
          points: [{ x, y }],
          blockSize: DEFAULT_ANNOTATION_CONFIG.mosaicBlockSize
        };
        break;
      default:
        return;
    }
    currentAnnotationRef.current = ann;
  }, [activeTool, activeColor, activeLineWidth, getCanvasPoint]);
  const handleMouseMove = reactExports.useCallback((e) => {
    if (!drawing || !currentAnnotationRef.current) return;
    const { x, y } = getCanvasPoint(e);
    const ann = currentAnnotationRef.current;
    switch (ann.type) {
      case "freedraw":
        ann.points.push({ x, y });
        break;
      case "arrow":
        ann.endX = x;
        ann.endY = y;
        break;
      case "rect": {
        const r = ann;
        r.width = x - r.x;
        r.height = y - r.y;
        break;
      }
      case "ellipse": {
        const el = ann;
        el.rx = Math.abs(x - el.cx);
        el.ry = Math.abs(y - el.cy);
        break;
      }
      case "mosaic":
        ann.points.push({ x, y });
        break;
    }
    redraw(ann);
  }, [drawing, getCanvasPoint, redraw]);
  const handleMouseUp = reactExports.useCallback(() => {
    if (!drawing || !currentAnnotationRef.current) return;
    const ann = currentAnnotationRef.current;
    let valid = true;
    switch (ann.type) {
      case "freedraw":
        valid = ann.points.length > 1;
        break;
      case "arrow": {
        const a = ann;
        valid = Math.abs(a.endX - a.startX) > 3 || Math.abs(a.endY - a.startY) > 3;
        break;
      }
      case "rect": {
        const r = ann;
        valid = Math.abs(r.width) > 3 && Math.abs(r.height) > 3;
        break;
      }
      case "ellipse": {
        const el = ann;
        valid = el.rx > 3 && el.ry > 3;
        break;
      }
      case "mosaic":
        valid = ann.points.length > 1;
        break;
    }
    if (valid) {
      onAnnotationsChange([...annotations, ann]);
    }
    currentAnnotationRef.current = null;
    setDrawing(false);
    redraw();
  }, [drawing, annotations, onAnnotationsChange, redraw]);
  const confirmText = reactExports.useCallback(() => {
    if (textValue.trim()) {
      const ann = {
        id: genId(),
        type: "text",
        color: activeColor,
        lineWidth: 1,
        x: textInput.x,
        y: textInput.y,
        text: textValue.trim(),
        fontSize: DEFAULT_ANNOTATION_CONFIG.fontSize
      };
      onAnnotationsChange([...annotations, ann]);
    }
    setTextInput({ x: 0, y: 0, visible: false });
    setTextValue("");
  }, [textValue, textInput, activeColor, annotations, onAnnotationsChange]);
  const handleTextKeyDown = reactExports.useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      confirmText();
    } else if (e.key === "Escape") {
      setTextInput({ x: 0, y: 0, visible: false });
      setTextValue("");
    }
  }, [confirmText]);
  const cursorMap = {
    select: "default",
    freedraw: "crosshair",
    arrow: "crosshair",
    rect: "crosshair",
    ellipse: "crosshair",
    text: "text",
    mosaic: "crosshair"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "canvas",
      {
        ref: canvasRef,
        className: "fixed z-10",
        style: {
          left: selection.x,
          top: selection.y,
          width: selection.width,
          height: selection.height,
          cursor: cursorMap[activeTool] || "crosshair"
        },
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp
      }
    ),
    textInput.visible && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        ref: textInputRef,
        value: textValue,
        onChange: (e) => setTextValue(e.target.value),
        onKeyDown: handleTextKeyDown,
        onBlur: confirmText,
        className: "fixed z-20 bg-transparent border border-dashed border-accent-blue text-white outline-none resize-none p-1",
        style: {
          left: textInput.x,
          top: textInput.y,
          minWidth: 100,
          minHeight: 24,
          fontSize: DEFAULT_ANNOTATION_CONFIG.fontSize,
          color: activeColor,
          caretColor: activeColor,
          userSelect: "text",
          WebkitUserSelect: "text"
        },
        autoFocus: true
      }
    )
  ] });
};
AnnotationCanvas.displayName = "AnnotationCanvas";
const TOOLS = [
  { id: "rect", labelKey: "tools.rect", icon: "▭" },
  { id: "ellipse", labelKey: "tools.ellipse", icon: "○" },
  { id: "arrow", labelKey: "tools.arrow", icon: "→" },
  { id: "freedraw", labelKey: "tools.freedraw", icon: "✎" },
  { id: "text", labelKey: "tools.text", icon: "A" },
  { id: "mosaic", labelKey: "tools.mosaic", icon: "▦" }
];
const AnnotationToolbar = ({
  selection,
  activeTool,
  activeColor,
  activeLineWidth,
  onToolChange,
  onColorChange,
  onLineWidthChange
}) => {
  const { t } = useTranslation("screenshare");
  const position = reactExports.useMemo(() => {
    const toolbarHeight = 40;
    const gap = 8;
    const bottomSpace = window.innerHeight - (selection.y + selection.height);
    const topSpace = selection.y;
    let top;
    if (bottomSpace >= toolbarHeight + gap + 40) {
      top = selection.y + selection.height + gap;
    } else if (topSpace >= toolbarHeight + gap) {
      top = selection.y - toolbarHeight - gap;
    } else {
      top = selection.y + selection.height - toolbarHeight - gap;
    }
    const left = Math.max(8, Math.min(selection.x, window.innerWidth - 500));
    return { top, left };
  }, [selection]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "fixed z-30 flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg",
      style: {
        top: position.top,
        left: position.left,
        backgroundColor: "rgba(30, 30, 30, 0.95)",
        backdropFilter: "blur(8px)"
      },
      children: [
        TOOLS.map((tool) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            title: t(tool.labelKey),
            onClick: () => onToolChange(tool.id),
            className: [
              "w-8 h-8 flex items-center justify-center rounded text-sm transition-colors",
              activeTool === tool.id ? "bg-accent-blue text-white" : "text-text-primary hover:bg-bg-hover hover:text-white"
            ].join(" "),
            children: tool.icon
          },
          tool.id
        )),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-text-muted mx-1" }),
        PRESET_COLORS.map((color) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            title: color,
            onClick: () => onColorChange(color),
            className: [
              "w-5 h-5 rounded-full border-2 transition-transform",
              activeColor === color ? "border-white scale-110" : "border-transparent hover:scale-105"
            ].join(" "),
            style: { backgroundColor: color }
          },
          color
        )),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-6 bg-text-muted mx-1" }),
        LINE_WIDTHS.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            title: t("tools.lineWidth", { width: w }),
            onClick: () => onLineWidthChange(w),
            className: [
              "w-8 h-8 flex items-center justify-center rounded transition-colors",
              activeLineWidth === w ? "bg-accent-blue" : "hover:bg-bg-hover"
            ].join(" "),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "rounded-full bg-white",
                style: { width: w + 2, height: w + 2 }
              }
            )
          },
          w
        ))
      ]
    }
  );
};
AnnotationToolbar.displayName = "AnnotationToolbar";
const ActionBar = ({
  selection,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCopy,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation("screenshare");
  const position = reactExports.useMemo(() => {
    const toolbarHeight = 40;
    const actionBarHeight = 36;
    const gap = 8;
    const totalOffset = toolbarHeight + actionBarHeight + gap * 2;
    const bottomSpace = window.innerHeight - (selection.y + selection.height);
    let top;
    if (bottomSpace >= totalOffset + 40) {
      top = selection.y + selection.height + gap + toolbarHeight + gap;
    } else if (selection.y >= totalOffset) {
      top = selection.y - actionBarHeight - gap;
    } else {
      top = selection.y + selection.height - actionBarHeight - gap;
    }
    const barWidth = 300;
    const left = Math.max(8, Math.min(
      selection.x + selection.width - barWidth,
      window.innerWidth - barWidth - 8
    ));
    return { top, left };
  }, [selection]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "fixed z-30 flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg",
      style: {
        top: position.top,
        left: position.left,
        backgroundColor: "rgba(30, 30, 30, 0.95)",
        backdropFilter: "blur(8px)"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            title: t("actions.undoTooltip"),
            onClick: onUndo,
            disabled: !canUndo,
            className: [
              "px-2 py-1 rounded text-xs transition-colors",
              canUndo ? "text-text-primary hover:bg-bg-hover hover:text-white" : "text-text-muted cursor-not-allowed"
            ].join(" "),
            children: t("actions.undo")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            title: t("actions.redoTooltip"),
            onClick: onRedo,
            disabled: !canRedo,
            className: [
              "px-2 py-1 rounded text-xs transition-colors",
              canRedo ? "text-text-primary hover:bg-bg-hover hover:text-white" : "text-text-muted cursor-not-allowed"
            ].join(" "),
            children: t("actions.redo")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-5 bg-text-muted mx-1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            title: t("actions.cancelTooltip"),
            onClick: onCancel,
            className: "px-3 py-1 rounded text-xs text-text-primary hover:bg-bg-hover hover:text-white transition-colors",
            children: t("actions.cancel")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            title: t("actions.saveTooltip"),
            onClick: onSave,
            className: "px-3 py-1 rounded text-xs text-text-primary hover:bg-bg-hover hover:text-white transition-colors",
            children: t("actions.save")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            title: t("actions.copyTooltip"),
            onClick: onCopy,
            className: "px-3 py-1 rounded text-xs bg-accent-blue text-white hover:bg-accent-blue/85 transition-colors",
            children: t("actions.copyAndFinish")
          }
        )
      ]
    }
  );
};
ActionBar.displayName = "ActionBar";
const ScreenshotEditor = () => {
  const { t } = useTranslation("screenshare");
  const [phase, setPhase] = reactExports.useState("loading");
  const [backgroundImage, setBackgroundImage] = reactExports.useState(null);
  const [selection, setSelection] = reactExports.useState(null);
  const [annotations, setAnnotations] = reactExports.useState([]);
  const [activeTool, setActiveTool] = reactExports.useState("rect");
  const [activeColor, setActiveColor] = reactExports.useState(DEFAULT_ANNOTATION_CONFIG.color);
  const [activeLineWidth, setActiveLineWidth] = reactExports.useState(DEFAULT_ANNOTATION_CONFIG.lineWidth);
  const historyRef = reactExports.useRef(new HistoryStack());
  reactExports.useEffect(() => {
    const handleImageData = (_event, dataUrl) => {
      const img = new Image();
      img.onload = () => {
        setBackgroundImage(img);
        setPhase("selecting");
      };
      img.src = dataUrl;
    };
    const cleanup = window.shineAI.screenshotEditor.onImageData(handleImageData);
    window.shineAI.screenshotEditor.ready();
    return cleanup;
  }, []);
  const handleSelectionComplete = reactExports.useCallback((rect) => {
    setSelection(rect);
    setPhase("editing");
    historyRef.current.clear();
    historyRef.current.push([]);
  }, []);
  const handleAnnotationsChange = reactExports.useCallback((newAnnotations) => {
    setAnnotations(newAnnotations);
    historyRef.current.push([...newAnnotations]);
  }, []);
  const handleUndo = reactExports.useCallback(() => {
    const prev = historyRef.current.undo();
    if (prev !== null) setAnnotations(prev);
  }, []);
  const handleRedo = reactExports.useCallback(() => {
    const next = historyRef.current.redo();
    if (next !== null) setAnnotations(next);
  }, []);
  const generateFinalImage = reactExports.useCallback(() => {
    if (!backgroundImage || !selection) return null;
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width = selection.width * dpr;
    canvas.height = selection.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.scale(dpr, dpr);
    const sx = selection.x * (backgroundImage.naturalWidth / window.innerWidth);
    const sy = selection.y * (backgroundImage.naturalHeight / window.innerHeight);
    const sw = selection.width * (backgroundImage.naturalWidth / window.innerWidth);
    const sh = selection.height * (backgroundImage.naturalHeight / window.innerHeight);
    ctx.drawImage(backgroundImage, sx, sy, sw, sh, 0, 0, selection.width, selection.height);
    ctx.save();
    ctx.translate(-selection.x, -selection.y);
    renderAllAnnotations(ctx, annotations);
    ctx.restore();
    return canvas.toDataURL("image/png");
  }, [backgroundImage, selection, annotations]);
  const handleCopy = reactExports.useCallback(async () => {
    const dataUrl = generateFinalImage();
    if (!dataUrl) return;
    try {
      await window.shineAI.screenshotEditor.complete(dataUrl);
      setPhase("done");
    } catch (err) {
      console.error("[ScreenshotEditor] copy failed:", err);
    }
  }, [generateFinalImage]);
  const handleSave = reactExports.useCallback(async () => {
    const dataUrl = generateFinalImage();
    if (!dataUrl) return;
    try {
      await window.shineAI.screenshotEditor.save(dataUrl);
      setPhase("done");
    } catch (err) {
      console.error("[ScreenshotEditor] save failed:", err);
    }
  }, [generateFinalImage]);
  const handleCancel = reactExports.useCallback(() => {
    window.shineAI.screenshotEditor.cancel();
  }, []);
  reactExports.useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "textarea" || tag === "input") return;
      if (e.key === "Escape") {
        handleCancel();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCancel, handleUndo, handleRedo]);
  if (phase === "loading") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-white text-sm", children: t("editor.loading") }) });
  }
  if (phase === "done") {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0", style: { userSelect: "none" }, children: [
    phase === "selecting" && backgroundImage && /* @__PURE__ */ jsxRuntimeExports.jsx(
      SelectionOverlay,
      {
        backgroundImage,
        onSelectionComplete: handleSelectionComplete,
        onCancel: handleCancel
      }
    ),
    phase === "editing" && backgroundImage && selection && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BackgroundLayer, { backgroundImage, selection }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AnnotationCanvas,
        {
          selection,
          annotations,
          activeTool,
          activeColor,
          activeLineWidth,
          backgroundImage,
          onAnnotationsChange: handleAnnotationsChange
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AnnotationToolbar,
        {
          selection,
          activeTool,
          activeColor,
          activeLineWidth,
          onToolChange: setActiveTool,
          onColorChange: setActiveColor,
          onLineWidthChange: setActiveLineWidth
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ActionBar,
        {
          selection,
          canUndo: historyRef.current.canUndo(),
          canRedo: historyRef.current.canRedo(),
          onUndo: handleUndo,
          onRedo: handleRedo,
          onCopy: handleCopy,
          onSave: handleSave,
          onCancel: handleCancel
        }
      )
    ] })
  ] });
};
const BackgroundLayer = ({ backgroundImage, selection }) => {
  const canvasRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctx.drawImage(backgroundImage, 0, 0, w, h);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(selection.x, selection.y, selection.width, selection.height);
    ctx.clip();
    ctx.drawImage(backgroundImage, 0, 0, w, h);
    ctx.restore();
    ctx.strokeStyle = "#0099FF";
    ctx.lineWidth = 1;
    ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
  }, [backgroundImage, selection]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("canvas", { ref: canvasRef, className: "fixed inset-0 z-0" });
};
BackgroundLayer.displayName = "BackgroundLayer";
ScreenshotEditor.displayName = "ScreenshotEditor";
export {
  ScreenshotEditor as default
};
