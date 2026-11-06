import { type RefObject, useEffect, useMemo, useRef, useState } from "react";

import { MAZE } from "../engine/maze";
import { useSheets } from "../sprites/useSheets";
import { drawList } from "./drawList";
import { BOARD_PX } from "./geometry";
import { FLASH_COLOURS, MAZE_COLOURS, type MazeColours, paintMaze } from "./mazeArt";
import { paint } from "./paint";
import type { Scene } from "./scene";

import styles from "./BoardCanvas.module.css";

/**
 * Device pixels per board pixel, a whole number so every board pixel is the
 * same size on screen. Chosen from the canvas's laid-out width, which CSS sets.
 */
function useScale(canvas: RefObject<HTMLCanvasElement | null>): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const measure = () => {
      const width = element.getBoundingClientRect().width * window.devicePixelRatio;
      setScale(Math.max(1, Math.round(width / BOARD_PX.width)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [canvas]);
  return scale;
}

function mazeImage(scale: number, colours: MazeColours): HTMLCanvasElement | null {
  const image = document.createElement("canvas");
  image.width = BOARD_PX.width * scale;
  image.height = BOARD_PX.height * scale;
  const ctx = image.getContext("2d");
  if (!ctx) return null;
  ctx.scale(scale, scale);
  paintMaze(ctx, MAZE, colours);
  return image;
}

/** The board, drawn from a scene. Reads it and nothing else. */
export default function BoardCanvas({ scene }: { scene: Scene }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scale = useScale(canvas);
  const sheets = useSheets();

  // The walls never change within a board, so they are drawn once per scale.
  const maze = useMemo(() => {
    const normal = mazeImage(scale, MAZE_COLOURS);
    const flash = mazeImage(scale, FLASH_COLOURS);
    return normal && flash ? { normal, flash } : null;
  }, [scale]);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) paint(ctx, drawList(scene), { sheets, maze }, scale);
  }, [scene, sheets, maze, scale]);

  return (
    <canvas
      ref={canvas}
      className={styles.board}
      width={BOARD_PX.width * scale}
      height={BOARD_PX.height * scale}
      aria-hidden
    />
  );
}
