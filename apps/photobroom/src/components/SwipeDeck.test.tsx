/**
 * @vitest-environment jsdom
 *
 * Tests for SwipeDeck component rendering.
 *
 * Note: Business logic (decisions, undo, state transitions) is thoroughly
 * tested in sweepSlice.test.ts (18 tests). These tests verify the component
 * renders the correct photo for the current state and shows appropriate
 * completion UI.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { configureStore } from '@reduxjs/toolkit';
import { sweepSlice } from '../store/sweepSlice';
import { SwipeDeck } from './SwipeDeck';
import type { ScrapedPhoto } from '../types';

const mockPhotos: ScrapedPhoto[] = [
  { id: 'a', thumbnailUrl: 'https://lh3.googleusercontent.com/a', ariaLabel: 'Photo A - Mar 27, 2024' },
  { id: 'b', thumbnailUrl: 'https://lh3.googleusercontent.com/b', ariaLabel: 'Photo B - Mar 27, 2023' },
  { id: 'c', thumbnailUrl: 'https://lh3.googleusercontent.com/c', ariaLabel: 'Photo C - Mar 27, 2022' },
];

function renderWithStore(
  preloaded?: Partial<ReturnType<typeof sweepSlice.getInitialState>>
) {
  const onComplete = vi.fn();
  const store = configureStore({
    reducer: { sweep: sweepSlice.reducer },
    preloadedState: preloaded
      ? { sweep: { ...sweepSlice.getInitialState(), ...preloaded } }
      : undefined,
  });

  render(
    <MantineProvider>
      <Provider store={store}>
        <SwipeDeck onComplete={onComplete} />
      </Provider>
    </MantineProvider>
  );

  return { store, onComplete };
}

describe('SwipeDeck', () => {
  it('renders the current photo with correct src and alt', () => {
    renderWithStore({ photos: mockPhotos });

    const imgs = screen.getAllByRole('img');
    const currentImg = imgs.find(img => img.getAttribute('alt') === 'Photo A - Mar 27, 2024');
    expect(currentImg).toBeDefined();
    expect(currentImg!.getAttribute('src')).toBe('https://lh3.googleusercontent.com/a');
  });

  it('renders the next photo behind the current card', () => {
    renderWithStore({ photos: mockPhotos });

    const imgs = screen.getAllByRole('img');
    const nextImg = imgs.find(img => img.getAttribute('alt') === 'Photo B - Mar 27, 2023');
    expect(nextImg).toBeDefined();
  });

  it('shows the second photo when currentIndex is 1', () => {
    renderWithStore({
      photos: mockPhotos,
      decisions: { a: 'keep' },
      currentIndex: 1,
    });

    const imgs = screen.getAllByRole('img');
    // Photo B should be present as the current card
    const currentImg = imgs.find(img => img.getAttribute('alt') === 'Photo B - Mar 27, 2023');
    expect(currentImg).toBeDefined();
    // Photo C should be present as the next card
    const nextImg = imgs.find(img => img.getAttribute('alt') === 'Photo C - Mar 27, 2022');
    expect(nextImg).toBeDefined();
  });

  it('shows completion screen with correct stats when all photos are swiped', () => {
    renderWithStore({
      photos: mockPhotos,
      decisions: { a: 'keep', b: 'trash', c: 'keep' },
      currentIndex: 3,
    });

    expect(screen.getByText('All done!')).toBeInTheDocument();
    expect(screen.getByText(/1 to trash/)).toBeInTheDocument();
    expect(screen.getByText(/2 to keep/)).toBeInTheDocument();
  });

  it('shows completion screen with all-keep stats', () => {
    renderWithStore({
      photos: mockPhotos,
      decisions: { a: 'keep', b: 'keep', c: 'keep' },
      currentIndex: 3,
    });

    expect(screen.getByText(/0 to trash/)).toBeInTheDocument();
    expect(screen.getByText(/3 to keep/)).toBeInTheDocument();
  });

  it('shows completion screen with all-trash stats', () => {
    renderWithStore({
      photos: mockPhotos,
      decisions: { a: 'trash', b: 'trash', c: 'trash' },
      currentIndex: 3,
    });

    expect(screen.getByText(/3 to trash/)).toBeInTheDocument();
    expect(screen.getByText(/0 to keep/)).toBeInTheDocument();
  });

  it('renders review button on completion screen', () => {
    renderWithStore({
      photos: mockPhotos,
      decisions: { a: 'keep', b: 'trash', c: 'keep' },
      currentIndex: 3,
    });

    const reviewElements = screen.getAllByText(/Review decisions/i);
    expect(reviewElements.length).toBeGreaterThan(0);
  });
});
