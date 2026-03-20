import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSimulation,
  defaultSimConfig,
  resampleQueues,
  tick,
  type MetricsSnapshot,
  type SimConfig,
  type SimEvent,
  type SimState,
} from './simulation';

export interface SimControls {
  state: SimState;
  events: SimEvent[];
  history: MetricsSnapshot[];
  playing: boolean;
  speed: number;
  config: SimConfig;
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  setSpeed: (tps: number) => void;
  setConfig: (config: SimConfig) => void;
}

const QUEUE_IDS = ['p1', 'p2', 'p3', 'p4'];

export function useSimulation(): SimControls {
  const [config, setConfigState] = useState<SimConfig>(() => defaultSimConfig(QUEUE_IDS));
  const [state, setState] = useState<SimState>(() => createSimulation(defaultSimConfig(QUEUE_IDS)));
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [history, setHistory] = useState<MetricsSnapshot[]>([]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);

  const stateRef = useRef(state);
  const configRef = useRef(config);
  stateRef.current = state;
  configRef.current = config;

  const doTick = useCallback(() => {
    const result = tick(stateRef.current, configRef.current);
    setState(result.state);
    stateRef.current = result.state;
    setEvents(result.events);
    setHistory((prev) => [...prev, result.metrics]);
  }, []);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);

  const step = useCallback(() => {
    setPlaying(false);
    doTick();
  }, [doTick]);

  const reset = useCallback(() => {
    setPlaying(false);
    const fresh = createSimulation(configRef.current);
    setState(fresh);
    stateRef.current = fresh;
    setEvents([]);
    setHistory([]);
  }, []);

  const setConfig = useCallback((next: SimConfig) => {
    const prev = configRef.current;
    setConfigState(next);
    configRef.current = next;

    // If queue distributions changed, rescale queued tasks proportionally
    const queuesChanged = Object.keys(next.queues).some((id) => {
      const oldQ = prev.queues[id];
      const newQ = next.queues[id];
      if (!oldQ || !newQ) return false;
      return (
        oldQ.taskSize.mean !== newQ.taskSize.mean ||
        oldQ.taskSize.stdDev !== newQ.taskSize.stdDev ||
        oldQ.priority.mean !== newQ.priority.mean ||
        oldQ.priority.stdDev !== newQ.priority.stdDev
      );
    });

    if (queuesChanged) {
      const resampled = resampleQueues(stateRef.current, prev, next);
      setState(resampled);
      stateRef.current = resampled;
    }
  }, []);

  useEffect(() => {
    if (!playing) return;
    const ms = Math.max(16, 1000 / speed);
    const id = setInterval(doTick, ms);
    return () => clearInterval(id);
  }, [playing, speed, doTick]);

  return {
    state,
    events,
    history,
    playing,
    speed,
    config,
    play,
    pause,
    step,
    reset,
    setSpeed,
    setConfig,
  };
}
