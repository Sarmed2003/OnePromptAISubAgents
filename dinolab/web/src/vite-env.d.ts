/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ASSET_BASE: string;
  /** "true" | "false" — override coming-soon gate for the research console (default: auto on *.vercel.app in prod). */
  readonly VITE_RESEARCH_COMING_SOON?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
