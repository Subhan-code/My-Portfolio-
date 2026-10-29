import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { seoPlugin } from './seo.plugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      // seoPlugin: per-article pages, sitemap, robots.txt and llms.txt on every build
      plugins: [react(), seoPlugin()],
      build: {
        rollupOptions: {
          output: {
            // Long-lived vendor chunks: they change rarely, so browsers keep them cached
            manualChunks: {
              react: ['react', 'react-dom'],
              motion: ['framer-motion'],
              gsap: ['gsap'],
            },
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
