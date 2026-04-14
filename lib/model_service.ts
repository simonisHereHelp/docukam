import { NextResponse } from "next/server";

interface Img2SixWPayload {
  "\u55ae\u4f4d"?: string;
  "\u4e3b\u984c"?: string;
  "\u65e5\u671f"?: string;
  "\u6536\u4ef6\u4eba"?: string;
  "\u5730\u9ede"?: string;
  abstract_summary?: string;
}

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

const buildServiceUrl = (baseUrl: string, pathName: string) =>
  `${baseUrl.replace(/\/+$/, "")}/${pathName.replace(/^\/+/, "")}`;

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
