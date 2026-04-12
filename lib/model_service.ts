import { NextResponse } from "next/server";

import { loadPromptSource, renderPromptTemplate } from "@/lib/jsonSource";
import { PROMPT_SUMMARY_SOURCE } from "@/lib/jsonCanonSources";

const buildEndpoint = (baseUrl: string, pathName: string) =>
  `${baseUrl.replace(/\/+$/, "")}${pathName.startsWith("/") ? pathName : `/${pathName}`}`;

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
      | { markdown?: string; plainText?: string }
      | null;

    return NextResponse.json(
      {
        backend: "ocr-extract",
        markdown: payload?.markdown ?? "",
        plainText: payload?.plainText ?? "",
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
      | { rawText?: string; markdown?: string; plainText?: string; wordTarget?: number }
      | null;

    const editedRawText =
      body?.plainText?.trim() ??
      body?.markdown?.trim() ??
      body?.rawText?.trim() ??
      "";

    if (!editedRawText) {
      return NextResponse.json({ error: "Missing rawText" }, { status: 400 });
    }

    const prompt = await loadPromptSource(PROMPT_SUMMARY_SOURCE);
    const systemPrompt = prompt.system;
    const userPrompt = renderPromptTemplate(prompt.user, {
      SUMMARY: editedRawText,
      wordTarget: body?.wordTarget ?? prompt.wordTarget ?? 180,
      日期: "",
      單位: "",
    });

    const ingestPayload = {
      plainText: editedRawText,
      markdown: editedRawText,
      title: "",
      abstract: "",
      pages: [],
      systemPrompt,
      userPrompt,
    };

    const response = await fetch(`${qwenBaseUrl.replace(/\/+$/, "")}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(qwenToken ? { Authorization: `Bearer ${qwenToken}` } : {}),
      },
      body: JSON.stringify(ingestPayload),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || `summarize failed with status ${response.status}`);
    }

    const data = (await response.json().catch(() => null)) as
      | {
          normalizedText?: string;
          abstractSummary?: string;
          issuer_name?: string;
          documentDate?: string;
        }
      | null;

    const summary = data?.normalizedText?.trim() || data?.abstractSummary?.trim() || "";

    return NextResponse.json(
      {
        backend: "summarize",
        summary,
        raw: data,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("summarize failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
