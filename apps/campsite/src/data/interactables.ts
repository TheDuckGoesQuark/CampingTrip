/**
 * The single source of truth for the scene's interactive objects and their
 * accessibility metadata. Imported by the a11y toolbar (InteractionOverlay) and
 * anywhere that needs a label/description for an object id, so the id list can't
 * drift across the codebase.
 *
 * Order = Tab order through the scene.
 */
export interface Interactable {
  /** Matches the `id` on the object's <InteractiveObject> / self-wired handler. */
  id: string;
  /** Accessible name (aria-label / screen-reader announcement). */
  label: string;
  /** Extra context, e.g. for decorative/informational objects. */
  description?: string;
  /** Whether Enter/Space triggers an action (false = informational only). */
  actionable: boolean;
}

export const INTERACTABLES: Interactable[] = [
  { id: "guitar", label: "Guitar", description: "Strum a chord", actionable: true },
  { id: "laptop", label: "Laptop — turn the screen on or off", actionable: true },
  {
    id: "projects",
    label: "Open the blog",
    description: "Opens the laptop's CatOS blog of projects and notes",
    actionable: true,
  },
  {
    id: "moka-pot",
    label: "Moka pot",
    description: "A stovetop coffee maker. Decorative.",
    actionable: false,
  },
  {
    id: "scarlett",
    label: "Scarlett Solo audio interface",
    description: "Part of the music setup. Decorative.",
    actionable: false,
  },
  { id: "shure-mic", label: "Open the music player", actionable: true },
  { id: "midi", label: "MIDI controller — play a note", actionable: true },
  { id: "notepad", label: "Notepad — read the journal", actionable: true },
  { id: "cat", label: "Smittens the cat — say hello", actionable: true },
];
