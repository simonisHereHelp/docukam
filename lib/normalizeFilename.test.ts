import test from "node:test";
import assert from "node:assert";
import { normalizeFilename } from "./normalizeFilename.js";

test("normalizeFilename converts names to NFC", () => {
  const decomposed = "Cafe\u0301";
  const normalized = normalizeFilename(decomposed);

  assert.equal(normalized, decomposed.normalize("NFC"));
});

test("normalizeFilename converts spaced ascii words to CamelCase", () => {
  assert.equal(
    normalizeFilename("COUNTY OF SAN DIEGO-20232024.md"),
    "CountyOfSanDiego-20232024.md",
  );
});

test("normalizeFilename removes commas and disallowed punctuation", () => {
  assert.equal(
    normalizeFilename("Marriage Certif,Nevada-10301988.json"),
    "MarriageCertifNevada-10301988.json",
  );
});

test("normalizeFilename preserves chinese text while removing spaces", () => {
  assert.equal(
    normalizeFilename("國 民 年 金 保 險-20232024.json"),
    "國民年金保險-20232024.json",
  );
});
