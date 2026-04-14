import { playSuccessChime } from "../app/components/image-capture-dialog-mobile/soundEffects";

export interface SummaryImage {
  url: string;
  file: File;
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
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("image", image.file);
    });

    const response = await fetch("/api/img-2-6w", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to run img-2-6w.");
    }

    const data = (await response.json()) as { summary?: string };
    const extractedSummary = (data.summary || "").trim();

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
