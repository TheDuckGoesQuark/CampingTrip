import { useEffect, useRef } from 'react';
import rough from 'roughjs';

const INK_LIGHT = '#8a9bba';

interface RoughArrowProps {
  color?: string;
}

export function RoughArrow({ color = INK_LIGHT }: RoughArrowProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const rc = rough.svg(svg);
    const w = 50;
    const h = 20;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const opts = { stroke: color, strokeWidth: 1.5, roughness: 1 };
    svg.appendChild(rc.line(0, h / 2, w - 4, h / 2, opts));
    svg.appendChild(
      rc.line(w - 12, h / 2 - 5, w - 4, h / 2, {
        ...opts,
        roughness: 0.8,
      }),
    );
    svg.appendChild(
      rc.line(w - 12, h / 2 + 5, w - 4, h / 2, {
        ...opts,
        roughness: 0.8,
      }),
    );
  }, [color]);

  return (
    <svg
      ref={svgRef}
      preserveAspectRatio="xMidYMid meet"
      style={{ flex: '1 1 30px', minWidth: 30, height: 20, alignSelf: 'center' }}
    />
  );
}
