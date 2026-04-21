const ISSUER_FIELD_LABEL = "\u55ae\u4f4d";
const DATE_FIELD_LABEL = "\u65e5\u671f";
const FIELD_SEPARATOR = "\\s*[:\uff1a]\\s*";

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

export const extractDateDigitsField = (summary: string): string | null => {
  const match = summary.match(
    new RegExp(`^\\s*${DATE_FIELD_LABEL}${FIELD_SEPARATOR}(.*)$`, "mu"),
  );
  const value = match?.[1]?.trim() ?? "";
  if (!value) return null;

  const isoLikeMatch = value.match(/\b(\d{4})\D+(\d{1,2})\D+(\d{1,2})\b/);
  if (isoLikeMatch) {
    const [, year, month, day] = isoLikeMatch;
    return `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
  }

  const partialYearMonthMatch = value.match(/\b(\d{4})\D+(\d{1,2})\b/);
  if (partialYearMonthMatch) {
    const [, year, month] = partialYearMonthMatch;
    return `${year}${month.padStart(2, "0")}`;
  }

  const monthDayYearMatch = value.match(/\b(\d{1,2})\D+(\d{1,2})\D+(\d{4})\b/);
  if (monthDayYearMatch) {
    const [, month, day, year] = monthDayYearMatch;
    return `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
  }

  const digitsOnly = value.replace(/\D+/g, "");

  return digitsOnly || null;
};
