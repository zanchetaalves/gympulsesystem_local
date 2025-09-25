// vite.config.ts
import { defineConfig } from "file:///C:/Projetos_Particulares/gym-pulse-system/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Projetos_Particulares/gym-pulse-system/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Projetos_Particulares/gym-pulse-system/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Projetos_Particulares\\gym-pulse-system";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Otimizações para SPA em produção
    rollupOptions: {
      output: {
        // Melhor organização dos assets
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
      }
    },
    // Gerar source maps para debug em produção se necessário
    sourcemap: mode === "development",
    // Otimizar tamanho do bundle
    minify: "esbuild",
    // Aumentar limite de aviso para bundles grandes
    chunkSizeWarningLimit: 1e3
  },
  // Configuração para preview (teste local do build)
  preview: {
    port: 4173,
    host: true
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxQcm9qZXRvc19QYXJ0aWN1bGFyZXNcXFxcZ3ltLXB1bHNlLXN5c3RlbVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcUHJvamV0b3NfUGFydGljdWxhcmVzXFxcXGd5bS1wdWxzZS1zeXN0ZW1cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1Byb2pldG9zX1BhcnRpY3VsYXJlcy9neW0tcHVsc2Utc3lzdGVtL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXHJcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gT3RpbWl6YVx1MDBFN1x1MDBGNWVzIHBhcmEgU1BBIGVtIHByb2R1XHUwMEU3XHUwMEUzb1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAvLyBNZWxob3Igb3JnYW5pemFcdTAwRTdcdTAwRTNvIGRvcyBhc3NldHNcclxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bZXh0XS9bbmFtZV0tW2hhc2hdLltleHRdJyxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBHZXJhciBzb3VyY2UgbWFwcyBwYXJhIGRlYnVnIGVtIHByb2R1XHUwMEU3XHUwMEUzbyBzZSBuZWNlc3NcdTAwRTFyaW9cclxuICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gJ2RldmVsb3BtZW50JyxcclxuICAgIC8vIE90aW1pemFyIHRhbWFuaG8gZG8gYnVuZGxlXHJcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcclxuICAgIC8vIEF1bWVudGFyIGxpbWl0ZSBkZSBhdmlzbyBwYXJhIGJ1bmRsZXMgZ3JhbmRlc1xyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxyXG4gIH0sXHJcbiAgLy8gQ29uZmlndXJhXHUwMEU3XHUwMEUzbyBwYXJhIHByZXZpZXcgKHRlc3RlIGxvY2FsIGRvIGJ1aWxkKVxyXG4gIHByZXZpZXc6IHtcclxuICAgIHBvcnQ6IDQxNzMsXHJcbiAgICBob3N0OiB0cnVlLFxyXG4gIH0sXHJcbn0pKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtVCxTQUFTLG9CQUFvQjtBQUNoVixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQ1QsZ0JBQWdCO0FBQUEsRUFDbEIsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUE7QUFBQSxJQUVMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQTtBQUFBLFFBRU4sZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLFdBQVcsU0FBUztBQUFBO0FBQUEsSUFFcEIsUUFBUTtBQUFBO0FBQUEsSUFFUix1QkFBdUI7QUFBQSxFQUN6QjtBQUFBO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
