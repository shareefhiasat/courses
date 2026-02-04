import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ui': path.resolve(__dirname, './src/components/ui'),
      '@common': path.resolve(__dirname, './src/components/common'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@firebaseServices': path.resolve(__dirname, './src/firebaseServices'),
      '@constants': path.resolve(__dirname, './src/constants'),
    },
  },
  server: {
    host: true, // listen on all interfaces
    port: 5174, // pick a fixed port
    strictPort: false, // fall back only if taken
    https: {
      key: './localhost+2-key.pem',
      cert: './localhost+2.pem'
    },
    allowedHosts: ["novel-terrier-firmly.ngrok-free.app", "localhost", "127.0.0.1", "192.168.1.7"],
    // Optional: if HMR has issues over LAN, set your LAN IP below:
    // hmr: { host: '192.168.1.7', protocol: 'ws', port: 5174 }
  },
});
