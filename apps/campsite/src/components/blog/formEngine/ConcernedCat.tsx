import { Link, Text } from "@jordanscamp/ds";

import { asset } from "../../../utils/assetPath";

import styles from "./ConcernedCat.module.css";

const SOURCE = "https://www.reddit.com/r/PixelArt/comments/1ecb6pa/i_drew_heavy_breathing_cat/";
const ARTIST = "u/mrleicester";

export default function ConcernedCat() {
  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <img
          className={styles.image}
          src={asset("images/heavy-breathing-cat.jpg")}
          alt="Pixel art of the heavy breathing cat meme: a round, cream-coloured cat staring straight out with wide green eyes"
          width={448}
          height={448}
        />
        <span className={styles.meme} aria-hidden="true">
          Heavy breathing
        </span>
      </div>
      <figcaption>
        <Text variant="label" tone="muted" as="span">
          cat by{" "}
          <Link href={SOURCE} target="_blank" rel="noopener noreferrer">
            {ARTIST}
          </Link>
        </Text>
      </figcaption>
    </figure>
  );
}
