import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // See https://github.com/vitejs/vite/issues/16522.
    host: "127.0.0.1",
  },
});
