import type { CSSProperties, ReactNode } from 'react';

/** The overlay renders into a shadow root, so it carries its own small palette
 *  and primitives rather than depending on the page (or Mantine). */
export const colors = {
  panelBg: '#1a1b1e',
  border: '#373a40',
  text: '#e9ecef',
  dim: '#909296',
  green: '#40c057',
  red: '#fa5252',
  gray: '#5c5f66',
  blue: '#4dabf7',
} as const;

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export type ButtonColor = 'blue' | 'red' | 'green' | 'gray' | 'transparent';

export function Button({
  color = 'blue',
  onClick,
  disabled,
  style,
  children,
}: {
  color?: ButtonColor;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const transparent = color === 'transparent';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: transparent ? 'transparent' : colors[color],
        color: transparent ? colors.dim : '#fff',
        border: transparent ? `1px solid ${colors.border}` : 'none',
        borderRadius: 8,
        padding: '9px 14px',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** A keycap hint, e.g. <Kbd>←</Kbd>. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        marginLeft: 8,
        borderRadius: 4,
        background: 'rgba(255,255,255,0.18)',
        border: '1px solid rgba(255,255,255,0.35)',
        fontSize: 12,
        lineHeight: 1,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        border: `2px solid ${colors.blue}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'pb-spin 0.8s linear infinite',
      }}
    />
  );
}
