import { useProgress } from '@react-three/drei';

export default function LoadingScreen() {
  const { active, progress } = useProgress();

  if (!active) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0612',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        fontFamily: 'Courier New, monospace',
        color: '#9e8a6a',
        fontSize: '0.8rem',
        letterSpacing: '0.1em',
      }}
    >
      loading... {Math.round(progress)}%
    </div>
  );
}
