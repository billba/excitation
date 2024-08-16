import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    rollupOptions: {
      external: [
        /public\/pdfjs\/build\/.*/,
        /public\/pdfjs\/web\/.*/,
      ],
    },
  },
})
