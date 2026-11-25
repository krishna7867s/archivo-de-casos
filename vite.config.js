import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import localVault from './server/vite-vault.mjs';

export default defineConfig({
  plugins: [react(), localVault()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
