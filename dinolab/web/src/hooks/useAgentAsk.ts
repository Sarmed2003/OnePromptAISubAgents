import { useCallback, useState } from "react";
import { API_URL } from "../config";

export interface AskPayload {
  question: string;
  speciesId: string;
  speciesBinomial: string;
  boneId?: string;
  boneScientificName?: string;
  boneContext?: string;
}

export interface AskResponse {
  answer: string;
  modelId?: string;
  requestId?: string;
  error?: string;
}

export function useAgentAsk() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async (payload: AskPayload): Promise<AskResponse> => {
    setError(null);
    setLoading(true);
    try {
      if (!API_URL) {
        const err = "Research API is not configured. Please set VITE_API_URL.";
        setError(err);
        return { answer: "", error: err };
      }
      const res = await fetch(`${API_URL}/lab/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: payload.question,
          speciesId: payload.speciesId,
          speciesBinomial: payload.speciesBinomial,
          boneId: payload.boneId,
          boneScientificName: payload.boneScientificName,
          boneContext: payload.boneContext,
        }),
      });
      const data = (await res.json()) as AskResponse & { message?: string };
      if (!res.ok) {
        const err = data.error || data.message || res.statusText;
        setError(err);
        return { answer: "", error: err };
      }
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      const isNetworkFailure =
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("networkerror");
      const friendly = isNetworkFailure
        ? "Cannot reach research API. Start dinolab/infra local_ask_server.py (default port 8787) and set VITE_API_URL to match, or use your deployed API URL."
        : msg;
      setError(friendly);
      return { answer: "", error: friendly };
    } finally {
      setLoading(false);
    }
  }, []);

  return { ask, loading, error, hasApi: Boolean(API_URL) };
}
