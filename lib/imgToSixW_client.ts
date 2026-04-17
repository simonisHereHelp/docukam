import { playSuccessChime } from "../app/components/image-capture-dialog-mobile/soundEffects";
import { formatSixWFromRecord } from "@/lib/formatSixWText";
import { prepareImg2SixWUpload } from "@/lib/prepareImg2SixWUpload";

export interface SummaryImage {
  url: string;
  file: File;
}

interface Img2SixWPayload {
  單位?: string;
  主題?: string;
  日期?: string;
  收件人?: string;
  地點?: string;
  abstract_summary?: string;
}

export const runImgToSixWExtract = async ({
  images,
  setIsSaving,
  setSourceSummary,
  setEditedSummary,
  setError,
}: {
  images: SummaryImage[];
  setIsSaving: (isSaving: boolean) => void;
  setSourceSummary: (summary: string) => void;
  setEditedSummary: (summary: string) => void;
  setError: (message: string) => void;
}): Promise<boolean> => {
  if (images.length === 0) return false;

  setIsSaving(true);
  setError("");

  try {
    const serviceBaseUrl = process.env.NEXT_PUBLIC_IMG_2_6W_URL;
    if (!serviceBaseUrl) {
      throw new Error("Missing NEXT_PUBLIC_IMG_2_6W_URL.");
    }

    const summaries: string[] = [];

    for (const [index, image] of images.entries()) {
      const preparedUpload = await prepareImg2SixWUpload(image.file);
      const formData = new FormData();
      formData.append("image", preparedUpload, preparedUpload.name);

      const response = await fetch(
        `${serviceBaseUrl.replace(/\/+$/, "")}/6w`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to run img-2-6w.");
      }

      const payload = (await response.json()) as Img2SixWPayload;
      const summary = formatSixWFromRecord(payload).trim();
      summaries.push(images.length > 1 ? `Image ${index + 1}\n\n${summary}` : summary);
    }

    const extractedSummary = summaries.join("\n\n").trim();

    if (!extractedSummary) {
      throw new Error("No img-2-6w output was returned.");
    }

    setSourceSummary(extractedSummary);
    setEditedSummary(extractedSummary);
    playSuccessChime();
    return true;
  } catch (error) {
    console.error("Failed to run img-2-6w:", error);
    setError("Unable to run the image-to-6W route.");
    return false;
  } finally {
    setIsSaving(false);
  }
};
