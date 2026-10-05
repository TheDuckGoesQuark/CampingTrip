import type { Issue } from "../../types/newsletter";
import { ourDesignersWriteTheUi } from "../posts/ourDesignersWriteTheUi";
import { whatVibeCodingChanged } from "../posts/whatVibeCodingChanged";

export const trailheadNewsletter: Issue = {
  subject: "Trailhead Newsletter",
  date: "2026-09-30",
  draft: true,
  note: [
    "Hello! I'm really honoured that you've given my thoughts a place in your inbox. The next time I have one I think worth your time, you'll know right away.",
    "Below are some recent posts that should validate your decision to follow along:",
  ],
  posts: [whatVibeCodingChanged, ourDesignersWriteTheUi],
};
