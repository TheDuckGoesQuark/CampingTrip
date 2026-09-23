import { Link } from "@jordanscamp/ds";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

import { SITE_ORIGIN } from "../../data/site";
import { useRenderTarget } from "../../prerender/renderTarget";

export interface SiteLinkProps {
  to: string;
  children: ReactNode;
}

/**
 * A link to another page of this site. The scriptless copy carries the origin,
 * because the CV's PDF is printed from that copy against a preview server whose
 * address means nothing to a reader; the app's own copy routes in place.
 */
export default function SiteLink({ to, children }: SiteLinkProps) {
  return useRenderTarget() === "static" ? (
    <Link href={`${SITE_ORIGIN}${to}`}>{children}</Link>
  ) : (
    <Link render={<RouterLink to={to} />}>{children}</Link>
  );
}
