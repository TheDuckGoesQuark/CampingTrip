import type { ReactNode } from 'react';

export interface Project {
  title: string;
  url: string;
  description: string | ReactNode;
  year: number;
  icon: string;
  color?: string;
  github?: string;
}
