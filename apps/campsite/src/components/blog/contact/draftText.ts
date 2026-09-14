/**
 * The header lines a person would otherwise retype, then the note. No `From`:
 * whichever client they paste into supplies their own address.
 */
export function draftText(to: string, subject: string, message: string): string {
  const heading = subject.trim();
  const headers = [`To: ${to}`, ...(heading === "" ? [] : [`Subject: ${heading}`])];
  return `${headers.join("\n")}\n\n${message.trim()}\n`;
}

/**
 * Absent outside a secure context, and throws when the permission is refused —
 * so this reports rather than assumes, and the caller shows a fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
