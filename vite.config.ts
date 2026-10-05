import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import tailwindcss from 'tailwindcss';
import path from 'path';

export default defineConfig({
  plugins: [angular()],
  css: {
    postcss: {
      plugins: [tailwindcss()]
    }
  },
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@env': path.resolve(__dirname, 'src/environments')
    }
  },
  server: {
    port: 4200,
    proxy: {
      '/api/eia': {
        target: 'https://api.eia.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eia/, '/v2/electricity')
      }
    }
  }
});