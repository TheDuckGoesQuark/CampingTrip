interface TooltipProps {
  text: string;
}

export default function Tooltip({ text }: TooltipProps) {
  return (
    <div
      style={{
        background: 'rgba(10,6,18,0.88)',
        border: '1px solid #9e8a6a',
        color: '#e8d5b0',
        fontFamily: 'Courier New, monospace',
        fontSize: '0.75rem',
        padding: '4px 10px',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {text}
    </div>
  );
}
