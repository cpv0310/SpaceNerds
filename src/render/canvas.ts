import type { Point } from '../entities/core';
import { PLAYFIELD_W, PLAYFIELD_H, PALETTE } from '../config';

export interface RendererConfig {
  canvas: HTMLCanvasElement;
  getDevicePixelRatio?: () => number;
  getViewport?: () => { width: number; height: number };
}

export interface StrokePathOptions {
  closed?: boolean;
}

export interface Renderer {
  beginFrame(): void;
  strokePath(pts: readonly Point[], color: string, opts?: StrokePathOptions): void;
  strokeCircle(x: number, y: number, r: number, color: string): void;
  strokeDashedCircle(
    x: number,
    y: number,
    r: number,
    color: string,
    dash: readonly number[]
  ): void;
  text(
    s: string,
    x: number,
    y: number,
    color: string,
    size: number,
    align?: CanvasTextAlign,
    baseline?: CanvasTextBaseline
  ): void;
  resize(): void;
  width(): number;
  height(): number;
}

const LINE_WIDTH = 1.5;

export function createRenderer(cfg: RendererConfig): Renderer {
  const canvas = cfg.canvas;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');

  const getDpr = cfg.getDevicePixelRatio ?? (() =>
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const getViewport =
    cfg.getViewport ??
    (() => ({ width: window.innerWidth, height: window.innerHeight }));

  function resize(): void {
    const dpr = getDpr();
    const vp = getViewport();
    const aspect = PLAYFIELD_W / PLAYFIELD_H;
    let cssW: number;
    let cssH: number;
    if (vp.width / vp.height > aspect) {
      cssH = vp.height;
      cssW = cssH * aspect;
    } else {
      cssW = vp.width;
      cssH = cssW / aspect;
    }
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const scale = canvas.width / PLAYFIELD_W;
    ctx!.setTransform(scale, 0, 0, scale, 0, 0);
    ctx!.lineWidth = LINE_WIDTH;
    ctx!.lineCap = 'round';
    ctx!.lineJoin = 'round';
  }

  resize();

  return {
    beginFrame() {
      ctx!.fillStyle = PALETTE.bg;
      ctx!.fillRect(0, 0, PLAYFIELD_W, PLAYFIELD_H);
    },
    strokePath(pts, color, opts = {}) {
      if (pts.length < 2) return;
      ctx!.strokeStyle = color;
      ctx!.beginPath();
      ctx!.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx!.lineTo(pts[i].x, pts[i].y);
      }
      if (opts.closed) ctx!.closePath();
      ctx!.stroke();
    },
    strokeCircle(x, y, r, color) {
      ctx!.strokeStyle = color;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.stroke();
    },
    strokeDashedCircle(x, y, r, color, dash) {
      ctx!.strokeStyle = color;
      ctx!.setLineDash(Array.from(dash));
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.stroke();
      ctx!.setLineDash([]);
    },
    text(s, x, y, color, size, align = 'center', baseline = 'alphabetic') {
      ctx!.fillStyle = color;
      ctx!.font = `${size}px monospace`;
      ctx!.textAlign = align;
      ctx!.textBaseline = baseline;
      ctx!.fillText(s, x, y);
    },
    resize,
    width: () => PLAYFIELD_W,
    height: () => PLAYFIELD_H,
  };
}
