import { MenuBar } from "@jordanscamp/ds";
import { Moon, Sun } from "@jordanscamp/ds/icons";

import { playSoftClick } from "../../audio/soundEffects";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useSessionStore, type Appearance } from "../../store/sessionStore";
import { MENU_GLYPH_PX } from "./menuGlyph";

const CHOICES: readonly { value: Appearance; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/**
 * Light, dark, or whichever the OS is in. The glyph shows the scheme in effect
 * rather than the choice, so `System` reads as a sun or a moon like the others.
 */
export default function AppearanceMenu() {
  const appearance = useSessionStore((s) => s.appearance);
  const setAppearance = useSessionStore((s) => s.setAppearance);
  const scheme = useColorScheme();
  const Glyph = scheme === "dark" ? Moon : Sun;

  const choose = (next: Appearance) => {
    playSoftClick();
    setAppearance(next);
  };

  return (
    <MenuBar.Menu
      ariaLabel={`Appearance — ${scheme}`}
      label={<Glyph size={MENU_GLYPH_PX} aria-hidden />}
    >
      <MenuBar.RadioGroup ariaLabel="Appearance" value={appearance} onValueChange={choose}>
        {CHOICES.map(({ value, label }) => (
          <MenuBar.RadioItem key={value} value={value}>
            {label}
          </MenuBar.RadioItem>
        ))}
      </MenuBar.RadioGroup>
    </MenuBar.Menu>
  );
}
