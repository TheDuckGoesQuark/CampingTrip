import type { Post } from "../../types/post";
import { growAndSystems } from "./growAndSystems";
import { ourDesignersWriteTheUi } from "./ourDesignersWriteTheUi";
import { whatVibeCodingChanged } from "./whatVibeCodingChanged";

/** One file per post: a body is TSX, and one growing module would make every new
 *  post a merge conflict waiting to happen. Order here doesn't matter. */
const authored: Post[] = [ourDesignersWriteTheUi, whatVibeCodingChanged, growAndSystems];

/** Every post, newest first, tags alphabetical: no feed or card sorts either. */
export const posts: Post[] = authored
  .map((post) => ({ ...post, tags: [...post.tags].sort((a, b) => a.localeCompare(b)) }))
  .sort((a, b) => b.date.localeCompare(a.date));

/** The posts the world outside the tent is told about. Same order as `posts`. */
export const published: Post[] = posts.filter((post) => !post.draft);
