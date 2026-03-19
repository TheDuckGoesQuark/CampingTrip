import { Box, Stack, Text } from '@mantine/core';
import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import '../pages/scheduling/notebook.css';

const INK = '#2c3e6b';
const INK_LIGHT = '#5a7299';

interface ScrollyLayoutProps {
  title: string;
  subtitle: string;
  visualization: (scrollProgress: number) => ReactNode;
  children: ReactNode;
}

/**
 * Scrollytelling layout with scroll-driven card transforms.
 *
 * Cards are absolutely positioned in an overlay on top of the sticky viz.
 * A scroll track (invisible tall div) creates scroll distance. Scroll
 * position maps to a progress value (0..cardCount-1), which drives each
 * card's translateY and opacity — all derived from the overlay container's
 * measured height, no magic viewport fractions.
 *
 * The last child is treated as a "takeover" card — it fills the entire
 * viewport and slides up over the visualization.
 */
export function ScrollyLayout({
  title,
  subtitle,
  visualization,
  children,
}: ScrollyLayoutProps) {
  const cards = Children.toArray(children);
  const cardCount = cards.length;
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerH = useRef(600);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const track = scrollTrackRef.current;
    if (!track) return;

    function onScroll() {
      if (overlayRef.current) {
        containerH.current = overlayRef.current.clientHeight;
      }

      const rect = track!.getBoundingClientRect();
      const scrolled = Math.max(0, -rect.top);
      const scrollRange = track!.clientHeight - window.innerHeight;
      if (scrollRange <= 0) return;

      const progress = (scrolled / scrollRange) * (cardCount - 1);
      setScrollProgress(Math.max(0, Math.min(cardCount - 1, progress)));
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [cardCount]);

  const h = containerH.current;

  return (
    <Box style={{ position: 'relative', backgroundColor: '#f5f0e4' }}>
      {/* Sticky viz with card overlay */}
      <Stack
        className="notebook-page"
        gap={0}
        style={{
          position: 'sticky',
          top: 48,
          height: 'calc(100vh - 48px)',
          overflow: 'hidden',
        }}
      >
        <Box ta="center" py="sm">
          <Text
            fw={700}
            style={{ fontSize: 34, color: INK, fontFamily: "'Caveat', cursive" }}
          >
            {title}
          </Text>
          <Text
            style={{ fontSize: 15, color: INK_LIGHT, fontFamily: "'Caveat', cursive" }}
          >
            {subtitle}
          </Text>
        </Box>

        <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          {visualization(scrollProgress)}

          {/* Card overlay — absolutely positioned over the viz */}
          <div
            ref={overlayRef}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            {cards.map((card, i) => {
              const isLast = i === cardCount - 1;
              const offset = i - scrollProgress;

              if (isLast) {
                // Takeover card: full viewport, slides up from below, stays put once reached
                const translateY = Math.max(0, offset * h * 1.2);
                const opacity = offset > 0 ? Math.max(0, 1 - offset) : 1;

                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      transform: `translateY(${translateY}px)`,
                      opacity,
                      pointerEvents: opacity > 0.3 ? 'auto' : 'none',
                      zIndex: 4,
                    }}
                  >
                    {card}
                  </div>
                );
              }

              const translateY = offset * h * 1.2;
              // Fade in from below, but stay fully opaque when leaving upward
              const opacity = offset > 0 ? Math.max(0, 1 - offset) : 1;

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translateY(${translateY}px)`,
                    opacity,
                    pointerEvents: opacity > 0.3 ? 'auto' : 'none',
                    width: '90%',
                    maxWidth: 500,
                    zIndex: 3,
                  }}
                >
                  {card}
                </div>
              );
            })}
          </div>
        </Box>
      </Stack>

      {/* Scroll track — invisible div that creates scroll distance */}
      <div
        ref={scrollTrackRef}
        style={{
          position: 'relative',
          marginTop: 'calc(-100vh + 48px)',
          height: `${Math.max(2, cardCount) * 200}vh`,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}
