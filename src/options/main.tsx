import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { OptionsApp } from "./OptionsApp";
import "../styles/ui.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <OptionsApp />
  </ErrorBoundary>
);
