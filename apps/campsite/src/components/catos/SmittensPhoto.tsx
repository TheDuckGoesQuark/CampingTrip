import { asset } from "../../utils/assetPath";

import styles from "./catos.module.css";

export default function SmittensPhoto() {
  return (
    <img
      className={styles.photoImage}
      src={asset("images/smittens.webp")}
      width={1600}
      height={1015}
      alt="Smittens, a black-and-white cat, mid-meow on a sofa with a paw raised and a catnip fish beside him"
    />
  );
}
