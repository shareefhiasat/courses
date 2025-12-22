import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on all interfaces
    port: 5174, // pick a fixed port
    strictPort: false, // fall back only if taken
    allowedHosts: ["novel-terrier-firmly.ngrok-free.app"],
    // Optional: if HMR has issues over LAN, set your LAN IP below:
    // hmr: { host: '192.168.1.7', protocol: 'ws', port: 5174 }
  },
});
