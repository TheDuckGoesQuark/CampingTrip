import { Navigate, Route, Routes } from "react-router-dom";

import SceneRoot from "./components/SceneRoot";
import { BlogRoute, Landing, MusicRoute, NotesRoute } from "./routing/OverlayRoutes";

/**
 * Declarative routing: the URL is the single source of truth for what's open.
 * <SceneRoot> is the always-mounted tent layout; each child route declares the
 * overlay it opens. No bidirectional store↔URL syncing.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SceneRoot />}>
        <Route index element={<Landing />} />
        <Route path="blog/*" element={<BlogRoute />} />
        <Route path="music" element={<MusicRoute />} />
        <Route path="notes" element={<NotesRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
