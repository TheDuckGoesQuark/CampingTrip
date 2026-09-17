import styles from "./shared.module.css";

export function Prose({ text }: { text: string }) {
  return <p className={styles.prose}>{text}</p>;
}

export function ProgressBar({ pct }: { pct: number }) {
  return <progress value={pct} max={100} />;
}
