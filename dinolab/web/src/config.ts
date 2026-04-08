export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
export const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

/** Production *.vercel.app preview URL: hide broken API until backend is wired. Override with VITE_RESEARCH_COMING_SOON. */
export function isResearchComingSoon(): boolean {
  if (import.meta.env.VITE_RESEARCH_COMING_SOON === "false") return false;
  if (import.meta.env.VITE_RESEARCH_COMING_SOON === "true") return true;
  if (typeof window === "undefined") return false;
  return import.meta.env.PROD && /\.vercel\.app$/i.test(window.location.hostname);
}
