const SIX_W_LABELS = [
  "單位",
  "收件人",
  "日期",
  "主題",
  "地點",
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

    const match = line.match(/^([^:：]+)\s*[:：]\s*(.*)$/u);
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

const normalizeSixWValue = (value?: string) => value?.trim() || "未識別";

export const formatSixWFromRecord = (record: {
  單位?: string;
  收件人?: string;
  日期?: string;
  主題?: string;
  地點?: string;
  abstract_summary?: string;
}) =>
  [
    `單位: ${normalizeSixWValue(record["單位"])}`,
    `收件人: ${normalizeSixWValue(record["收件人"])}`,
    `日期: ${normalizeSixWValue(record["日期"])}`,
    `主題: ${normalizeSixWValue(record["主題"])}`,
    `地點: ${normalizeSixWValue(record["地點"])}`,
    `abstract_summary: ${normalizeSixWValue(record.abstract_summary)}`,
  ].join("\n\n");

export const normalizeSixWText = (text: string) => {
  const parsed = parseSixWText(text);
  const hasAnySixWValue = Object.keys(parsed).length > 0;
  if (!hasAnySixWValue) {
    return text.trim();
  }

  return formatSixWFromRecord(parsed);
};

