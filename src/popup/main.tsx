import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { PopupApp } from "./PopupApp";
import "../styles/ui.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary compact>
    <PopupApp />
  </ErrorBoundary>
);
