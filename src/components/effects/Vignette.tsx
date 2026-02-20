// Pure CSS vignette — a dark radial gradient overlay over the Canvas.
// Lives outside the Canvas so it doesn't affect Three.js.
export default function Vignette() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        background:
          'radial-gradient(ellipse at center, transparent 45%, rgba(5,2,12,0.55) 100%)',
      }}
    />
  );
}
