"use client";

import { useEffect, useRef } from "react";

export type CanvasFrame = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Seconds since start */
  time: number;
  /** Seconds since previous frame (capped) */
  dt: number;
};

/**
 * Full-viewport canvas loop: sizes the canvas to the window (DPR capped at 1.5),
 * throttles to `fps`, and pauses while the tab is hidden.
 */
export function useCanvasLoop(
  onResize: (width: number, height: number, dpr: number) => void,
  onFrame: (frame: CanvasFrame) => void,
  fps = 30,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeRef = useRef(onResize);
  const frameRef = useRef(onFrame);
  resizeRef.current = onResize;
  frameRef.current = onFrame;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const interval = 1000 / fps;
    const start = performance.now();
    let width = 0;
    let height = 0;
    let last = 0;
    let raf = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resizeRef.current(width, height, dpr);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || now - last < interval) return;
      const dt = last ? Math.min(now - last, 100) / 1000 : 0;
      last = now;
      frameRef.current({ ctx, width, height, time: (now - start) / 1000, dt });
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [fps]);

  return canvasRef;
}

export function BackgroundCanvas({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  return <canvas ref={canvasRef} className="bgv-canvas" aria-hidden />;
}
