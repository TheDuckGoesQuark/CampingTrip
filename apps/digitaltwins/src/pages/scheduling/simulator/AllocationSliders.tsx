import { Flex, Slider, Text } from '@mantine/core';
import type { QueueDef } from './simulation';
import '../notebook.css';

/**
 * Synchronised percentage sliders — always sum to 100%.
 *
 * When one slider moves, the others adjust proportionally so the
 * total stays at 1.0.
 */

interface AllocationSlidersProps {
  queueDefs: QueueDef[];
  allocation: Record<string, number>;  // queue id → fraction (sums to ~1)
  onChange: (allocation: Record<string, number>) => void;
}

export function AllocationSliders({ queueDefs, allocation, onChange }: AllocationSlidersProps) {
  const handleChange = (changedId: string, newValue: number) => {
    const newFrac = newValue / 100;
    const oldFrac = allocation[changedId] ?? 0;
    const delta = newFrac - oldFrac;

    if (Math.abs(delta) < 0.001) return;

    // Distribute the delta proportionally among the other queues
    const otherTotal = 1 - oldFrac;
    const next: Record<string, number> = {};

    if (otherTotal < 0.001) {
      // Edge case: this slider was at 100%, distribute equally
      const share = (1 - newFrac) / Math.max(1, queueDefs.length - 1);
      for (const def of queueDefs) {
        next[def.id] = def.id === changedId ? newFrac : share;
      }
    } else {
      for (const def of queueDefs) {
        if (def.id === changedId) {
          next[def.id] = newFrac;
        } else {
          const oldOther = allocation[def.id] ?? 0;
          const ratio = oldOther / otherTotal;
          next[def.id] = Math.max(0.01, oldOther - delta * ratio);
        }
      }
    }

    // Normalise to ensure sum is exactly 1
    const total = Object.values(next).reduce((s, v) => s + v, 0);
    for (const key of Object.keys(next)) {
      next[key] = next[key]! / total;
    }

    onChange(next);
  };

  return (
    <Flex direction="column" gap={4}>
      <Text className="notebook-text" fw={600} style={{ fontSize: 11, color: '#8a9bba' }}>
        Time allocation
      </Text>
      {queueDefs.map((def) => {
        const pct = Math.round((allocation[def.id] ?? 0) * 100);
        return (
          <Flex key={def.id} align="center" gap={6}>
            <Text className="notebook-text" fw={600} style={{ color: def.color, fontSize: 12, minWidth: 24, textAlign: 'right' }}>
              {def.label}
            </Text>
            <Slider
              value={pct}
              onChange={(v) => handleChange(def.id, v)}
              min={1}
              max={80}
              step={1}
              size="xs"
              color={def.color}
              style={{ flex: 1 }}
              label={(v) => `${v}%`}
            />
            <Text className="notebook-text" style={{ fontSize: 11, color: def.color, minWidth: 28, textAlign: 'right' }}>
              {pct}%
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}
