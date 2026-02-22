export interface Song {
  title: string;
  artist: string;
  src: string;
}

export const songs: Song[] = [
  {
    title: 'Late Night Drive',
    artist: 'Jordan',
    src: 'audio/songs/late-night-drive.mp3',
  },
  {
    title: 'Campfire Loop',
    artist: 'Jordan',
    src: 'audio/songs/campfire-loop.mp3',
  },
  {
    title: 'Morning Fog',
    artist: 'Jordan',
    src: 'audio/songs/morning-fog.mp3',
  },
];
