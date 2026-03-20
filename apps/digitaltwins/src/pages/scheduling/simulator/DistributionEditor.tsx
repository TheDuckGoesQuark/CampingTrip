import { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from '@mantine/core';
import '../notebook.css';

/**
 * Interactive bell-curve editor.
 *
 * - Drag left/right → shift the mean
 * - Drag up/down   → change the spread (up = tighter, down = wider)
 *
 * Renders a filled Gaussian PDF on a canvas, with axis labels.
 */

interface DistributionEditorProps {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  color: string;
  label: string;
  unit?: string;
  height?: number;
  onChange: (mean: number, stdDev: number) => void;
}

function gaussianPDF(x: number, mean: number, sd: number): number {
  const exp = -0.5 * ((x - mean) / sd) ** 2;
  return Math.exp(exp) / (sd * Math.sqrt(2 * Math.PI));
}

export function DistributionEditor({
  mean,
  stdDev,
  min,
  max,
  color,
  label,
  unit = '',
  height = 60,
  onChange,
}: DistributionEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startMean: number; startSD: number } | null>(null);
  const [hovering, setHovering] = useState(false);

  const range = max - min;
  const sdMin = range * 0.02;
  const sdMax = range * 0.5;

  // ── Draw ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const pad = { left: 4, right: 4, top: 4, bottom: 14 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Compute PDF curve
    const sd = Math.max(sdMin, stdDev);
    const steps = 80;
    let maxPDF = 0;
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const val = min + (i / steps) * range;
      const pdf = gaussianPDF(val, mean, sd);
      if (pdf > maxPDF) maxPDF = pdf;
      points.push({ x: val, y: pdf });
    }

    // Filled area
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + plotH);
    for (const p of points) {
      const px = pad.left + ((p.x - min) / range) * plotW;
      const py = pad.top + plotH - (p.y / maxPDF) * plotH * 0.9;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = color + '28';
    ctx.fill();

    // Stroke
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!;
      const px = pad.left + ((p.x - min) / range) * plotW;
      const py = pad.top + plotH - (p.y / maxPDF) * plotH * 0.9;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mean marker line
    const meanX = pad.left + ((mean - min) / range) * plotW;
    ctx.beginPath();
    ctx.moveTo(meanX, pad.top);
    ctx.lineTo(meanX, pad.top + plotH);
    ctx.strokeStyle = color + '88';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axis labels
    ctx.fillStyle = '#8a9bba';
    ctx.font = '9px "Caveat", cursive';
    ctx.textAlign = 'left';
    ctx.fillText(`${min}${unit}`, pad.left, h - 1);
    ctx.textAlign = 'right';
    ctx.fillText(`${max}${unit}`, w - pad.right, h - 1);
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = '10px "Caveat", cursive';
    ctx.fillText(`${Math.round(mean)}${unit}`, meanX, h - 1);
  }, [mean, stdDev, min, max, range, color, unit, sdMin]);

  // ── Drag interaction ──
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startMean: mean,
        startSD: stdDev,
      };
    },
    [mean, stdDev],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = canvas.clientWidth;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      // Horizontal → mean
      const newMean = Math.max(min, Math.min(max, d.startMean + (dx / w) * range));
      // Vertical → spread (up = tighter, down = wider)
      const sdDelta = (dy / 100) * range * 0.3;
      const newSD = Math.max(sdMin, Math.min(sdMax, d.startSD + sdDelta));

      onChange(Math.round(newMean * 10) / 10, Math.round(newSD * 10) / 10);
    },
    [min, max, range, sdMin, sdMax, onChange],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Text className="notebook-text" style={{ fontSize: 10, color: '#8a9bba', lineHeight: 1.1 }}>
        {label}
      </Text>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => { setHovering(false); dragRef.current = null; }}
        style={{
          width: '100%',
          height,
          display: 'block',
          borderRadius: 4,
          background: hovering ? 'rgba(44, 62, 107, 0.06)' : 'rgba(44, 62, 107, 0.03)',
          cursor: dragRef.current ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      />
    </div>
  );
}
