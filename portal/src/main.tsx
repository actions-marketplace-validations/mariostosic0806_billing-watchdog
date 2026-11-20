import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig, LazyMotion, domAnimation } from "motion/react";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/newsreader/600.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App";
import "./index.css";

// Signal canonical kernel that React now owns #root DOM updates (prevents imperative innerHTML collisions)
window.__WATCHDOG_REACT_MOUNTED__ = true;

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          <TooltipProvider delayDuration={180}>
            <App />
          </TooltipProvider>
        </LazyMotion>
      </MotionConfig>
    </StrictMode>
  );
}
