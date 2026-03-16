export interface NotebookEntry {
  title: string;
  content: string;
  type: 'poem' | 'blog' | 'note';
  date?: string;
}

export const notebookEntries: NotebookEntry[] = [
  {
    title: 'Campfire Thoughts',
    type: 'poem',
    date: '2025-01-15',
    content: `The embers drift like orange stars
above the ring of stones,
each one a tiny universe
that dies before it's known.

The wood pops — a percussion
only night can hear,
while somewhere past the treeline
a creek runs cold and clear.

I hold my knees and wonder
at the dark between the pines,
how silence can be louder
than a thousand tangled lines.`,
  },
  {
    title: 'On Making Things',
    type: 'blog',
    date: '2025-02-01',
    content: `There's a particular kind of joy in building something that doesn't need to exist. No business case, no sprint planning, no stakeholders asking for the ROI.

Just you and a blank editor and the quiet thrill of thinking: what if I could make this?

I've been building this little camping scene for weeks now. It started as a test of Three.js and turned into something I actually care about. Every object in the tent is a thing I love — the guitar, the moka pot, the notepad you're reading right now.

Maybe that's the whole point. We make things to say: this is what I notice. This is what I find beautiful.`,
  },
  {
    title: 'Grocery List (Camping)',
    type: 'note',
    date: '2025-01-20',
    content: `- Instant coffee (the good kind)
- Marshmallows
- Graham crackers + chocolate
- Trail mix
- Two cans of beans
- Sourdough bread
- Sharp cheddar
- Apples
- Water (lots)
- Bug spray
- Extra socks`,
  },
];
