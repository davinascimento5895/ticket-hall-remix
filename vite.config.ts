import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Plugin: injeta <link rel="preconnect"> ao Supabase no HTML de produção.
function supabasePreconnect(supabaseUrl?: string): PluginOption {
  return {
    name: "supabase-preconnect",
    transformIndexHtml(html) {
      if (!supabaseUrl) return html;
      return html.replace(
        "</head>",
        `  <link rel="preconnect" href="${supabaseUrl}" crossorigin />\n  <link rel="dns-prefetch" href="${supabaseUrl}" />\n  </head>`
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: false,
    },
    plugins: [
      react(),
      supabasePreconnect(env.VITE_SUPABASE_URL),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Não pré-carregar vendor-recharts (383KB) e vendor-framer (134KB) no HTML.
      // Esses chunks são usados apenas em páginas específicas (producer dashboard, animações)
      // e serão baixados sob demanda quando necessários.
      modulePreload: {
        resolveDependencies: (_filename, deps) => {
          return deps.filter(
            (dep) =>
              !dep.includes("vendor-recharts") &&
              !dep.includes("vendor-framer")
          );
        },
      },
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
  };
});
