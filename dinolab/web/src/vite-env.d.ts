/// <reference types="vite/client" />

declare module "*.png" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ASSET_BASE: string;
  /** Force "coming soon" research UI on non-Vercel builds (e.g. local static preview). */
  readonly VITE_RESEARCH_COMING_SOON?: string;
  /** On *.vercel.app only: set "true" to show the full Bedrock form when API is ready. */
  readonly VITE_ALLOW_VERCEL_RESEARCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
