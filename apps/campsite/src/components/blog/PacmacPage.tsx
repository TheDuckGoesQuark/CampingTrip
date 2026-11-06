import { Text } from "@jordanscamp/ds";

import { Island } from "./Island";

/** Module scope, so the Island's memoised `lazy` sees one loader for its life. */
const loadGame = () => import("../pacmac/MacMan");

/** The game's tab. Its code is a chunk of its own, fetched only when this tab opens. */
export default function PacmacPage() {
  return <Island load={loadGame} fallback={<Text variant="body">Loading MacMan…</Text>} />;
}
