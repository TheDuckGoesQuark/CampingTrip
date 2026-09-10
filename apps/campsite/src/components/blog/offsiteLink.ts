/** A `mailto:` gets neither: a mail client in a new tab leaves an empty one behind. */
export function offsiteLinkProps(url: string): { target?: string; rel?: string } {
  return url.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" };
}
