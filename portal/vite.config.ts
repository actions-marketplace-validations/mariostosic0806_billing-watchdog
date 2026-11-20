import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function injectWatchdogKernel(): Plugin {
  const kernelPath = path.resolve(__dirname, "kernel/watchdog-kernel.js");
  return {
    name: "inject-watchdog-kernel",
    configureServer(server) {
      server.watcher.add(kernelPath);
      server.watcher.on("change", (changed) => {
        if (path.resolve(changed) === kernelPath) {
          server.ws.send({ type: "full-reload" });
        }
      });
    },
    transformIndexHtml(html) {
      const kernel = fs.readFileSync(kernelPath, "utf8");
      if (/<\/script/i.test(kernel)) {
        throw new Error(
          "Security/Parser invariant violation: portal/kernel/watchdog-kernel.js must not contain </script>."
        );
      }
      const placeholder = "<!-- __WATCHDOG_KERNEL__ -->";
      if (!html.includes(placeholder)) {
        throw new Error("portal/index.html is missing <!-- __WATCHDOG_KERNEL__ --> marker.");
      }
      return html.replace(placeholder, `<script>\n${kernel}\n  </script>`);
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), injectWatchdogKernel()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "motion", "lucide-react", "@number-flow/react"],
        },
      },
    },
  },
});
