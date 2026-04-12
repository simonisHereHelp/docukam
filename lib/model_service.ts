import { NextResponse } from "next/server";

const buildEndpoint = (baseUrl: string, pathName: string) =>
  `${baseUrl.replace(/\/+$/, "")}${pathName.startsWith("/") ? pathName : `/${pathName}`}`;

const SUMMARIZE_INSTRUCTION =
  "你是一位文件内容摘要專家，你擅長使用6W框架整理出單位、收件人、日期、主題與地點。你也擅長整理出abstract_summary，詳細列出文件的摘要，以下是文件的文字内容";

const extract6WSummary = (responseText: string) => {
  const trimmed = responseText.trim();
  const match = trimmed.match(/(?:^|\n)(6W摘要|6W summary)\s*\n([\s\S]*)$/i);
  if (!match) return trimmed;

  const extracted = match[2]?.trim() ?? "";
  return extracted || trimmed;
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
    const incomingFormData = await req.formData();
    const outgoingFormData = new FormData();
    let fileCount = 0;

    for (const fieldName of ["files", "image"]) {
      for (const upload of incomingFormData.getAll(fieldName)) {
        if (upload instanceof File) {
          outgoingFormData.append("files", upload, upload.name);
          fileCount += 1;
        }
      }
    }

    if (fileCount === 0) {
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

    const payload = (await response.json().catch(() => null)) as
      | { plainText?: string }
      | null;
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
