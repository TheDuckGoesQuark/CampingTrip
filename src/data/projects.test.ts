import { describe, it, expect } from 'vitest';
import { projects } from './projects';
import type { Project } from '../types/project';

describe('projects data', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it('each project has the required fields', () => {
    for (const project of projects) {
      expect(project).toHaveProperty('title');
      expect(project).toHaveProperty('url');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('year');
    }
  });

  it('each project has valid types', () => {
    for (const project of projects) {
      expect(typeof project.title).toBe('string');
      expect(typeof project.url).toBe('string');
      expect(typeof project.description).toBe('string');
      expect(typeof project.year).toBe('number');
    }
  });

  it('project URLs are valid', () => {
    for (const project of projects) {
      expect(project.url).toMatch(/^https?:\/\//);
    }
  });

  it('project years are reasonable', () => {
    for (const project of projects) {
      expect(project.year).toBeGreaterThanOrEqual(2000);
      expect(project.year).toBeLessThanOrEqual(new Date().getFullYear() + 1);
    }
  });
});
