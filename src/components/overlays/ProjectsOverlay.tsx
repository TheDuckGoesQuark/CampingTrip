import { useUIStore } from '../../store/uiStore';
import { projects } from '../../data/projects';

export default function ProjectsOverlay() {
  const activeOverlay   = useUIStore((s) => s.activeOverlay);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);

  if (activeOverlay !== 'laptop') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,6,18,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 80,
        fontFamily: 'Courier New, monospace',
        color: '#e8d5b0',
        padding: '32px',
      }}
      onClick={() => setActiveOverlay('none')}
    >
      <div
        style={{ maxWidth: 560, width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '0.9rem', color: '#9e8a6a', marginBottom: 24, letterSpacing: '0.15em' }}>
          projects
        </h2>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {projects.map((p) => (
            <li key={p.title}>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#ffb347', textDecoration: 'none', fontSize: '1rem' }}
              >
                {p.title}
              </a>
              <span style={{ color: '#9e8a6a', fontSize: '0.75rem', marginLeft: 12 }}>
                {p.year}
              </span>
              <p style={{ color: '#e8d5b0', fontSize: '0.8rem', marginTop: 4 }}>
                {p.description}
              </p>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 32, color: '#9e8a6a', fontSize: '0.75rem' }}>
          [click outside to close]
        </p>
      </div>
    </div>
  );
}
