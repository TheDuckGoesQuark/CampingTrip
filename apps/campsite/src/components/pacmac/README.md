# MacMan

The hidden game at `/blog/pacmac.html`. It loads as a chunk of its own when that
tab opens, and is never prerendered.

| Folder     | Holds                                                                               |
| ---------- | ----------------------------------------------------------------------------------- |
| `engine/`  | The rules: the maze and everything that moves on it. No React, no DOM.              |
| `render/`  | The canvas. Reads a `Scene` and draws it; never changes anything.                   |
| `sprites/` | Which PNG each entity is drawn from, and the code-drawn stand-ins for missing ones. |
| `sound/`   | What each change of state sounds like, played through the site's mute and volume.   |

The maze is `engine/maze.txt`, one character per tile:

| Character | Tile                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| `#`       | wall                                                                                                           |
| `.` `o`   | floor with a pellet, or a power pellet                                                                         |
| space     | empty floor                                                                                                    |
| `=`       | tunnel, which wraps to the other side                                                                          |
| `-`       | the ghost house door                                                                                           |
| `_`       | dead space outside the outer wall                                                                              |
| letters   | spawns, each written twice and standing between the two: `M` MacMan, `B` `P` `I` `C` the ghosts, `F` the fruit |

## Sprites

Each entity is one PNG in `apps/campsite/public/images/pacmac/`, named after its
key in `sprites/manifest.ts`. A strip runs left to right, one square cell per
frame, transparent background, drawn facing right.

| File                                               | Cell | Frames                                                       |
| -------------------------------------------------- | ---- | ------------------------------------------------------------ |
| `macman.png`                                       | 48   | 3: mouth open, half, shut. Played open, half, shut, half.    |
| `blinky.png`, `pinky.png`, `inky.png`, `clyde.png` | 48   | 2: the hem's two positions. Drawn front-on, never turned.    |
| `frightened.png`                                   | 48   | 4: two blue, then two white for the flash before recovering. |
| `eyes.png`                                         | 48   | 1, looking right; mirrored when going left.                  |
| `fruit-<name>.png`                                 | 48   | 1                                                            |

The fruit, their points and the order they appear in are `FRUITS` in
`engine/fruit.ts`; adding one is a line there and its PNG. The pellets are
always drawn in code.

A cell is three screen pixels per board pixel, so an actor's 48 covers two
8-pixel tiles. MacMan is rotated to face up or down and mirrored to face
left.

A file that is missing, or not the size its row says, is replaced by a
code-drawn placeholder, and the console names the mismatch. Until
`frightened.png` exists, a frightened ghost is its own sprite tinted blue, and
white as it recovers.

## Sound

Every sound is synthesised except the bite, which prefers Jordan's recording
of the word "macka" at `apps/campsite/public/audio/pacmac/macka.mp3`. Each
pellet plays half of it, the first half and the second in turn, so a run of
pellets says MackaMackaMacka. Until the file exists, a synthesised voice says
the two halves instead. Trim the recording so the word is centred: the split
is at the exact middle.
