export interface OcrTextImage {
  url: string;
  file: File;
}

interface OcrTextResponse {
  plainText?: string;
  text?: string;
  rawText?: string;
}

const responseToText = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as OcrTextResponse | null;
    return (
      payload?.plainText?.trim() ||
      payload?.text?.trim() ||
      payload?.rawText?.trim() ||
      ""
    );
  }

  return (await response.text().catch(() => "")).trim();
};

export const runImgToOcrTextExtract = async ({
  images,
  setSourceOcrText,
  setEditedOcrText,
  onError,
}: {
  images: OcrTextImage[];
  setSourceOcrText: (text: string) => void;
  setEditedOcrText: (text: string) => void;
  onError?: (message: string) => void;
}): Promise<boolean> => {
  if (images.length === 0) return false;

  const serviceBaseUrl = process.env.NEXT_PUBLIC_IMG_2_6W_URL;
  if (!serviceBaseUrl) {
    onError?.("Missing NEXT_PUBLIC_IMG_2_6W_URL.");
    return false;
  }

  const attempts = [
    { path: "/ocr-text", fieldName: "images" },
    { path: "/ocr-extract", fieldName: "images" },
    { path: "/extract", fieldName: "files" },
  ];

  let lastError = "Unable to run OCR text extraction.";

  for (const attempt of attempts) {
    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append(attempt.fieldName, image.file, image.file.name);
      });

      const response = await fetch(
        `${serviceBaseUrl.replace(/\/+$/, "")}${attempt.path}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        lastError = message || `OCR text route failed: ${response.status}`;
        continue;
      }

      const extractedText = await responseToText(response);
      if (!extractedText) {
        lastError = "OCR text route returned no text.";
        continue;
      }

      setSourceOcrText(extractedText);
      setEditedOcrText(extractedText);
      return true;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unable to run OCR text extraction.";
    }
  }

  onError?.(lastError);
  return false;
};

