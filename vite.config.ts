import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	return {
		base: "/CS5224-Group-Project/",
		plugins: [react(), tailwindcss()],
		server: {
			port: parseInt(env.PORT) || 5173,
		},
	};
});
