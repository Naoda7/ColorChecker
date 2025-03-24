import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'color-name-list', // Tambahkan ini
      'color-convert'
    ]
  }
})