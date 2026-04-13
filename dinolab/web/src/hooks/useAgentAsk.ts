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

export interface UseAgentAskState {
  loading: boolean;
  error: string | null;
  answer: string | null;
}

export function useAgentAsk() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  const ask = useCallback(
    async (payload: AskPayload): Promise<UseAgentAskState> => {
      setError(null);
      setAnswer(null);
      setLoading(true);

      try {
        if (!API_URL) {
          setLoading(false);
          setError("COMING_SOON");
          return { loading: false, error: "COMING_SOON", answer: null };
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
          const errorMsg = data.error || data.message || res.statusText;
          setLoading(false);
          setError(errorMsg);
          return { loading: false, error: errorMsg, answer: null };
        }

        const responseAnswer = data.answer || "";
        setLoading(false);
        setAnswer(responseAnswer);
        return { loading: false, error: null, answer: responseAnswer };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        const isNetworkFailure =
          msg.toLowerCase().includes("failed to fetch") ||
          msg.toLowerCase().includes("networkerror") ||
          msg.toLowerCase().includes("fetch is not defined");

        const errorCode = isNetworkFailure ? "COMING_SOON" : msg;

        setLoading(false);
        setError(errorCode);
        return { loading: false, error: errorCode, answer: null };
      }
    },
    []
  );

  return { ask, loading, error, answer };
}
