import { playSuccessChime } from "../app/components/image-capture-dialog-mobile/soundEffects";
import { uploadDriveFileResumable } from "@/lib/driveResumableUpload";

export interface Image {
  url: string;
  file: File;
}

export interface SelectedCanonMeta {
  master: string;
  aliases?: string[];
}

export interface SelectedSubfolderMeta {
  topic: string;
  folderId?: string;
}

interface SavePlanResponse {
  setName?: string;
  targetFolderId?: string | null;
  topic?: string | null;
  markdownFileName?: string;
  markdownText?: string;
  jsonFileName?: string;
  jsonText?: string;
  imageUploads?: Array<{
    sourceIndex: number;
    fileName: string;
    mimeType: string;
  }>;
}

/**
 * Saves the current images and edited summary via /api/save-set.
 * The server derives the final set name and persists the issuer canon update.
 */
export const handleSave = async ({
  images,
  sourceSummary,
  finalSummary,
  ocrText,
  accessToken,
  selectedCanon,
  selectedSubfolder,
  setIsSaving,
  onError,
  onSuccess,
}: {
  images: Image[];
  sourceSummary: string;
  finalSummary: string;
  ocrText: string;
  accessToken: string;
  selectedCanon?: SelectedCanonMeta | null;
  selectedSubfolder?: SelectedSubfolderMeta | null;
  setIsSaving: (isSaving: boolean) => void;
  onError?: (message: string) => void;
  onSuccess?: (meta: {
    setName: string;
    targetFolderId?: string | null;
    topic?: string | null;
  }) => void;
}): Promise<boolean> => {
  if (!images.length) return false;
  if (!accessToken) {
    onError?.("Google Drive access token is missing. Please log in again.");
    return false;
  }

  const trimmedFinalSummary = finalSummary.trim();
  if (!trimmedFinalSummary) return false;

  setIsSaving(true);

  try {
    console.info("[save] requesting save plan", {
      imageCount: images.length,
      hasSelectedCanon: Boolean(selectedCanon),
      hasSelectedSubfolder: Boolean(selectedSubfolder),
    });

    const response = await fetch("/api/save-set", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: trimmedFinalSummary,
        ocrText: ocrText.trim(),
        selectedCanon,
        selectedSubfolder,
        images: images.map((image) => ({
          name: image.file.name,
          type: image.file.type,
        })),
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to save files to Google Drive.");
    }

    const plan = (await response.json().catch(() => null)) as SavePlanResponse | null;
    const targetFolderId = plan?.targetFolderId ?? null;

    console.info("[save] save plan ready", {
      setName: plan?.setName ?? "",
      targetFolderId,
      imageUploads: plan?.imageUploads?.length ?? 0,
    });

    if (
      !targetFolderId ||
      !plan?.markdownFileName ||
      !plan?.markdownText ||
      !plan?.jsonFileName ||
      !plan?.jsonText ||
      !Array.isArray(plan.imageUploads)
    ) {
      throw new Error("Save plan is incomplete.");
    }

    for (const imageUpload of plan.imageUploads) {
      const sourceImage = images[imageUpload.sourceIndex];
      if (!sourceImage) {
        throw new Error(`Missing source image for upload index ${imageUpload.sourceIndex}.`);
      }

      await uploadDriveFileResumable({
        accessToken,
        folderId: targetFolderId,
        fileName: imageUpload.fileName,
        mimeType: imageUpload.mimeType,
        file: sourceImage.file,
      });
    }

    console.info("[save] uploading metadata files", {
      jsonFileName: plan.jsonFileName,
      markdownFileName: plan.markdownFileName,
    });

    await uploadDriveFileResumable({
      accessToken,
      folderId: targetFolderId,
      fileName: plan.jsonFileName,
      mimeType: "application/json",
      file: new Blob([plan.jsonText], { type: "application/json" }),
    });

    await uploadDriveFileResumable({
      accessToken,
      folderId: targetFolderId,
      fileName: plan.markdownFileName,
      mimeType: "text/markdown",
      file: new Blob([plan.markdownText], { type: "text/markdown" }),
    });

    try {
      const updateResponse = await fetch("/api/update-issuerCanon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceSummary: sourceSummary.trim(),
          finalSummary: trimmedFinalSummary,
        }),
        credentials: "include",
      });

      if (!updateResponse.ok) {
        console.warn(`[update-issuerCanon] Server warning/error: ${updateResponse.status}`);
      }
    } catch (error) {
      // Canon updates should not block the main save flow.
      console.error("Error calling /api/update-issuerCanon:", error);
    }

    onSuccess?.({
      setName: plan?.setName ?? "",
      targetFolderId,
      topic: plan?.topic ?? null,
    });

    playSuccessChime();
    return true;
  } catch (error) {
    console.error("Failed to save images:", error);
    onError?.(
      error instanceof Error
        ? error.message
        : "Unable to save captured images. Please try again.",
    );
    return false;
  } finally {
    setIsSaving(false);
  }
};
