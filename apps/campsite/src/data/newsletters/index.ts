import type { Issue } from "../../types/newsletter";
import { twoPostsAndATent } from "./twoPostsAndATent";

/** One file per issue, as with posts. Newest first. */
export const issues: Issue[] = [twoPostsAndATent].sort((a, b) => b.date.localeCompare(a.date));

/** The issues the world outside the tent is shown. Same order as `issues`. */
export const sentIssues: Issue[] = issues.filter((issue) => issue.sentOn !== undefined);
