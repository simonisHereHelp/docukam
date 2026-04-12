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

    for (const image of incomingFormData.getAll("image")) {
      if (image instanceof File) {
        outgoingFormData.append("image", image);
      }
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
      | { rawText?: string; wordTarget?: number }
      | null;

    const rawText = body?.rawText?.trim() ?? "";
    if (!rawText) {
      return NextResponse.json({ error: "Missing rawText" }, { status: 400 });
    }

    const prompt = await loadPromptSource(PROMPT_SUMMARY_SOURCE);
    const systemPrompt = prompt.system;
    const userPrompt = renderPromptTemplate(prompt.user, {
      SUMMARY: rawText,
      wordTarget: body?.wordTarget ?? prompt.wordTarget ?? 180,
    });

    const response = await fetch(`${qwenBaseUrl.replace(/\/+$/, "")}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(qwenToken ? { Authorization: `Bearer ${qwenToken}` } : {}),
      },
      body: JSON.stringify({
        rawText,
        systemPrompt,
        userPrompt,
      }),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || `summarize failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    const summary =
      typeof data === "string"
        ? data
        : data?.markdown ?? data?.summary ?? data?.content ?? "";

    return NextResponse.json(
      {
        backend: "summarize",
        summary,
        raw: typeof data === "string" ? null : data,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("summarize failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
