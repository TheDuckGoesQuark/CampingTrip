import { useInteractionStore } from '../../store/interactionStore';

/**
 * Ordered list of interactive 3D objects in the scene.
 * Tab moves through them; Enter activates.
 */
const ITEMS = [
  { id: 'guitar', label: 'Guitar' },
  { id: 'laptop', label: 'Laptop – click to toggle screen' },
  { id: 'projects', label: 'Projects – open CatMap' },
  { id: 'moka-pot', label: 'Moka Pot' },
  { id: 'scarlett', label: 'Scarlett Solo audio interface' },
  { id: 'shure-mic', label: 'Shure SM57 microphone' },
  { id: 'midi', label: 'MIDI controller' },
  { id: 'notepad', label: 'Notepad' },
  { id: 'cat', label: 'Cat walking outside' },
] as const;

export default function InteractionOverlay() {
  const setFocused = useInteractionStore((s) => s.setFocused);

  return (
    <div
      role="toolbar"
      aria-label="Interactive objects in tent scene"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        overflow: 'visible',
        zIndex: 10,
      }}
    >
      {ITEMS.map((item) => (
        <button
          key={item.id}
          aria-label={item.label}
          tabIndex={0}
          onFocus={() => setFocused(item.id)}
          onBlur={() => setFocused(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.dispatchEvent(
                new CustomEvent('scene-activate', { detail: { id: item.id } }),
              );
            }
          }}
          style={{
            // Visually hidden but still focusable (a11y best practice)
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: 0,
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
