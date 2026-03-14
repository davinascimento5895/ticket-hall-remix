import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom")) return "vendor-react";
          if (id.includes("node_modules/react-router")) return "vendor-react";
          if (id.includes("node_modules/@supabase")) return "vendor-supabase";
          if (id.includes("node_modules/@tanstack")) return "vendor-query";
          if (id.includes("node_modules/recharts")) return "vendor-recharts";
          if (id.includes("node_modules/framer-motion")) return "vendor-framer";
          if (id.includes("node_modules/html5-qrcode")) return "vendor-qrcode";
          if (id.includes("node_modules/date-fns")) return "vendor-date";
          if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
        },
      },
    },
  },
}));
