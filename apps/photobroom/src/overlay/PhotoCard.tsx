import { motion } from "framer-motion";
import { useState } from "react";

import type { ScrapedPhoto } from "../types";

const DARK_8 = "#1a1b1e";

/**
 * A single large photo in the review deck. No drag — desktop review is driven
 * by buttons/keyboard. Animates in/out in the direction of travel (forward when
 * advancing, backward on undo).
 */
export function PhotoCard({ photo, direction }: { photo: ScrapedPhoto; direction: number }) {
  const [imgError, setImgError] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: direction * 60, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: direction * -60, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 12,
        overflow: "hidden",
        background: DARK_8,
      }}
    >
      {!imgError ? (
        <img
          src={photo.thumbnailUrl}
          alt={photo.ariaLabel}
          onError={() => setImgError(true)}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "contain", background: DARK_8 }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#868e96",
            fontSize: 13,
          }}
        >
          Image unavailable
        </div>
      )}
      {photo.ariaLabel && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "28px 16px 12px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
            color: "white",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {photo.ariaLabel}
        </div>
      )}
    </motion.div>
  );
}
