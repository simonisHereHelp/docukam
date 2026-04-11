const ISSUER_FIELD_LABEL = "單位";
const FIELD_SEPARATOR = "\\s*[:：]\\s*";

export const extractIssuerField = (summary: string): string | null => {
  const match = summary.match(
    new RegExp(`^\\s*${ISSUER_FIELD_LABEL}${FIELD_SEPARATOR}(.*)$`, "mu"),
  );
  const value = match?.[1]?.trim();
  return value ? value : null;
};

export const upsertIssuerField = (summary: string, issuerName: string): string => {
  const issuerLine = `${ISSUER_FIELD_LABEL}: ${issuerName}`;
  const trimmedSummary = summary.trim();

  if (!trimmedSummary) {
    return issuerLine;
  }

  const lines = summary.split(/\r?\n/);
  const issuerLineIndex = lines.findIndex((line) =>
    new RegExp(`^\\s*${ISSUER_FIELD_LABEL}${FIELD_SEPARATOR}`, "u").test(
      line.trim(),
    ),
  );

  if (issuerLineIndex >= 0) {
    lines[issuerLineIndex] = issuerLine;
    return lines.join("\n");
  }

  const headingIndex = lines.findIndex((line) => /^#{1,6}\s/.test(line.trim()));
  if (headingIndex >= 0) {
    lines.splice(headingIndex + 1, 0, issuerLine);
    return lines.join("\n");
  }

  return `${issuerLine}\n${trimmedSummary}`;
};

export const buildNamingSummary = (summary: string, fallbackIssuer?: string | null): string => {
  const issuerName = extractIssuerField(summary) || fallbackIssuer?.trim() || "";
  const trimmedSummary = summary.trim();

  if (!issuerName) {
    return trimmedSummary;
  }

  return [`issuer_name: ${issuerName}`, trimmedSummary].filter(Boolean).join("\n\n");
};
