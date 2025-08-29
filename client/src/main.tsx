import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handling to prevent crashes
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  event.preventDefault(); // Prevent browser default error handling
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent browser default rejection handling
});

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
