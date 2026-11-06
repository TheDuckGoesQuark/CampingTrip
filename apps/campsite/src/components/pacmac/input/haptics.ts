/** Long enough to feel, as short as a phone keyboard's tick. */
const PULSE_MS = 8;

let iosSwitch: HTMLLabelElement | null = null;

/**
 * Safari has no Vibration API, but on iOS it ticks when a native switch
 * toggles, and a click on the switch's label from script counts while the
 * user's gesture is still live. One hidden switch, made on first use.
 */
function hiddenSwitch(): HTMLLabelElement {
  if (iosSwitch) return iosSwitch;
  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  Object.assign(label.style, {
    position: "fixed",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    opacity: "0",
    pointerEvents: "none",
  });
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  label.append(input);
  document.body.append(label);
  iosSwitch = label;
  return label;
}

/**
 * A tick under the finger. The vibration plays on the press; Safari's switch
 * only on the release, the moment iOS treats as the user's own gesture.
 */
export function tick(moment: "press" | "release"): void {
  if (typeof navigator.vibrate === "function") {
    if (moment === "press") navigator.vibrate(PULSE_MS);
    return;
  }
  if (moment !== "release") return;
  // WebKit focuses a label's control when the label is clicked; give focus back.
  const focused = document.activeElement;
  hiddenSwitch().click();
  if (focused instanceof HTMLElement && document.activeElement !== focused) {
    focused.focus({ preventScroll: true });
  }
}

/** Whether focus went to the hidden switch, which is not the player leaving the game. */
export function isHapticSwitch(target: EventTarget | null): boolean {
  return target !== null && target === iosSwitch?.querySelector("input");
}

/** For tests: forget the switch between them. */
export function resetHaptics(): void {
  iosSwitch?.remove();
  iosSwitch = null;
}
