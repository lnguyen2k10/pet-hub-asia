import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    nitro({
      preset: process.env.VERCEL ? "vercel" : "cloudflare-module",
      ...(process.env.VERCEL ? {} : {
        output: {
          dir: ".output",
          serverDir: ".output/server",
          publicDir: ".output/public"
        },
        cloudflare: {
          nodeCompat: true,
          deployConfig: true
        }
      })
    }),
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
