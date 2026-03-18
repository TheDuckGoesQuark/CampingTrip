import type { Project } from './types';

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    label: 'P\u2081',
    name: 'Work',
    color: '#2c3e6b',
    tasks: [
      { id: 'w1', name: 'Code review', project: 'p1', duration: 30, priority: 2 },
      { id: 'w2', name: 'Write tests', project: 'p1', duration: 60, priority: 3 },
      { id: 'w3', name: 'Reply emails', project: 'p1', duration: 15, priority: 1 },
      { id: 'w4', name: 'Deploy fix', project: 'p1', duration: 20, priority: 1 },
    ],
  },
  {
    id: 'p2',
    label: 'P\u2082',
    name: 'Personal',
    color: '#8b4513',
    tasks: [
      { id: 'h1', name: 'Groceries', project: 'p2', duration: 45, priority: 2 },
      { id: 'h2', name: 'Cook dinner', project: 'p2', duration: 40, priority: 3 },
      { id: 'h3', name: 'Call mum', project: 'p2', duration: 20, priority: 2 },
    ],
  },
  {
    id: 'p3',
    label: 'P\u2083',
    name: 'Health',
    color: '#2d6a4f',
    tasks: [
      { id: 'f1', name: 'Gym', project: 'p3', duration: 60, priority: 3, recurring: true },
      { id: 'f2', name: 'Meal prep', project: 'p3', duration: 30, priority: 4 },
    ],
  },
  {
    id: 'p4',
    label: 'P\u2084',
    name: 'Admin',
    color: '#7b2d8b',
    tasks: [
      { id: 'a1', name: 'Pay bills', project: 'p4', duration: 10, priority: 1, deadline: 'hard' },
      { id: 'a2', name: 'Tax return', project: 'p4', duration: 120, priority: 2, deadline: 'soft' },
      { id: 'a3', name: 'Insurance', project: 'p4', duration: 15, priority: 4 },
    ],
  },
];

export const PROJECT_MAP = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
