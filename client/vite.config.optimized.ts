import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Optimized Vite configuration for performance
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    strictPort: false,
    allowedHosts: ["novel-terrier-firmly.ngrok-free.app"],
  },
  build: {
    // Enable source maps for debugging (disable in production)
    sourcemap: false,
    
    // Optimize chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-firebase': ['firebase'],
          'vendor-ui': ['@mui/material', '@mui/x-data-grid'],
          'vendor-utils': ['date-fns', 'papaparse', 'jspdf'],
          'vendor-icons': ['lucide-react'],
          
          // Feature chunks
          'feature-charts': ['recharts'],
          'feature-editor': ['quill', 'html2canvas'],
          'feature-qr': ['qrcode', 'html5-qrcode'],
          'feature-email': ['framer-motion', 'dompurify'],
        },
        
        // Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `media/[name]-[hash][extname]`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `${ext}/[name]-[hash][extname]`;
        },
      },
    },
    
    // Optimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Set reasonable chunk size limit
    chunkSizeWarningLimit: 1000,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'lucide-react',
    ],
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  
  // Environment variables
  envPrefix: 'VITE_',
});
