import { Link } from "@jordanscamp/ds";
import type { ReactNode } from "react";

import { useDocumentId } from "../../prerender/renderTarget";
import { roleAnchorId } from "../../utils/roleAnchor";

export default function RoleAnchorLink({ org, children }: { org: string; children: ReactNode }) {
  const anchor = useDocumentId(roleAnchorId(org));
  return <Link href={`#${anchor}`}>{children}</Link>;
}
