import type { Issue } from "../../types/newsletter";
import { ourDesignersWriteTheUi } from "../posts/ourDesignersWriteTheUi";
import { whatVibeCodingChanged } from "../posts/whatVibeCodingChanged";

export const twoPostsAndATent: Issue = {
  subject: "Two posts and a tent",
  date: "2026-09-30",
  draft: true,
  note: [
    "Hello. You asked to hear when something new lands at the camp, and two things already have.",
    "Below is what each is about, and a link. That is the whole format, and I will never send more than this.",
  ],
  posts: [whatVibeCodingChanged, ourDesignersWriteTheUi],
};
