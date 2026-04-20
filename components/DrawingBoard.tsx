"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";

export type DrawCommand =
  | { type: "start"; x: number; y: number; color: string; lineWidth: number }
  | { type: "move"; x: number; y: number }
  | { type: "end" }
  | { type: "clear" };

interface DrawingBoardProps {
  onCommand: (cmd: DrawCommand) => void;
  disabled?: boolean;
}

export interface DrawingBoardHandle {
  executeCommand: (cmd: DrawCommand) => void;
}

const COLORS = ["#111827", "#F59E0B", "#6FC0B4", "#ef4444", "#93C36E", "#E5B65A", "#f97316", "#ec4899"];
const WIDTHS = [2, 5, 12];
const ERASER_WIDTH = 28;
const CANVAS_W = 1200;
const CANVAS_H = 700;

const DrawingBoard = forwardRef<DrawingBoardHandle, DrawingBoardProps>(
  ({ onCommand, disabled }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState("#111827");
    const [lineWidth, setLineWidth] = useState(3);
    const [erasing, setErasing] = useState(false);
    const isDrawing = useRef(false);
    const remoteDrawing = useRef(false);

    // Initialize canvas with white background
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }, []);

    // Remote draw command execution
    useImperativeHandle(ref, () => ({
      executeCommand(cmd: DrawCommand) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (cmd.type === "start") {
          remoteDrawing.current = true;
          ctx.beginPath();
          ctx.strokeStyle = cmd.color;
          ctx.lineWidth = cmd.lineWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.moveTo(cmd.x, cmd.y);
        } else if (cmd.type === "move" && remoteDrawing.current) {
          ctx.lineTo(cmd.x, cmd.y);
          ctx.stroke();
        } else if (cmd.type === "end") {
          remoteDrawing.current = false;
        } else if (cmd.type === "clear") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        }
      },
    }));

    function getPos(clientX: number, clientY: number) {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (CANVAS_W / rect.width),
        y: (clientY - rect.top) * (CANVAS_H / rect.height),
      };
    }

    function beginStroke(clientX: number, clientY: number) {
      if (disabled) return;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const { x, y } = getPos(clientX, clientY);
      const activeColor = erasing ? "#ffffff" : color;
      const activeWidth = erasing ? ERASER_WIDTH : lineWidth;

      isDrawing.current = true;
      ctx.beginPath();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = activeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(x, y);
      onCommand({ type: "start", x, y, color: activeColor, lineWidth: activeWidth });
    }

    function continueStroke(clientX: number, clientY: number) {
      if (!isDrawing.current || disabled) return;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const { x, y } = getPos(clientX, clientY);
      ctx.lineTo(x, y);
      ctx.stroke();
      onCommand({ type: "move", x, y });
    }

    function endStroke() {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      onCommand({ type: "end" });
    }

    function handleClear() {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      onCommand({ type: "clear" });
    }

    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0 flex-wrap"
          style={{ borderBottom: "1px solid rgba(245,158,11,0.12)" }}>

          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button key={c} onClick={() => { setColor(c); setErasing(false); }}
                className="w-5 h-5 rounded-full transition-all"
                style={{
                  background: c,
                  outline: color === c && !erasing ? `2px solid ${c}` : "none",
                  outlineOffset: "2px",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                }} />
            ))}
          </div>

          <div className="w-px h-4 flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }} />

          {/* Stroke widths */}
          <div className="flex items-center gap-1">
            {WIDTHS.map((w) => (
              <button key={w} onClick={() => { setLineWidth(w); setErasing(false); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={lineWidth === w && !erasing ? {
                  background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)",
                } : { border: "1px solid transparent" }}>
                <div className="rounded-full" style={{ width: Math.min(w + 2, 12), height: Math.min(w + 2, 12), background: "var(--text-muted)" }} />
              </button>
            ))}
          </div>

          <div className="w-px h-4 flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }} />

          {/* Eraser */}
          <button onClick={() => setErasing((p) => !p)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
            style={erasing ? {
              background: "rgba(229,182,90,0.15)", color: "#E5B65A", border: "1px solid rgba(229,182,90,0.3)",
            } : { color: "var(--text-faint)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Eraser
          </button>

          {/* Clear */}
          <button onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ml-auto"
            style={{ color: "#fca5a5", border: "1px solid rgba(220,38,38,0.2)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.08)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden bg-white"
          style={{ cursor: disabled ? "default" : erasing ? "cell" : "crosshair" }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full h-full"
            style={{ display: "block", touchAction: "none" }}
            onMouseDown={(e) => beginStroke(e.clientX, e.clientY)}
            onMouseMove={(e) => continueStroke(e.clientX, e.clientY)}
            onMouseUp={endStroke}
            onMouseLeave={endStroke}
            onTouchStart={(e) => { e.preventDefault(); beginStroke(e.touches[0].clientX, e.touches[0].clientY); }}
            onTouchMove={(e) => { e.preventDefault(); continueStroke(e.touches[0].clientX, e.touches[0].clientY); }}
            onTouchEnd={endStroke}
          />
        </div>
      </div>
    );
  }
);

DrawingBoard.displayName = "DrawingBoard";
export default DrawingBoard;
