import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações para SPA em produção
    rollupOptions: {
      output: {
        // Melhor organização dos assets
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Gerar source maps para debug em produção se necessário
    sourcemap: mode === 'development',
    // Otimizar tamanho do bundle
    minify: 'esbuild',
    // Aumentar limite de aviso para bundles grandes
    chunkSizeWarningLimit: 1000,
  },
  // Configuração para preview (teste local do build)
  preview: {
    port: 4173,
    host: true,
  },
}));
