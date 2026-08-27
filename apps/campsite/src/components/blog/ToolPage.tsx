import { Link, Text } from "@jordanscamp/ds";
import { useState } from "react";

import type { Bookmark } from "../../types/project";
import { asset } from "../../utils/assetPath";

import styles from "./blog.module.css";

export interface ToolPageProps {
  bookmark: Bookmark;
}

export default function ToolPage({ bookmark }: ToolPageProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <>
      <div className={styles.toolHeader}>
        {!imgError && (
          <img
            className={styles.toolIcon}
            src={asset(bookmark.icon)}
            alt=""
            width={64}
            height={64}
            onError={() => setImgError(true)}
          />
        )}
        <Text variant="title-3">{bookmark.title}</Text>
      </div>

      <Text variant="body-sm" tone="muted">
        {bookmark.blurb}
      </Text>

      <div className={styles.toolLink}>
        <Link href={bookmark.url} target="_blank" rel="noopener noreferrer">
          Check it out →
        </Link>
      </div>
    </>
  );
}
