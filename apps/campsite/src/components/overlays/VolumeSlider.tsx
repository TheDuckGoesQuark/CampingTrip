import { useSessionStore } from "../../store/sessionStore";

export interface VolumeSliderProps {
  className?: string;
}

/**
 * A native range rather than a drawn control: it comes with the arrow keys,
 * Home/End and the value announcement, and each surface skins this one instead.
 */
export default function VolumeSlider({ className }: VolumeSliderProps) {
  const volume = useSessionStore((s) => s.volume);
  const setVolume = useSessionStore((s) => s.setVolume);

  return (
    <input
      className={className}
      type="range"
      min={0}
      max={100}
      step={5}
      value={Math.round(volume * 100)}
      aria-label="Volume"
      aria-valuetext={`${Math.round(volume * 100)}%`}
      onChange={(e) => setVolume(e.currentTarget.valueAsNumber / 100)}
    />
  );
}
