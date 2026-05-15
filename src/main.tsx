
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { GlobalErrorBoundary } from "./app/components/GlobalErrorBoundary.tsx";

  createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
  <App />
  </GlobalErrorBoundary>
);
  