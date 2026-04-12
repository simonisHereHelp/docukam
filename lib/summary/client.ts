import { playSuccessChime } from "../../app/components/image-capture-dialog-mobile/soundEffects";

export interface SummaryImage {
  url: string;
  file: File;
}

const extensionFromFile = (file: File) => {
  const nameExtension = file.name.split(".").pop()?.toLowerCase();
  if (nameExtension) return nameExtension;

  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";

  return "jpg";
};

const buildEditableSummaryTemplate = (images: SummaryImage[]) => {
  const assets =
    images.length > 0
      ? images
          .map((image, index) => {
            const page = index + 1;
            const extension = extensionFromFile(image.file);
            return `- [ ] ./{{setName}}-p${page}.${extension}`;
          })
          .join("\n")
      : "- [ ] ./{{setName}}-p1.jpg";

  return `### Draft Summary
單位:
類型:
行動:
內容摘要:

### Assets
${assets}
`;
};

export const runSummaryExtract = async ({
  images,
  setIsSaving,
  setOcrSummary,
  setEditedSummary,
  setError,
}: {
  images: SummaryImage[];
  setIsSaving: (isSaving: boolean) => void;
  setOcrSummary: (summary: string) => void;
  setEditedSummary: (summary: string) => void;
  setError: (message: string) => void;
}): Promise<boolean> => {
  if (images.length === 0) return false;

  const fallbackSummary = buildEditableSummaryTemplate(images);

  setIsSaving(true);
  setError("");

  try {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("image", image.file);
    });

    const response = await fetch("/api/ocr-extract", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to extract OCR text.");
    }

    const data = (await response.json()) as { markdown?: string; plainText?: string };
    const extractedText = (data.markdown || data.plainText || "").trim();
    const resolvedSummary = extractedText.length ? extractedText : fallbackSummary;

    setOcrSummary(resolvedSummary);
    setEditedSummary(resolvedSummary);
    playSuccessChime();
    return true;
  } catch (error) {
    console.error("Failed to run ocr-extract:", error);
    setOcrSummary(fallbackSummary);
    setEditedSummary(fallbackSummary);
    setError("Unable to extract OCR text. Please edit the raw text manually.");
    return true;
  } finally {
    setIsSaving(false);
  }
};

export const runSummaryEnhance = async ({
  rawText,
  setIsSaving,
  setEditedSummary,
  setError,
}: {
  rawText: string;
  setIsSaving: (isSaving: boolean) => void;
  setEditedSummary: (summary: string) => void;
  setError: (message: string) => void;
}): Promise<boolean> => {
  const trimmedRawText = rawText.trim();
  if (!trimmedRawText) return false;

  setIsSaving(true);
  setError("");

  try {
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rawText: trimmedRawText,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to summarize OCR text.");
    }

    const data = (await response.json()) as { summary?: string };
    const enhancedSummary = (data.summary || "").trim();

    if (!enhancedSummary) {
      throw new Error("No summary output was returned.");
    }

    setEditedSummary(enhancedSummary);
    playSuccessChime();
    return true;
  } catch (error) {
    console.error("Failed to run summarize:", error);
    setError("Unable to summarize the edited OCR text. Please continue editing manually.");
    return false;
  } finally {
    setIsSaving(false);
  }
};
