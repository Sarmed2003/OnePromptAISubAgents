import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite configuration for dinolab-web
 *
 * Environment file loading:
 * - Development (vite dev): Loads .env, .env.local, and .env.development.local
 * - Build (vite build): Loads .env, .env.production, and .env.production.local
 * - Preview (vite preview): Loads .env and .env.production.local
 *
 * Script usage:
 * - npm run dev: Development server with .env.local overrides (port 5174)
 * - npm run build: Production build with .env.production overrides
 * - npm run preview: Preview production build with .env.production.local
 * - npm run lint: Type checking only (no env loading needed)
 *
 * Vite automatically handles .env file loading based on NODE_ENV:
 * - NODE_ENV=development for dev command
 * - NODE_ENV=production for build command
 * - NODE_ENV=production for preview command
 *
 * Priority order (lowest to highest):
 * 1. .env (always loaded)
 * 2. .env.[mode] (e.g., .env.development, .env.production)
 * 3. .env.local (loaded in dev, overrides all for local development)
 * 4. .env.[mode].local (e.g., .env.production.local, highest priority)
 *
 * All environment variables must be prefixed with VITE_ to be exposed to client code.
 */

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
