// Public API for @jordanscamp/ds.
//
// The design system is the theme + Mantine's components. Import UI from here
// (which re-exports all of @mantine/core) so apps have a single surface, and
// wrap the app in <BrandProvider> to apply the theme.

export { BrandProvider, type BrandProviderProps } from "./BrandProvider";
export { theme } from "./theme";

// The full Mantine component surface, themed.
export * from "./primitives";

// Faux-desktop chrome (Window, MenuBar, Dock, DesktopIcon) for OS-style UIs.
export * from "./desktop";
