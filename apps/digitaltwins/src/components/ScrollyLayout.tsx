import { Box } from '@mantine/core';
import { useRef, type ReactNode } from 'react';
import { useScrollyProgress } from '../hooks/useScrollyProgress';
import '../pages/scheduling/notebook.css';

interface ScrollyLayoutProps {
  /** Title area rendered at the top */
  renderTitle: () => ReactNode;
  /** The sticky visualization — receives the active step index */
  renderVisualization: (activeStep: number) => ReactNode;
  /** The narrative sections (should be ScrollySection components) */
  children: (activeStep: number) => ReactNode;
}

export function ScrollyLayout({
  renderTitle,
  renderVisualization,
  children,
}: ScrollyLayoutProps) {
  const narrativeRef = useRef<HTMLDivElement>(null);
  const activeStep = useScrollyProgress(narrativeRef);

  return (
    <Box style={{ position: 'relative' }}>
      {/* Sticky page — stays in viewport while cards scroll */}
      <Box
        className="notebook-page"
        style={{
          position: 'sticky',
          top: 48,
          height: 'calc(100vh - 48px)',
          zIndex: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Title */}
        {renderTitle()}

        {/* Card zone — narrative cards appear here */}
        <Box
          style={{
            height: '18vh',
            minHeight: 100,
            position: 'relative',
            zIndex: 1,
          }}
        />

        {/* Visualization fills remaining space */}
        <Box style={{ flex: 1, minHeight: 0 }}>
          {renderVisualization(activeStep)}
        </Box>
      </Box>

      {/* Scrollable narrative layer — positioned over the card zone */}
      <Box
        ref={narrativeRef}
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: 'calc(-100vh + 48px)',
          pointerEvents: 'none',
        }}
      >
        <Box style={{ pointerEvents: 'auto' }}>{children(activeStep)}</Box>
      </Box>
    </Box>
  );
}
