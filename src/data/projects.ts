import type { Project } from '../types/project';

export const projects: Project[] = [
  {
    title: 'Camping Trip',
    url: 'https://jordanscamp.site/',
    description:
      'A cosy little corner of the internet I built for myself. Part portfolio, part business card, part art project \u2014 mostly an excuse to learn React Three Fiber and see if I could make a tent feel like home. Pull up a seat, poke around, and if you\u2019re curious how it all works the code\u2019s on GitHub: github.com/TheDuckGoesQuark/CampingTrip',
    year: 2025,
    icon: 'images/projects/campingtrip.png',
    color: '#4a9eff',
  },
  {
    title: 'CatMap',
    url: 'https://catmaps.me',
    description: 'Identifying and helping track down missing pets.',
    year: 2026,
    icon: 'images/projects/catmap.jpg',
    color: '#1a1a1a',
  },
];
