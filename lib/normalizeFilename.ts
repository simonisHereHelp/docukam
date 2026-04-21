const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;

const toCamelToken = (token: string) => {
  if (!token) return "";
  if (/^\d+$/.test(token)) return token;
  if (/^[A-Za-z0-9]+$/.test(token)) {
    return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  }

  return token;
};

const normalizeSegment = (segment: string) =>
  segment
    .split(/\s+/)
    .map((token) => toCamelToken(token.replace(INVALID_FILENAME_CHARS, "")))
    .filter(Boolean)
    .join("");

export const normalizeFilename = (filename: string) => {
  const normalized = filename.normalize("NFC").replace(INVALID_FILENAME_CHARS, "").trim();
  if (!normalized) return "document";

  const extensionMatch = normalized.match(/(\.[A-Za-z0-9]+)$/);
  const extension = extensionMatch?.[1] ?? "";
  const baseName = extension ? normalized.slice(0, -extension.length) : normalized;

  const collapsedBase = baseName
    .split("-")
    .map((segment) => normalizeSegment(segment))
    .filter(Boolean)
    .join("-");

  return `${collapsedBase || "document"}${extension}`;
};
