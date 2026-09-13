import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: { site: 'index.html', admin: 'admin.html' }
    }
  }
});
