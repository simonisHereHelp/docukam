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

test("normalizeFilename preserves existing CamelCase segments", () => {
  assert.equal(
    normalizeFilename("Passport-TheUnitedStatesOfAmerica-19600226.md"),
    "Passport-TheUnitedStatesOfAmerica-19600226.md",
  );
});

test("normalizeFilename converts all-caps multiword segments to CamelCase", () => {
  assert.equal(
    normalizeFilename("Passport-THE UNITED STATES OF AMERICA-19600226.md"),
    "Passport-TheUnitedStatesOfAmerica-19600226.md",
  );
});

test("normalizeFilename preserves mixed-case prefixes and camelizes all-caps suffixes", () => {
  assert.equal(
    normalizeFilename("BirthCert-COUNTY OF LOS ANGELES-19940825.md"),
    "BirthCert-CountyOfLosAngeles-19940825.md",
  );
});

test("normalizeFilename preserves chinese text while removing spaces", () => {
  assert.equal(
    normalizeFilename("國 民 年 金 保 險-20232024.json"),
    "國民年金保險-20232024.json",
  );
});
