const SIX_W_LABELS = [
  "\u55ae\u4f4d",
  "\u6536\u4ef6\u4eba",
  "\u65e5\u671f",
  "\u4e3b\u984c",
  "\u5730\u9ede",
  "abstract_summary",
] as const;

type SixWLabel = (typeof SIX_W_LABELS)[number];

const isSixWLabel = (value: string): value is SixWLabel =>
  SIX_W_LABELS.includes(value as SixWLabel);

const parseSixWText = (text: string): Partial<Record<SixWLabel, string>> => {
  const parsed: Partial<Record<SixWLabel, string>> = {};
  const lines = text.split(/\r?\n/);
  let currentLabel: SixWLabel | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(/^([^:\uff1a]+)\s*[:\uff1a]\s*(.*)$/u);
    if (match) {
      const [, possibleLabel, value] = match;
      const normalizedLabel = possibleLabel.trim();
      if (isSixWLabel(normalizedLabel)) {
        currentLabel = normalizedLabel;
        parsed[currentLabel] = value.trim();
        continue;
      }
    }

    if (currentLabel) {
      parsed[currentLabel] = [parsed[currentLabel], line].filter(Boolean).join(" ");
    }
  }

  return parsed;
};

const normalizeSixWValue = (value?: string) => value?.trim() || "\u672a\u8b58\u5225";

export const formatSixWFromRecord = (record: {
  "\u55ae\u4f4d"?: string;
  "\u6536\u4ef6\u4eba"?: string;
  "\u65e5\u671f"?: string;
  "\u4e3b\u984c"?: string;
  "\u5730\u9ede"?: string;
  abstract_summary?: string;
}) =>
  [
    `\u55ae\u4f4d: ${normalizeSixWValue(record["\u55ae\u4f4d"])}`,
    `\u6536\u4ef6\u4eba: ${normalizeSixWValue(record["\u6536\u4ef6\u4eba"])}`,
    `\u65e5\u671f: ${normalizeSixWValue(record["\u65e5\u671f"])}`,
    `\u4e3b\u984c: ${normalizeSixWValue(record["\u4e3b\u984c"])}`,
    `\u5730\u9ede: ${normalizeSixWValue(record["\u5730\u9ede"])}`,
    `abstract_summary: ${normalizeSixWValue(record.abstract_summary)}`,
  ].join("\n\n");

const normalizeSingleSixWBlock = (text: string) => {
  const parsed = parseSixWText(text);
  const hasAnySixWValue = Object.keys(parsed).length > 0;
  if (!hasAnySixWValue) {
    return text.trim();
  }

  return formatSixWFromRecord(parsed);
};

export const normalizeSixWText = (text: string) => {
  const trimmedText = text.trim();
  if (!trimmedText) return "";

  const multiImageBlocks = trimmedText.match(/(?:^|\n\n)(Image\s+\d+\n[\s\S]*?)(?=\n\nImage\s+\d+\n|$)/g);
  if (multiImageBlocks?.length) {
    return multiImageBlocks
      .map((block) => {
        const cleanedBlock = block.trim();
        const [headingLine, ...rest] = cleanedBlock.split(/\r?\n/);
        const normalizedBlock = normalizeSingleSixWBlock(rest.join("\n").trim());
        return [headingLine.trim(), normalizedBlock].filter(Boolean).join("\n\n");
      })
      .join("\n\n");
  }

  return normalizeSingleSixWBlock(trimmedText);
};
