/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'XXL Groeimaat',
        short_name: 'Groeimaat',
        description: 'Weet binnen 3 minuten welk XXL-product en welke smaak bij je past. Concept, geen officiële app van XXL Nutrition.',
        lang: 'nl',
        start_url: '/',
        display: 'standalone',
        // Manifest ondersteunt geen CSS-variabelen: dit zijn xxl-black en xxl-grey uit src/index.css.
        theme_color: '#1a1a1a',
        background_color: '#f5f5f5',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
