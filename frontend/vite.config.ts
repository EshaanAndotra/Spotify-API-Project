import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Backend lives at http://127.0.0.1:8000 and has CORS configured, so direct
// calls work. Keeping the Vite dev server on the fixed port 5173 that the
// backend's CORS allowlist expects.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});
