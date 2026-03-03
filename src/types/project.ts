import type { ReactNode } from 'react';

export interface Project {
  title: string;
  url: string;
  description: string | ReactNode;
  year: number;
  icon: string;
  color?: string;
  github?: string;
  addedAt?: string;   // ISO date string for "new" badge
  updatedAt?: string; // ISO date string for "updated" badge
}

export interface Bookmark {
  title: string;
  url: string;
  blurb: string;
  icon: string;
  color?: string;
  addedAt?: string;   // ISO date string for "new" badge
}
