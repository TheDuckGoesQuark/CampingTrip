import { forwardRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Box, Text } from '@mantine/core';
import type { ScrapedPhoto } from '../types';

/** Minimum drag distance (px) to trigger a decision. */
const SWIPE_THRESHOLD = 100;
/** Velocity (px/s) that also triggers a decision even if threshold not met. */
const VELOCITY_THRESHOLD = 500;

export interface SwipeCardProps {
  photo: ScrapedPhoto;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  /** Whether this card is the top (active) card vs a background card. */
  isTop?: boolean;
}

export const SwipeCard = forwardRef<HTMLDivElement, SwipeCardProps>(
  function SwipeCard({ photo, onSwipe, isTop = false }, ref) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
    const opacity = useTransform(
      x,
      [-300, -100, 0, 100, 300],
      [0.5, 1, 1, 1, 0.5]
    );

    // Overlay indicators
    const keepOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
    const trashOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
    const skipOpacity = useTransform(y, [-SWIPE_THRESHOLD, 0], [1, 0]);

    const [imgError, setImgError] = useState(false);

    function handleDragEnd(_: unknown, info: PanInfo) {
      const { offset, velocity } = info;

      // Check vertical swipe (up = skip) first
      if (
        offset.y < -SWIPE_THRESHOLD ||
        velocity.y < -VELOCITY_THRESHOLD
      ) {
        onSwipe('up');
        return;
      }

      if (
        offset.x > SWIPE_THRESHOLD ||
        velocity.x > VELOCITY_THRESHOLD
      ) {
        onSwipe('right');
        return;
      }

      if (
        offset.x < -SWIPE_THRESHOLD ||
        velocity.x < -VELOCITY_THRESHOLD
      ) {
        onSwipe('left');
        return;
      }

      // Snap back — framer-motion handles this via dragSnapToOrigin
    }

    return (
      <motion.div
        ref={ref}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          x,
          y,
          rotate,
          opacity,
          cursor: isTop ? 'grab' : 'default',
          touchAction: 'none',
        }}
        drag={isTop}
        dragSnapToOrigin
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5 }}
        animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
        exit={{
          opacity: 0,
          transition: { duration: 0.2 },
        }}
      >
        <Box
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 'var(--mantine-radius-lg)',
            overflow: 'hidden',
            position: 'relative',
            background: 'var(--mantine-color-dark-7)',
          }}
        >
          {/* Photo */}
          {!imgError ? (
            <img
              src={photo.thumbnailUrl}
              alt={photo.ariaLabel}
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: 'var(--mantine-color-dark-8)',
              }}
              draggable={false}
            />
          ) : (
            <Box
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--mantine-color-dark-8)',
              }}
            >
              <Text c="dimmed" size="sm">
                Image unavailable
              </Text>
            </Box>
          )}

          {/* Date label */}
          {photo.ariaLabel && (
            <Box
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '24px 16px 12px',
                background:
                  'linear-gradient(transparent, rgba(0,0,0,0.7))',
              }}
            >
              <Text size="sm" c="white" fw={500}>
                {photo.ariaLabel}
              </Text>
            </Box>
          )}

          {/* Keep indicator (right swipe) */}
          {isTop && (
            <motion.div
              style={{
                position: 'absolute',
                top: 24,
                left: 24,
                opacity: keepOpacity,
                border: '3px solid #40c057',
                borderRadius: 8,
                padding: '4px 12px',
                transform: 'rotate(-15deg)',
              }}
            >
              <Text size="xl" fw={700} c="#40c057">
                KEEP
              </Text>
            </motion.div>
          )}

          {/* Trash indicator (left swipe) */}
          {isTop && (
            <motion.div
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                opacity: trashOpacity,
                border: '3px solid #fa5252',
                borderRadius: 8,
                padding: '4px 12px',
                transform: 'rotate(15deg)',
              }}
            >
              <Text size="xl" fw={700} c="#fa5252">
                TRASH
              </Text>
            </motion.div>
          )}

          {/* Skip indicator (up swipe) */}
          {isTop && (
            <motion.div
              style={{
                position: 'absolute',
                bottom: 60,
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: skipOpacity,
                border: '3px solid #868e96',
                borderRadius: 8,
                padding: '4px 12px',
              }}
            >
              <Text size="xl" fw={700} c="#868e96">
                SKIP
              </Text>
            </motion.div>
          )}
        </Box>
      </motion.div>
    );
  }
);
