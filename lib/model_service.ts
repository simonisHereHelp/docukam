import { NextResponse } from "next/server";

const buildEndpoint = (baseUrl: string, pathName: string) =>
  `${baseUrl.replace(/\/+$/, "")}${pathName.startsWith("/") ? pathName : `/${pathName}`}`;

const SUMMARIZE_INSTRUCTION =
  "\u4f60\u662f\u4e00\u4f4d\u6587\u4ef6\u5167\u5bb9\u6458\u8981\u5c08\u5bb6\uff0c\u4f60\u64c5\u9577\u4f7f\u75286W\u6846\u67b6\u6574\u7406\u51fa\u55ae\u4f4d\u3001\u6536\u4ef6\u4eba\u3001\u65e5\u671f\u3001\u4e3b\u984c\u8207\u5730\u9ede\u3002\u4f60\u4e5f\u64c5\u9577\u6574\u7406\u51faabstract_summary\uff0c\u8a73\u7d30\u5217\u51fa\u6587\u4ef6\u7684\u6458\u8981\uff0c\u4ee5\u4e0b\u662f\u6587\u4ef6\u7684\u6587\u5b57\u5167\u5bb9";

interface OcrExtractPayload {
  plainText?: string;
}

interface Img2SixWPayload {
  "\u55ae\u4f4d"?: string;
  "\u4e3b\u984c"?: string;
  "\u65e5\u671f"?: string;
  "\u6536\u4ef6\u4eba"?: string;
  "\u5730\u9ede"?: string;
  abstract_summary?: string;
}

const extract6WSummary = (responseText: string) => {
  const trimmed = responseText.trim();
  const match = trimmed.match(/(?:^|\n)(6W\u6458\u8981|6W summary)\s*\n([\s\S]*)$/i);
  if (!match) return trimmed;

  const extracted = match[2]?.trim() ?? "";
  return extracted || trimmed;
};

const format6WLines = (payload: Img2SixWPayload) =>
  [
    `\u55ae\u4f4d: ${(payload["\u55ae\u4f4d"] || "").trim() || "\u672a\u8b58\u5225"}`,
    `\u6536\u4ef6\u4eba: ${(payload["\u6536\u4ef6\u4eba"] || "").trim() || "\u672a\u8b58\u5225"}`,
    `\u65e5\u671f: ${(payload["\u65e5\u671f"] || "").trim() || "\u672a\u8b58\u5225"}`,
    `\u4e3b\u984c: ${(payload["\u4e3b\u984c"] || "").trim() || "\u672a\u8b58\u5225"}`,
    `\u5730\u9ede: ${(payload["\u5730\u9ede"] || "").trim() || "\u672a\u8b58\u5225"}`,
    `abstract_summary: ${(payload.abstract_summary || "").trim() || "\u672a\u8b58\u5225"}`,
  ].join("\n");

const collectUploads = async (req: Request) => {
  const incomingFormData = await req.formData();
  return ["files", "image"]
    .flatMap((fieldName) => incomingFormData.getAll(fieldName))
    .filter((upload): upload is File => upload instanceof File);
};

export async function handleOcrExtract(req: Request) {
  const paddleBaseUrl = process.env.PADDLE_OCR_URL;
  const paddleBearerToken = process.env.PADDLE_OCR_BEARER_TOKEN;
  const timeoutMs = Number(process.env.PADDLE_OCR_TIMEOUT_MS || "380000");

  if (!paddleBaseUrl) {
    return NextResponse.json({ error: "Missing PADDLE_OCR_URL" }, { status: 500 });
  }

  if (!paddleBearerToken) {
    return NextResponse.json({ error: "Missing PADDLE_OCR_BEARER_TOKEN" }, { status: 500 });
  }

  try {
    const uploads = await collectUploads(req);
    const outgoingFormData = new FormData();

    for (const upload of uploads) {
      outgoingFormData.append("files", upload, upload.name);
    }

    if (uploads.length === 0) {
      return NextResponse.json({ error: "At least one file is required." }, { status: 400 });
    }

    const response = await fetch(buildEndpoint(paddleBaseUrl, "/extract"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paddleBearerToken}`,
      },
      body: outgoingFormData,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || `Paddle OCR failed with status ${response.status}`);
    }

    const payload = (await response.json().catch(() => null)) as OcrExtractPayload | null;
    const plainText = payload?.plainText?.trim() ?? "";

    return NextResponse.json(
      {
        backend: "ocr-extract",
        plainText,
        raw: payload,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("ocr-extract failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function handleSummarize(req: Request) {
  const qwenBaseUrl = process.env.QWEN_HF_URL;
  const qwenToken = process.env.QWEN_HF_TOKEN;

  if (!qwenBaseUrl) {
    return NextResponse.json({ error: "Missing QWEN_HF_URL" }, { status: 500 });
  }

  try {
    const body = (await req.json().catch(() => null)) as
      | { rawText?: string; plainText?: string }
      | null;

    const plainText = body?.plainText?.trim() ?? body?.rawText?.trim() ?? "";

    if (!plainText) {
      return NextResponse.json({ error: "Missing plainText" }, { status: 400 });
    }

    const ingestPayload = {
      instruction: SUMMARIZE_INSTRUCTION,
      input: plainText,
    };

    console.log("[summarize] ingest payload preview", {
      hasInstruction: Boolean(ingestPayload.instruction),
      inputLength: ingestPayload.input.length,
      inputPreview: ingestPayload.input.slice(0, 120),
    });

    const response = await fetch(`${qwenBaseUrl.replace(/\/+$/, "")}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...(qwenToken ? { Authorization: `Bearer ${qwenToken}` } : {}),
      },
      body: JSON.stringify(ingestPayload),
    });

    console.log("[summarize] ingest response status", response.status);

    const responseText = await response.text().catch(() => "");

    if (!response.ok) {
      console.error("[summarize] ingest error body", responseText);
      throw new Error(responseText || `summarize failed with status ${response.status}`);
    }

    const summary = extract6WSummary(responseText);

    return NextResponse.json(
      {
        backend: "summarize",
        summary,
        raw: responseText,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("summarize failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function handleImg2SixW(req: Request) {
  const timeoutMs = Number(process.env.IMG_2_6W_TIMEOUT_MS || "380000");
  const serviceEndpoint = "https://lenovo.ishere.help/6w";

  try {
    const uploads = await collectUploads(req);

    if (uploads.length === 0) {
      return NextResponse.json({ error: "At least one file is required." }, { status: 400 });
    }

    const summaries: string[] = [];
    const raw: Img2SixWPayload[] = [];

    for (const [index, upload] of uploads.entries()) {
      const outgoingFormData = new FormData();
      outgoingFormData.append("image", upload, upload.name);

      const response = await fetch(serviceEndpoint, {
        method: "POST",
        body: outgoingFormData,
        signal: AbortSignal.timeout(timeoutMs),
      });

      const responseText = await response.text().catch(() => "");

      if (!response.ok) {
        throw new Error(responseText || `img-2-6w failed with status ${response.status}`);
      }

      const payload = (JSON.parse(responseText) as Img2SixWPayload | null) ?? {};
      raw.push(payload);

      const summary = format6WLines(payload);
      summaries.push(uploads.length > 1 ? `Image ${index + 1}\n${summary}` : summary);
    }

    return NextResponse.json(
      {
        backend: "img-2-6w",
        summary: summaries.join("\n\n"),
        raw,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("img-2-6w failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
