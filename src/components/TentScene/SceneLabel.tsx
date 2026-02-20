import { Html } from '@react-three/drei';

interface Props {
  text: string;
  position: [number, number, number];
}

/** Shared hover/focus label used above interactive 3D objects. */
export default function SceneLabel({ text, position }: Props) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.75)',
          color: '#f0e0c0',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          letterSpacing: '0.03em',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,200,100,0.2)',
        }}
      >
        {text}
      </div>
    </Html>
  );
}
