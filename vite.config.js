import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

const manifestForPlugin = {
  registerType: "prompt",
  includeAssets: ["favicon.ico", "apple-touch-icon.png", "maskable-icon.png"],
  manifest: {
    name: "Peri Pair Bot",
    short_name: "Peri",
    description:
      "Peri Pair Bot is a platform to trade crypto currencies as pairs",
    theme_color: "#041318",
    icons: [
      {
        src: "./android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "./android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "favicon",
      },
      {
        src: "./apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "apple-touch-icon",
      },
      {
        src: "./favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "favicon",
      },
      {
        src: "./favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
        purpose: "favicon",
      },
      {
        src: "./favicon.ico",
        sizes: "48x48",
        type: "image/png",
        purpose: "favicon",
      },
      {
        src: "./maskable-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    background_color: "#041318",
    display: "standalone",
    scope: "/",
    start_url: "/",
    orientation: "landscape",
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", { target: "18" }]],
      },
    }),
    VitePWA(manifestForPlugin),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Expose to all network interfaces
    port: 5173, // Default Vite port
  },
});
