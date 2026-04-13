export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
export const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

function isVercelProductionHost(): boolean {
  if (typeof window === "undefined") return false;
  return import.meta.env.PROD && /\.vercel\.app$/i.test(window.location.hostname);
}

/** True on public *.vercel.app build where we show the slim profile-only console (not local dev). */
export function isVercelHostedResearchUI(): boolean {
  return (
    isVercelProductionHost() && import.meta.env.VITE_ALLOW_VERCEL_RESEARCH !== "true"
  );
}

/**
 * On any production build served from *.vercel.app, the research console is
 * "coming soon" (no fetch, mascot + message) so visitors never see "Failed to fetch".
 * Opt back in to the live form only with VITE_ALLOW_VERCEL_RESEARCH=true once API works.
 *
 * Locally and on non-Vercel hosts: use VITE_RESEARCH_COMING_SOON=true to force the same UI.
 */
export function isResearchComingSoon(): boolean {
  if (typeof window !== "undefined" && isVercelProductionHost()) {
    return import.meta.env.VITE_ALLOW_VERCEL_RESEARCH !== "true";
  }
  if (import.meta.env.VITE_RESEARCH_COMING_SOON === "true") return true;
  return false;
}
