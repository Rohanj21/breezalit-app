import { defineConfig } from "vite";

export default defineConfig({
    server: {
        proxy: {
            "/wp-json": {
                target: "https://boundless-night.localsite.io",
                changeOrigin: true,
                secure: false,
                headers: {
                    Authorization:
                        "Basic " + Buffer.from("12345:12345").toString("base64"),
                },
            },
            "/wp-content": {
                target: "https://boundless-night.localsite.io",
                changeOrigin: true,
                secure: false,
                headers: {
                    Authorization:
                        "Basic " + Buffer.from("12345:12345").toString("base64"),
                },
            },
        },
    },
});