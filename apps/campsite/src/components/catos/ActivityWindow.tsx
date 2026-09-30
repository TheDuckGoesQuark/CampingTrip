import { MonitorGraph, Text, Window } from "@jordanscamp/ds";
import { useEffect, useState } from "react";

import {
  fetchCount,
  fetchDailyCounts,
  lastDays,
  SITE_WIDE,
  type DayCount,
} from "../../analytics/visitorCounts";
import { published } from "../../data/posts";
import { slugify } from "../../data/slug";
import { blogPaths } from "../../routing/blogPaths";
import { useSceneStore } from "../../store/sceneStore";
import type { WindowFrameProps } from "./windowFrame";

import styles from "./catos.module.css";

export const DAYS_SHOWN = 14;

export const MEMORY_SAMPLES = 60;
/** What About CatOS's "Infinite, but session scoped" comes to per open window. */
export const KERNEL_MB = 256;
export const WINDOW_MB = 128;

interface Process {
  title: string;
  path: string;
  count: number | null;
}

interface Activity {
  daily: DayCount[] | null;
  total: number | null;
  processes: Process[];
}

const EMPTY: Activity = { daily: null, total: null, processes: [] };

const processesToWatch = () =>
  published.map((post) => ({ title: post.title, path: blogPaths.post(slugify(post.title)) }));

function useActivity(): { activity: Activity; loaded: boolean } {
  const [activity, setActivity] = useState<Activity>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const watched = processesToWatch();
    // The total goes first and alone: while the counter setting is off every
    // request fails, and one failure says so as well as seventeen would.
    const load = async (): Promise<Activity> => {
      const total = await fetchCount(SITE_WIDE);
      if (total === null) {
        return { daily: null, total, processes: watched.map((p) => ({ ...p, count: null })) };
      }
      const [daily, counts] = await Promise.all([
        fetchDailyCounts(SITE_WIDE, lastDays(DAYS_SHOWN, new Date())),
        Promise.all(watched.map((process) => fetchCount(process.path))),
      ]);
      const processes = watched
        .map((process, i) => ({ ...process, count: counts[i] }))
        .sort((a, b) => (b.count ?? -1) - (a.count ?? -1));
      return { daily, total, processes };
    };
    void (async () => {
      const next = await load();
      if (cancelled) return;
      setActivity(next);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { activity, loaded };
}

export const memoryInUse = (openWindows: number) => KERNEL_MB + WINDOW_MB * openWindows;

function useSessionMemory(): number[] {
  const openWindows = useSceneStore((s) => s.openWindows.length);
  const [samples, setSamples] = useState<number[]>(() => [memoryInUse(openWindows)]);

  useEffect(() => {
    const id = setInterval(() => {
      const used = memoryInUse(useSceneStore.getState().openWindows.length);
      setSamples((prev) => [...prev, used].slice(-MEMORY_SAMPLES));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return samples;
}

const formatCount = (count: number | null) =>
  count === null ? "…" : count.toLocaleString("en-GB");

export interface ActivityWindowProps extends WindowFrameProps {
  onClose: () => void;
}

/** Every figure here is already public on the dashboard the Admin item opens. */
export default function ActivityWindow({ onClose, ...frame }: ActivityWindowProps) {
  const { activity, loaded } = useActivity();
  const memory = useSessionMemory();
  const unavailable = loaded && activity.total === null;

  const dailyValues = activity.daily?.map((d) => d.count) ?? [];
  const dailyMax = Math.max(1, ...dailyValues);
  const dailyTotal = dailyValues.reduce((sum, n) => sum + n, 0);
  const memoryMax = KERNEL_MB + WINDOW_MB * 6;
  const processMax = Math.max(1, ...activity.processes.map((p) => p.count ?? 0));

  return (
    <Window size="md" {...frame}>
      <Window.TitleBar title="Activity Monitor" onClose={onClose} />
      <Window.Body>
        <div className={styles.monitorBody}>
          <div className={styles.monitorGraphs}>
            <section className={styles.monitorPanel} aria-labelledby="activity-visitors">
              <Text variant="label" tone="muted" as="h3" id="activity-visitors">
                Visitors, last {DAYS_SHOWN} days
              </Text>
              <MonitorGraph
                label={
                  activity.daily
                    ? `${dailyTotal.toLocaleString("en-GB")} visitors over the last ${DAYS_SHOWN} days, one bar per day`
                    : "No visitor data"
                }
                values={dailyValues}
                slots={DAYS_SHOWN}
                max={dailyMax}
                kind="bars"
              />
              <p className={styles.monitorReadout}>
                {activity.daily ? `${dailyTotal.toLocaleString("en-GB")} in the period` : "…"}
              </p>
            </section>
            <section className={styles.monitorPanel} aria-labelledby="activity-memory">
              <Text variant="label" tone="muted" as="h3" id="activity-memory">
                Memory, this session
              </Text>
              <MonitorGraph
                label={`${memory[memory.length - 1]} MB in use, sampled each second`}
                values={memory}
                slots={MEMORY_SAMPLES}
                max={memoryMax}
                kind="line"
              />
              <p className={styles.monitorReadout}>{memory[memory.length - 1]} MB in use, ∞ free</p>
            </section>
          </div>

          <table className={styles.monitorProcesses}>
            <caption className={styles.monitorCaption}>Processes</caption>
            <thead>
              <tr>
                <th scope="col">Process</th>
                <th scope="col" className={styles.monitorNumber}>
                  Visits
                </th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {activity.processes.map((process) => (
                <tr key={process.path}>
                  <td>{process.title}</td>
                  <td className={styles.monitorNumber}>{formatCount(process.count)}</td>
                  <td>
                    <meter
                      className={styles.monitorShare}
                      value={process.count ?? 0}
                      max={processMax}
                      aria-label={`${process.title}: share of visits`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Window.Body>
      <Window.StatusBar>
        {unavailable
          ? "Visitor counts are unavailable right now."
          : `${formatCount(activity.total)} visitors all time.`}
      </Window.StatusBar>
    </Window>
  );
}
