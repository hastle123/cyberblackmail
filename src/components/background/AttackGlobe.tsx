"use client";

import { useEffect, useRef } from "react";
import { mesh } from "topojson-client";
import type { Topology } from "topojson-specification";
import { BackgroundCanvas, useCanvasLoop } from "./useCanvasLoop";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const RAD = Math.PI / 180;
const TILT = 18 * RAD;

// [lon, lat] of cities used as arc endpoints
const CITIES: [number, number][] = [
  [37.6, 55.75], [116.4, 39.9], [-77.0, 38.9], [-74.0, 40.7], [-0.13, 51.5],
  [8.68, 50.1], [-46.6, -23.5], [139.7, 35.7], [127.0, 37.6], [103.8, 1.35],
  [151.2, -33.9], [72.9, 19.1], [51.4, 35.7], [125.75, 39.0], [30.5, 50.45],
  [34.8, 32.1], [3.4, 6.5], [55.3, 25.2], [-118.2, 34.05], [-79.4, 43.65],
];

type Vec = [number, number, number];
type Arc = { from: Vec; to: Vec; omega: number; t: number; dur: number };

const toVec = ([lon, lat]: [number, number]): Vec => [
  Math.cos(lat * RAD) * Math.cos(lon * RAD),
  Math.cos(lat * RAD) * Math.sin(lon * RAD),
  Math.sin(lat * RAD),
];

function newArc(): Arc {
  const a = CITIES[(Math.random() * CITIES.length) | 0];
  let b = CITIES[(Math.random() * CITIES.length) | 0];
  while (b === a) b = CITIES[(Math.random() * CITIES.length) | 0];
  const from = toVec(a);
  const to = toVec(b);
  const dot = Math.max(-1, Math.min(1, from[0] * to[0] + from[1] * to[1] + from[2] * to[2]));
  return { from, to, omega: Math.acos(dot), t: -Math.random() * 2, dur: 2.2 + Math.random() * 1.6 };
}

/** Wireframe globe with country outlines and red attack arcs flying between cities. */
export function AttackGlobe() {
  const land = useRef<Float32Array[]>([]);
  const state = useRef({ cx: 0, cy: 0, r: 0, spin: 0, calm: false, arcs: Array.from({ length: 6 }, newArc) });

  // With "reduce motion" on, keep the globe but turn it slower and send fewer, slower arcs
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      state.current.calm = query.matches;
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(GEO_URL)
      .then((res) => res.json())
      .then((topo: Topology) => {
        if (cancelled) return;
        const lines = mesh(topo, topo.objects.countries as never).coordinates;
        land.current = lines.map((line) => Float32Array.from(line.flatMap(([lon, lat]) => [lon * RAD, lat * RAD])));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const canvasRef = useCanvasLoop(
    (width, height) => {
      const mobile = width < 768;
      state.current.cx = mobile ? width * 0.5 : width * 0.76;
      state.current.cy = mobile ? height * 0.78 : height * 0.6;
      state.current.r = mobile ? width * 0.85 : Math.max(height * 0.52, width * 0.3);
    },
    ({ ctx, width, height, dt }) => {
      const st = state.current;
      const { cx, cy, r, arcs, calm } = st;
      st.spin += dt * (calm ? 2 : 5) * RAD;
      const spin = st.spin;
      const sinT = Math.sin(TILT);
      const cosT = Math.cos(TILT);

      // Orthographic projection; z > 0 means the point faces the viewer
      const project = (lam: number, phi: number, lift = 1) => {
        const cl = Math.cos(lam + spin);
        const sl = Math.sin(lam + spin);
        const cp = Math.cos(phi);
        const sp = Math.sin(phi);
        return {
          x: cx + r * lift * cp * sl,
          y: cy - r * lift * (cosT * sp - sinT * cp * cl),
          z: sinT * sp + cosT * cp * cl,
        };
      };

      const strokePolyline = (coords: ArrayLike<number>, stride: number) => {
        let drawing = false;
        for (let i = 0; i < coords.length; i += stride) {
          const p = project(coords[i], coords[i + 1]);
          if (p.z <= 0) {
            drawing = false;
            continue;
          }
          if (drawing) ctx.lineTo(p.x, p.y);
          else ctx.moveTo(p.x, p.y);
          drawing = true;
        }
      };

      ctx.clearRect(0, 0, width, height);

      // Atmosphere rim
      const rim = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, r * 1.12);
      rim.addColorStop(0, "rgba(229, 38, 43, 0)");
      rim.addColorStop(0.55, "rgba(229, 38, 43, 0.07)");
      rim.addColorStop(1, "rgba(229, 38, 43, 0)");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Graticule
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.beginPath();
      for (let lon = -180; lon < 180; lon += 20) {
        const line: number[] = [];
        for (let lat = -90; lat <= 90; lat += 4) line.push(lon * RAD, lat * RAD);
        strokePolyline(line, 2);
      }
      for (let lat = -60; lat <= 60; lat += 20) {
        const line: number[] = [];
        for (let lon = -180; lon <= 180; lon += 4) line.push(lon * RAD, lat * RAD);
        strokePolyline(line, 2);
      }
      ctx.stroke();

      // Country outlines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
      ctx.beginPath();
      for (const line of land.current) strokePolyline(line, 2);
      ctx.stroke();

      // Attack arcs
      ctx.lineCap = "round";
      const activeArcs = calm ? 3 : arcs.length;
      for (let k = 0; k < activeArcs; k++) {
        const arc = arcs[k];
        arc.t += dt / (calm ? arc.dur * 1.8 : arc.dur);
        if (arc.t > 1.45) {
          arcs[k] = newArc();
          continue;
        }
        if (arc.t <= 0) continue;

        const head = Math.min(arc.t, 1);
        const tail = Math.max(0, arc.t - 0.45);
        const fadeOut = arc.t > 1 ? 1 - (arc.t - 1) / 0.45 : 1;
        const segs = 28;
        const sinO = Math.sin(arc.omega) || 1;
        let prev: { x: number; y: number; z: number } | null = null;

        for (let s = 0; s <= segs; s++) {
          const u = tail + ((head - tail) * s) / segs;
          const wa = Math.sin((1 - u) * arc.omega) / sinO;
          const wb = Math.sin(u * arc.omega) / sinO;
          const vx = wa * arc.from[0] + wb * arc.to[0];
          const vy = wa * arc.from[1] + wb * arc.to[1];
          const vz = wa * arc.from[2] + wb * arc.to[2];
          const lift = 1 + Math.sin(Math.PI * u) * (0.08 + arc.omega * 0.09);
          const p = project(Math.atan2(vy, vx), Math.asin(Math.max(-1, Math.min(1, vz))), lift);
          if (prev && p.z > -0.15 && prev.z > -0.15) {
            const a = (s / segs) * fadeOut;
            ctx.strokeStyle = `rgba(255, 70, 74, ${0.85 * a * a})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
          prev = p;
        }
      }
    },
    30,
  );

  return <BackgroundCanvas canvasRef={canvasRef} />;
}
