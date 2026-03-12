import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#0a0612',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Courier New, monospace',
          color: '#9e8a6a',
          padding: '2rem',
          textAlign: 'center',
          zIndex: 100,
        }}
      >
        <pre style={{ fontSize: 'clamp(0.6rem, 2.5vw, 1rem)', color: '#c4935a', marginBottom: '1.5rem', textAlign: 'left', display: 'inline-block' }}>
          {'     /\\     \n    /  \\    \n   / !! \\   \n  /______\\  '}
        </pre>
        <div style={{ fontSize: '1rem', color: '#e8d5b0', marginBottom: '0.5rem' }}>
          Something went wrong loading the campsite.
        </div>
        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '1.5rem', maxWidth: '40ch', wordBreak: 'break-word' }}>
          {this.state.error.message}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'rgba(255, 179, 71, 0.15)',
            border: '1px solid rgba(255, 179, 71, 0.3)',
            color: '#ffb347',
            padding: '10px 24px',
            borderRadius: 8,
            fontFamily: 'Courier New, monospace',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
