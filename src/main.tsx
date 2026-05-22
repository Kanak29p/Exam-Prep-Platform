import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { GlobalErrorBoundary } from "./components/organisms/GlobalErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
