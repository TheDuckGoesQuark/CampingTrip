import styles from "./catos.module.css";

/**
 * Stands in for the photograph the desktop claims to hold. Drawn rather than
 * shipped, because the repo carries no cat photo — swap it for an `<img>` when
 * there is one, and `PreviewWindow` needs no change.
 */
export default function SmittensPhoto() {
  return (
    <svg
      className={styles.photoImage}
      width={520}
      height={330}
      viewBox="0 0 520 330"
      role="img"
      aria-label="A cat sitting in a tent doorway at dusk, looking out at the trees"
    >
      <rect width="520" height="330" fill="#dde9d4" />
      <rect width="520" height="200" fill="#eef4ea" />
      <circle cx="428" cy="58" r="26" fill="#ffe9cc" />
      <circle cx="112" cy="44" r="2" fill="#b3bdaa" />
      <circle cx="168" cy="76" r="1.6" fill="#b3bdaa" />
      <circle cx="252" cy="38" r="2" fill="#b3bdaa" />
      <circle cx="332" cy="92" r="1.6" fill="#b3bdaa" />
      <path
        d="M0 200 42 128 84 200zM70 200 118 112 166 200zM392 200 440 122 488 200zM452 200 500 140 520 176v24z"
        fill="#99bd88"
      />
      <rect y="196" width="520" height="134" fill="#bdd4b0" />
      <path d="M118 300 236 132 354 300z" fill="#5a9367" />
      <path d="M236 132 354 300h-42L236 176z" fill="#4c7d57" />
      <path d="M236 176 300 300h-128z" fill="#38492f" />
      <path d="M236 240c-15 0-25 12-25 28v32h50v-32c0-16-10-28-25-28z" fill="#2b3327" />
      <path d="M214 246l-4-18 15 9zM258 246l4-18-15 9z" fill="#2b3327" />
      <circle cx="227" cy="262" r="3" fill="#ffac3c" />
      <circle cx="245" cy="262" r="3" fill="#ffac3c" />
      <path
        d="M300 300c14-6 26-4 36 4"
        stroke="#2b3327"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
