import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
    server: {
        open: false,
    },
    plugins: [
        tanstackRouter({
            target: "react",
            autoCodeSplitting: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),

            // fix loading all icon chunks in dev mode
            // https://github.com/tabler/tabler-icons/issues/1233
            "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
        },
    },
});
