import type { IssuerCanonEntry } from "@/lib/issuerCanon";
import { upsertIssuerField } from "@/lib/summaryFields";

interface CanonListResponse {
  issuers?: IssuerCanonEntry[];
}

export const fetchIssuerCanonList = async (
  fetcher: typeof fetch = fetch,
): Promise<IssuerCanonEntry[]> => {
  const response = await fetcher("/api/issuer-canons");

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to fetch issuer canon list");
  }

  const payload = (await response.json()) as CanonListResponse;
  return payload.issuers ?? [];
};

export const applyCanonToSummary = ({
  canon,
  currentSummary,
  draftSummary,
}: {
  canon: IssuerCanonEntry;
  currentSummary: string;
  draftSummary: string;
}): string => {
  const baseSummary =
    currentSummary.trim().length > 0 ? currentSummary : draftSummary;

  return upsertIssuerField(baseSummary, canon.master);
};

export type { IssuerCanonEntry };
