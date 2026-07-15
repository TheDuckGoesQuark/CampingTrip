import { BrandProvider } from "@jordanscamp/ds";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "@jordanscamp/ds/tokens.css";
import "./styles/global.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <BrandProvider>
        <App />
      </BrandProvider>
    </BrowserRouter>
  </StrictMode>,
);
