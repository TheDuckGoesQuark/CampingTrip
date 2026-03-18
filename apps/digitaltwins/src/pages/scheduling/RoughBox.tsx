import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import rough from 'roughjs';

interface RoughBoxProps {
  stroke?: string;
  fill?: string;
  fillStyle?: string;
  fillWeight?: number;
  openLeft?: boolean;
  roughness?: number;
  strokeWidth?: number;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function RoughBox({
  stroke = '#2c3e6b',
  fill,
  fillStyle,
  fillWeight,
  openLeft,
  roughness = 1.2,
  strokeWidth = 1.5,
  children,
  style,
  className,
}: RoughBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const draw = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      // overflow: visible on the SVG handles rough strokes that extend beyond edges
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      const rc = rough.svg(svg);

      if (openLeft) {
        if (fill) {
          svg.appendChild(
            rc.rectangle(0, 0, width, height, {
              stroke: 'none',
              fill,
              fillStyle: fillStyle ?? 'solid',
              fillWeight: fillWeight ?? 0.5,
            }),
          );
        }
        const opts = { stroke, strokeWidth: 1, roughness };
        svg.appendChild(rc.line(0, 0, width, 0, opts));
        svg.appendChild(rc.line(0, height, width, height, opts));
        svg.appendChild(rc.line(width, 0, width, height, opts));
      } else {
        svg.appendChild(
          rc.rectangle(0, 0, width, height, {
            stroke,
            strokeWidth,
            roughness,
            fill: fill ?? undefined,
            fillStyle: fillStyle ?? undefined,
            fillWeight,
          }),
        );
      }
    };

    const observer = new ResizeObserver(() => draw());
    observer.observe(container);

    return () => observer.disconnect();
  }, [stroke, fill, fillStyle, fillWeight, openLeft, roughness, strokeWidth]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', ...style }}
    >
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
    </div>
  );
}
