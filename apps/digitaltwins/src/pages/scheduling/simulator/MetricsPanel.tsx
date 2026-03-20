import { Stack, Text } from '@mantine/core';
import { useEffect, useRef } from 'react';
import type { MetricsSnapshot, QueueDef, SimConfig, SimTask } from './simulation';
import '../notebook.css';

const INK_LIGHT = '#8a9bba';

// ── Axis helpers ────────────────────────────────────────────────

/** Pick "nice" tick step for an axis with the given max value. */
function niceStep(maxVal: number, targetTicks: number): number {
  if (maxVal <= 0) return 1;
  const rough = maxVal / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / mag;
  let step: number;
  if (residual <= 1.5) step = 1;
  else if (residual <= 3) step = 2;
  else if (residual <= 7) step = 5;
  else step = 10;
  return step * mag;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

// ── Canvas chart with axes ──────────────────────────────────────

interface Series {
  values: number[];
  color: string;
  label: string;
  dashed?: boolean;
}

function Chart({
  title,
  description,
  series,
  xLabel,
  formatX,
  formatY,
  maxPoints = Infinity,
}: {
  title: string;
  description?: string;
  series: Series[];
  xLabel?: string;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  maxPoints?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const pad = { left: 36, right: 8, top: 6, bottom: 18 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    if (plotW < 10 || plotH < 10) return;

    // Compute data range
    let yMax = 1;
    let dataLen = 0;
    for (const s of series) {
      dataLen = Math.max(dataLen, s.values.length);
      for (const v of s.values) {
        if (v > yMax) yMax = v;
      }
    }
    yMax = Math.ceil(yMax * 1.1);

    const totalPoints = dataLen;
    const startIdx = Math.max(0, totalPoints - maxPoints);
    const visibleLen = totalPoints - startIdx;
    if (visibleLen < 1) return;

    const xMax = totalPoints - 1;
    const xMin = startIdx;

    // Grid lines + Y axis labels
    const yStep = niceStep(yMax, 4);
    ctx.strokeStyle = '#e0ddd4';
    ctx.lineWidth = 0.5;
    ctx.font = '11px "Caveat", cursive';
    ctx.fillStyle = INK_LIGHT;
    ctx.textAlign = 'right';

    for (let yVal = 0; yVal <= yMax; yVal += yStep) {
      const py = pad.top + plotH - (yVal / yMax) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, py);
      ctx.lineTo(pad.left + plotW, py);
      ctx.stroke();
      const yLabel = formatY ? formatY(yVal) : String(Math.round(yVal));
      ctx.fillText(yLabel, pad.left - 4, py + 3);
    }

    // X axis labels
    const xStep = niceStep(xMax - xMin, 4);
    ctx.textAlign = 'center';
    for (let xVal = Math.ceil(xMin / xStep) * xStep; xVal <= xMax; xVal += xStep) {
      const px = pad.left + ((xVal - xMin) / Math.max(1, xMax - xMin)) * plotW;
      const label = formatX ? formatX(xVal) : String(Math.round(xVal));
      ctx.fillText(label, px, h - 2);
    }

    // Plot border
    ctx.strokeStyle = '#d0cdc4';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.left, pad.top, plotW, plotH);

    // Draw series (downsample if more data points than pixels)
    const xRange = Math.max(1, xMax - xMin);
    const step = Math.max(1, Math.floor(visibleLen / (plotW * 2)));

    for (const s of series) {
      const data = s.values;
      if (data.length < 2) continue;

      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.5;
      if (s.dashed) ctx.setLineDash([4, 3]);
      else ctx.setLineDash([]);

      let first = true;
      for (let i = startIdx; i < data.length; i += step) {
        const px = pad.left + ((i - xMin) / xRange) * plotW;
        const py = pad.top + plotH - (data[i]! / yMax) * plotH;
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      // Always include the last point
      const last = data.length - 1;
      if (last > startIdx) {
        const px = pad.left + ((last - xMin) / xRange) * plotW;
        const py = pad.top + plotH - (data[last]! / yMax) * plotH;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // Legend
  const legendItems = series.filter((s) => s.values.length > 0);

  return (
    <div style={{ minHeight: 100, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        <Text className="notebook-text" fw={600} style={{ fontSize: 14, color: INK_LIGHT }}>
          {title}
        </Text>
        {legendItems.map((s) => (
          <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span style={{
              display: 'inline-block',
              width: 12,
              height: 2,
              background: s.color,
              borderTop: s.dashed ? `2px dashed ${s.color}` : undefined,
            }} />
            <Text className="notebook-text" style={{ fontSize: 12, color: s.color }}>{s.label}</Text>
          </span>
        ))}
      </div>
      {description && (
        <Text className="notebook-text" style={{ fontSize: 11, color: INK_LIGHT, marginTop: -1, marginBottom: 1, lineHeight: 1.2 }}>
          {description}
        </Text>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          flex: 1,
          minHeight: 64,
          display: 'block',
          borderRadius: 4,
          background: 'rgba(44, 62, 107, 0.03)',
        }}
      />
      {xLabel && (
        <Text className="notebook-text" ta="center" style={{ fontSize: 11, color: INK_LIGHT, marginTop: 1 }}>
          {xLabel}
        </Text>
      )}
    </div>
  );
}

// ── Metrics panel ────────────────────────────────────────────────

interface MetricsPanelProps {
  history: MetricsSnapshot[];
  queueDefs: QueueDef[];
  config: SimConfig;
  done: SimTask[];
}

/** Compute a rolling average over the last `windowSize` entries of `values`. */
function rollingAvg(values: number[], windowSize: number): number[] {
  const result: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!;
    if (i >= windowSize) sum -= values[i - windowSize]!;
    const count = Math.min(i + 1, windowSize);
    result.push(sum / count);
  }
  return result;
}

export function MetricsPanel({ history, queueDefs, config, done }: MetricsPanelProps) {
  if (history.length === 0) {
    return (
      <Stack gap="md" justify="center" style={{ height: '100%' }}>
        <Text className="notebook-text" ta="center" c={INK_LIGHT} style={{ fontSize: 16 }}>
          Press Play or Step to start
        </Text>
      </Stack>
    );
  }

  // ── Completion distribution bar ──
  const doneCounts: Record<string, number> = {};
  for (const task of done) {
    doneCounts[task.project] = (doneCounts[task.project] ?? 0) + 1;
  }

  const fmtX = (v: number) => formatTime(v);

  // ── Throughput rate (rolling 30-min average of completions) ──
  const rawCompletions = history.map((h) => h.completedThisTick);
  const WINDOW = 30; // 30-minute rolling window
  const throughputValues = rollingAvg(rawCompletions, WINDOW).map((v) => v * 60); // per hour
  const throughputSeries: Series[] = [
    { values: throughputValues, color: '#2d6a4f', label: 'tasks/hr' },
  ];

  // ── Actual vs intended allocation ──
  // Track cumulative ticks spent on each project and compare to intended fraction
  const allocationSeries: Series[] = [];
  if (history.length > 1) {
    const cumulativeWork: Record<string, number[]> = {};
    for (const def of queueDefs) cumulativeWork[def.id] = [];

    const runningWork: Record<string, number> = {};
    for (const def of queueDefs) runningWork[def.id] = 0;

    for (const h of history) {
      if (h.executorProject && !h.contextSwitching && !h.interruptedThisTick) {
        runningWork[h.executorProject] = (runningWork[h.executorProject] ?? 0) + 1;
      }
      const totalWork = Object.values(runningWork).reduce((s, v) => s + v, 0);
      for (const def of queueDefs) {
        const actual = totalWork > 0 ? ((runningWork[def.id] ?? 0) / totalWork) * 100 : 0;
        cumulativeWork[def.id]!.push(actual);
      }
    }

    for (const def of queueDefs) {
      // Actual (solid)
      allocationSeries.push({
        values: cumulativeWork[def.id]!,
        color: def.color,
        label: def.name,
      });
      // Intended (dashed)
      const intended = (config.timeAllocation[def.id] ?? 1 / queueDefs.length) * 100;
      allocationSeries.push({
        values: history.map(() => intended),
        color: def.color + '88',
        label: `${def.name} target`,
        dashed: true,
      });
    }
  }

  // ── Executor utilisation (rolling %) ──
  // 1 = productive work, 0 = idle/interrupted/context switching
  const rawUtilBusy = history.map((h) =>
    h.executorBusy && !h.contextSwitching && !h.interruptedThisTick ? 1 : 0,
  );
  const rawUtilInterrupt = history.map((h) => (h.interruptedThisTick ? 1 : 0));
  const rawUtilSwitch = history.map((h) => (h.contextSwitching ? 1 : 0));
  const UTIL_WINDOW = 60;
  const utilSeries: Series[] = [
    {
      values: rollingAvg(rawUtilBusy, UTIL_WINDOW).map((v) => v * 100),
      color: '#2c3e6b',
      label: 'Working',
    },
    {
      values: rollingAvg(rawUtilInterrupt, UTIL_WINDOW).map((v) => v * 100),
      color: '#c0392b',
      label: 'Interrupted',
      dashed: true,
    },
    {
      values: rollingAvg(rawUtilSwitch, UTIL_WINDOW).map((v) => v * 100),
      color: '#e67e22',
      label: 'Switching',
      dashed: true,
    },
  ];

  // ── Oldest task age per queue ──
  const ageSeries: Series[] = queueDefs.map((def) => ({
    values: history.map((h) => h.oldestTaskAge[def.id] ?? 0),
    color: def.color,
    label: def.name,
  }));

  return (
    <Stack gap={8}>
      {/* Completion distribution bar */}
      {done.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
            <Text className="notebook-text" fw={600} style={{ fontSize: 13, color: INK_LIGHT }}>
              Completed
            </Text>
            <Text className="notebook-text" style={{ fontSize: 12, color: INK_LIGHT }}>
              {done.length} tasks
            </Text>
            <div style={{ flex: 1 }} />
            {queueDefs.map((def) => {
              const c = doneCounts[def.id] ?? 0;
              if (c === 0) return null;
              return (
                <span key={def.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: def.color + '77' }} />
                  <Text className="notebook-text" style={{ fontSize: 11, color: def.color }}>{c}</Text>
                </span>
              );
            })}
          </div>
          <div style={{
            display: 'flex',
            height: 10,
            borderRadius: 5,
            overflow: 'hidden',
            border: '1px solid #d0cdc4',
          }}>
            {queueDefs.map((def) => {
              const count = doneCounts[def.id] ?? 0;
              if (count === 0) return null;
              return (
                <div
                  key={def.id}
                  style={{
                    flex: count,
                    background: def.color + '55',
                    transition: 'flex 200ms ease-out',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
      <Chart
        title="Throughput"
        description="Tasks completed per hour (30-min rolling avg). Higher = more productive."
        series={throughputSeries}
        formatX={fmtX}
        formatY={(v) => `${Math.round(v)}`}
      />
      <Chart
        title="Executor utilisation"
        description="Time split: productive work vs lost to interruptions and context switching."
        series={utilSeries}
        formatX={fmtX}
        formatY={(v) => `${Math.round(v)}%`}
      />
      <Chart
        title="Actual vs target allocation"
        description="How time is really spent per project (solid) vs your intended split (dashed)."
        series={allocationSeries}
        formatX={fmtX}
        formatY={(v) => `${Math.round(v)}%`}
      />
      <Chart
        title="Oldest task age"
        description="How long the oldest waiting task in each queue has been sitting. Starvation shows up here."
        series={ageSeries}
        formatX={fmtX}
        formatY={(v) => formatTime(Math.round(v))}
      />
    </Stack>
  );
}
