import { Button, Center, Group, Paper } from "@jordanscamp/ds";
import { useLocation } from "react-router-dom";

import { OVERLAY_LINKS } from "../../routing/overlays";
import { useSceneNavigate } from "../../routing/useSceneNavigate";
import { useInteractionStore } from "../../store/interactionStore";

/**
 * Top-of-screen tab bar mirroring the openable overlays. Built from DS/Mantine
 * building blocks (Center + Paper + Group + Button) so it inherits the brand
 * theme — no bespoke CSS. Hovering/focusing a tab glows its 3D object (shared
 * interaction id); activating flies in and updates the URL. Real anchors, so they
 * deep-link and middle-click like normal links.
 */
export default function OverlayTabBar() {
  const location = useLocation();
  const navigateWithFocus = useSceneNavigate();
  const setHovered = useInteractionStore((s) => s.setHovered);
  const setFocused = useInteractionStore((s) => s.setFocused);

  return (
    <Center
      component="nav"
      aria-label="Places in the tent"
      pos="fixed"
      top={16}
      left={0}
      right={0}
      style={{ zIndex: 60, pointerEvents: "none" }}
    >
      <Paper radius="xl" p={4} shadow="sm" withBorder style={{ pointerEvents: "auto" }}>
        <Group gap={4}>
          {OVERLAY_LINKS.map((link) => {
            const active = location.pathname.startsWith(link.path);
            return (
              <Button
                key={link.path}
                component="a"
                href={link.path}
                size="sm"
                radius="xl"
                variant={active ? "light" : "subtle"}
                color={active ? undefined : "gray"}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  // Let the browser handle modified clicks (open in new tab, etc.)
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  navigateWithFocus(link);
                }}
                onMouseEnter={() => setHovered(link.objectId)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setFocused(link.objectId)}
                onBlur={() => setFocused(null)}
              >
                {link.label}
              </Button>
            );
          })}
        </Group>
      </Paper>
    </Center>
  );
}
