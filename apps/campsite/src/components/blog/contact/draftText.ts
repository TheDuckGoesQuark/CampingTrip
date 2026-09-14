/**
 * The header lines a person would otherwise retype, then the note. No `From`:
 * whichever client they paste into supplies their own address.
 */
export function draftText(to: string, subject: string, message: string): string {
  const heading = subject.trim();
  const headers = [`To: ${to}`, ...(heading === "" ? [] : [`Subject: ${heading}`])];
  return `${headers.join("\n")}\n\n${message.trim()}\n`;
}
