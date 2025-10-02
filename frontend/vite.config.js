// File: frontend/vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Use VITE_BACKEND_ORIGIN for the dev proxy target.
// In Docker:  http://backend:5500
// Local dev:  http://localhost:5500
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_BACKEND_ORIGIN || "http://localhost:5500";

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
    },
  };
});
