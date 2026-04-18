import { NextResponse } from "next/server";
import { formatSixWFromRecord } from "@/lib/formatSixWText";

interface Img2SixWPayload {
  "\u55ae\u4f4d"?: string;
  "\u4e3b\u984c"?: string;
  "\u65e5\u671f"?: string;
  "\u6536\u4ef6\u4eba"?: string;
  "\u5730\u9ede"?: string;
  abstract_summary?: string;
}

interface ImgToOcrTextPayload {
  plainText?: string;
  text?: string;
  rawText?: string;
}

const format6WLines = (payload: Img2SixWPayload) =>
  formatSixWFromRecord({
    單位: payload["\u55ae\u4f4d"],
    收件人: payload["\u6536\u4ef6\u4eba"],
    日期: payload["\u65e5\u671f"],
    主題: payload["\u4e3b\u984c"],
    地點: payload["\u5730\u9ede"],
    abstract_summary: payload.abstract_summary,
  });

const collectUploads = async (req: Request) => {
  const incomingFormData = await req.formData();
  return ["files", "image"]
    .flatMap((fieldName) => incomingFormData.getAll(fieldName))
    .filter((upload): upload is File => upload instanceof File);
};

const buildServiceUrl = (baseUrl: string, pathName: string) =>
  `${baseUrl.replace(/\/+$/, "")}/${pathName.replace(/^\/+/, "")}`;

const buildServiceHeaders = () => {
  const token = process.env.IMG_2_6W_BEARER_TOKEN?.trim();

  if (!token) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export async function handleImg2SixWReady() {
  const serviceBaseUrl = process.env.IMG_2_6W_URL;

  if (!serviceBaseUrl) {
    return NextResponse.json({ error: "Missing IMG_2_6W_URL" }, { status: 500 });
  }

  try {
    const response = await fetch(buildServiceUrl(serviceBaseUrl, "/readyz"), {
      method: "GET",
      cache: "no-store",
    });

    const text = await response.text().catch(() => "");
    const json = text ? JSON.parse(text) : null;
    const ready = response.ok && Boolean(json?.ready);

    return NextResponse.json(
      {
        ready,
        status: response.status,
        raw: json,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ready: false,
        status: 0,
        error: err.message,
      },
      { status: 200 },
    );
  }
}

export async function handleImg2SixWWarmup() {
  const serviceBaseUrl = process.env.IMG_2_6W_URL;

  if (!serviceBaseUrl) {
    return NextResponse.json({ error: "Missing IMG_2_6W_URL" }, { status: 500 });
  }

  try {
    const response = await fetch(buildServiceUrl(serviceBaseUrl, "/warmup"), {
      method: "POST",
      cache: "no-store",
    });

    const text = await response.text().catch(() => "");
    let raw: unknown = text;

    try {
      raw = text ? JSON.parse(text) : null;
    } catch {
      raw = text;
    }

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        raw,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        status: 0,
        error: err.message,
      },
      { status: 200 },
    );
  }
}

export async function handleImg2SixW(req: Request) {
  const serviceBaseUrl = process.env.IMG_2_6W_URL;
  const timeoutMs = Number(process.env.IMG_2_6W_TIMEOUT_MS || "380000");

  if (!serviceBaseUrl) {
    return NextResponse.json({ error: "Missing IMG_2_6W_URL" }, { status: 500 });
  }

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

      const response = await fetch(buildServiceUrl(serviceBaseUrl, "/6w"), {
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

export async function handleImgToOcrText(req: Request) {
  const serviceBaseUrl = process.env.IMG_2_6W_URL;
  const timeoutMs = Number(process.env.IMG_2_6W_TIMEOUT_MS || "380000");
  const headers = buildServiceHeaders();

  if (!serviceBaseUrl) {
    return NextResponse.json({ error: "Missing IMG_2_6W_URL" }, { status: 500 });
  }

  try {
    const uploads = await collectUploads(req);

    if (uploads.length === 0) {
      return NextResponse.json({ error: "At least one file is required." }, { status: 400 });
    }

    const attempts = [
      { path: "/ocr-text", fieldName: "images" },
      { path: "/ocr-extract", fieldName: "images" },
      { path: "/extract", fieldName: "files" },
    ];

    let lastError = "Unable to run OCR text extraction.";

    for (const attempt of attempts) {
      const outgoingFormData = new FormData();
      for (const upload of uploads) {
        outgoingFormData.append(attempt.fieldName, upload, upload.name);
      }

      const response = await fetch(buildServiceUrl(serviceBaseUrl, attempt.path), {
        method: "POST",
        body: outgoingFormData,
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });

      const responseText = await response.text().catch(() => "");

      if (!response.ok) {
        lastError = responseText || `img-2-ocrText failed with status ${response.status}`;
        continue;
      }

      let payload: ImgToOcrTextPayload | null = null;
      try {
        payload = (JSON.parse(responseText) as ImgToOcrTextPayload | null) ?? null;
      } catch {
        payload = { plainText: responseText };
      }

      const plainText =
        payload?.plainText?.trim() ||
        payload?.text?.trim() ||
        payload?.rawText?.trim() ||
        "";

      if (!plainText) {
        lastError = "OCR text route returned no text.";
        continue;
      }

      return NextResponse.json(
        {
          backend: "img-2-ocrText",
          plainText,
          raw: payload,
        },
        { status: 200 },
      );
    }

    throw new Error(lastError);
  } catch (err: any) {
    console.error("img-2-ocrText failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
