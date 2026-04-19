import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("[Main] Root mounting App...");
createRoot(document.getElementById("root")!).render(<App />);
