import { useEffect, useRef } from 'react';
import rough from 'roughjs';

interface RoughExclamationProps {
  opacity?: number;
}

export function RoughExclamation({ opacity = 1 }: RoughExclamationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const rc = rough.svg(svg);
    const color = '#c0392b';
    const opts = { stroke: color, strokeWidth: 3, roughness: 1.5, fill: color, fillStyle: 'solid' as const };

    // Stem — fat chunky rectangle, tapers slightly
    svg.appendChild(rc.polygon([[6, 2], [18, 2], [15, 34], [9, 34]], { ...opts, strokeWidth: 3 }));

    // Dot — big filled circle, pushed down for more gap
    svg.appendChild(rc.circle(12, 48, 11, { ...opts, strokeWidth: 2.5 }));
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 24 56"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: 32, height: 66, opacity, transition: 'opacity 200ms ease-out' }}
    />
  );
}
