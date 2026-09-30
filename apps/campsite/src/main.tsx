import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "@jordanscamp/ds/tokens.css";
import "./styles/global.css";
import PageViews from "./analytics/PageViews";
import App from "./App";
import Brand from "./components/Brand";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <PageViews />
      <Brand>
        <App />
      </Brand>
    </BrowserRouter>
  </StrictMode>,
);
