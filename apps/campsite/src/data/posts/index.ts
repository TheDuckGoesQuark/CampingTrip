import type { Post } from "../../types/post";
import { growAndSystems } from "./growAndSystems";
import { recordsForBuildingATentTo } from "./recordsForBuildingATentTo";
import { whatVibeCodingChanged } from "./whatVibeCodingChanged";

/** One file per post: a body is TSX, and one growing module would make every new
 *  post a merge conflict waiting to happen. Order here doesn't matter. */
const authored: Post[] = [whatVibeCodingChanged, growAndSystems, recordsForBuildingATentTo];

/** Every post, newest first — the order every feed shows them in, so no caller sorts. */
export const posts: Post[] = [...authored].sort((a, b) => b.date.localeCompare(a.date));
