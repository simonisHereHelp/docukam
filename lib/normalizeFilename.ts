const CONTROL_CHARS = /[\u0000-\u001F]/g;
const ALLOWED_SYMBOLS = /[._-]/;

const stripDisallowedChars = (value: string) =>
  Array.from(value.normalize("NFC").replace(CONTROL_CHARS, ""))
    .filter((char) => {
      if (ALLOWED_SYMBOLS.test(char)) return true;
      return /[\p{L}\p{N}]/u.test(char);
    })
    .join("");

const toCamelToken = (token: string) => {
  if (!token) return "";
  if (/^\d+$/u.test(token)) return token;
  if (/^[A-Z0-9]+$/u.test(token) || /^[a-z0-9]+$/u.test(token)) {
    return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  }

  return token;
};

const normalizeSegment = (segment: string) =>
  segment
    .split(/\s+/)
    .map((token) => toCamelToken(stripDisallowedChars(token)))
    .filter(Boolean)
    .join("");

export const normalizeFilename = (filename: string) => {
  const normalized = filename.normalize("NFC").replace(CONTROL_CHARS, "").trim();
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
