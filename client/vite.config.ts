import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    process.env.ANALYZE === 'true' && visualizer({
      open: true,
      filename: 'dist/bundle-report.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ui': path.resolve(__dirname, './src/components/ui'),
      '@common': path.resolve(__dirname, './src/components/common'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@types': path.resolve(__dirname, './src/types'),
      '@components': path.resolve(__dirname, './src/components'),
      '@api': path.resolve(__dirname, './src/services/api/index.js'),
      '@logger': path.resolve(__dirname, './src/services/utils/logger.js'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase — catch both firebase/ and @firebase/ internal packages
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            if (id.includes('firestore')) return 'vendor-firebase-firestore';
            if (id.includes('auth')) return 'vendor-firebase-auth';
            if (id.includes('functions')) return 'vendor-firebase-functions';
            if (id.includes('storage')) return 'vendor-firebase-storage';
            if (id.includes('database') || id.includes('rtdb')) return 'vendor-firebase-database';
            return 'vendor-firebase-core';
          }
          // MUI + Emotion — large, rarely changes
          if (id.includes('node_modules/@mui/') || id.includes('node_modules/@emotion/')) return 'vendor-mui';
          // Framer Motion
          if (id.includes('node_modules/framer-motion')) return 'vendor-framer';
          // Recharts + d3
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) return 'vendor-charts';
          // React core
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/scheduler')) return 'vendor-react';
          // React Router
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) return 'vendor-router';
          // PDF / canvas heavy libs
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) return 'vendor-pdf';
          // QR libs
          if (id.includes('node_modules/qrcode') || id.includes('node_modules/jsqr') || id.includes('node_modules/html5-qrcode') || id.includes('node_modules/react-qr')) return 'vendor-qr';
          // Quill rich text editor
          if (id.includes('node_modules/quill') || id.includes('node_modules/react-quill')) return 'vendor-editor';
          // Date libs
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/moment')) return 'vendor-date';
          // Analytics / monitoring (defer-able, never on critical path)
          if (id.includes('node_modules/@sentry')) return 'vendor-monitoring';
          // Calendar / grid layout
          if (id.includes('node_modules/react-big-calendar') || id.includes('node_modules/react-grid-layout')) return 'vendor-layout';
          // Lucide icons
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          // CSV / data processing
          if (id.includes('node_modules/papaparse')) return 'vendor-data';
          // Emoji picker
          if (id.includes('node_modules/emoji-picker-react') || id.includes('node_modules/@emoji-mart')) return 'vendor-emoji';
          // Sentry / DOMPurify / misc small
          if (id.includes('node_modules/dompurify')) return 'vendor-security';
          // Remaining node_modules → general vendor
          if (id.includes('node_modules/')) return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: true, // listen on all interfaces
    port: 5174, // pick a fixed port
    strictPort: false, // fall back only if taken
    https: {
      key: './localhost-key.pem',
      cert: './localhost-cert.pem'
    },
    allowedHosts: ['all'],
    // Optional: if HMR has issues over LAN, set your LAN IP below:
    // hmr: { host: '192.168.1.7', protocol: 'ws', port: 5174 },
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    'import.meta.env.COLLABORA_URL': JSON.stringify(process.env.COLLABORA_URL || 'http://localhost:9980'),
  },
});
