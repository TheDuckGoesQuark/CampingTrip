import styles from "./shared.module.css";

export function Button({ label }: { label: string }) {
  return <button className={styles.card}>{label}</button>;
}

export function ToggleSwitch({ on }: { on: boolean }) {
  return <div role="switch" aria-checked={on} />;
}

export function PicnicArea() {
  return <section>picnic</section>;
}

export function GearIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden />;
}
