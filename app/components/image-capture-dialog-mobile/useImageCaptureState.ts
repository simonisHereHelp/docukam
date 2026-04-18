import { useRef, useState, useCallback, useEffect } from "react";
import type { WebCameraHandler, FacingMode } from "@/lib/react-web-camera";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { handleSave } from "@/lib/handleSave";
import { runImgToSixWExtract } from "@/lib/imgToSixW_client";
import { runImgToOcrTextExtract } from "@/lib/imgToOcrText_client";
import { normalizeFilename } from "@/lib/normalizeFilename";
import {
  CaptureError,
  DEFAULTS,
  normalizeCapture,
} from "../shared/normalizeCapture";
import type { Image, State, Actions, SubfolderOption } from "./types";
import {
  applyCanonToSummary,
  fetchIssuerCanonList,
  type IssuerCanonEntry,
} from "./issuerCanonUtils";
import { playSuccessChime } from "./soundEffects";

interface UseImageCaptureState {
  state: State;
  actions: Actions;
  cameraRef: React.RefObject<WebCameraHandler | null>;
}

export const useImageCaptureState = (
  onOpenChange?: (open: boolean) => void,
  initialSource: "camera" | "photos" = "camera",
): UseImageCaptureState => {
  const [images, setImages] = useState<Image[]>([]);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingCapture, setIsProcessingCapture] = useState(false);
  const [isModelReady, setModelReady] = useState(false);
  const [isCheckingModelReady, setIsCheckingModelReady] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [captureSource, setCaptureSource] = useState<"camera" | "photos">(initialSource);

  const [sourceSummary, setSourceSummary] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [sourceOcrText, setSourceOcrText] = useState("");
  const [editedOcrText, setEditedOcrText] = useState("");

  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [availableSubfolders, setAvailableSubfolders] = useState<SubfolderOption[]>([]);
  const [selectedSubfolder, setSelectedSubfolder] = useState<SubfolderOption | null>(null);
  const [subfolderLoading, setSubfolderLoading] = useState(false);
  const [subfolderError, setSubfolderError] = useState("");

  const [issuerCanons, setIssuerCanons] = useState<IssuerCanonEntry[]>([]);
  const [issuerCanonsLoading, setIssuerCanonsLoading] = useState(false);
  const [canonError, setCanonError] = useState("");
  const [selectedCanon, setSelectedCanon] = useState<IssuerCanonEntry | null>(null);

  const cameraRef = useRef<WebCameraHandler | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    setCaptureSource(initialSource);
  }, [initialSource]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let warmupRequested = false;

    const pollReady = async () => {
      if (cancelled) return;

      setIsCheckingModelReady(true);

      try {
        const response = await fetch("/api/img-2-6w-ready", {
          method: "GET",
          cache: "no-store",
        });
        const json = (await response.json().catch(() => null)) as
          | { ready?: boolean }
          | null;

        if (cancelled) return;

        if (json?.ready) {
          setModelReady(true);
          setIsCheckingModelReady(false);
          return;
        }

        if (!warmupRequested) {
          warmupRequested = true;
          await fetch("/api/img-2-6w-warmup", {
            method: "POST",
            cache: "no-store",
          }).catch(() => null);
        }

        setModelReady(false);
        setIsCheckingModelReady(false);
        pollTimer = setTimeout(pollReady, 5000);
      } catch {
        if (cancelled) return;
        setModelReady(false);
        setIsCheckingModelReady(false);
        pollTimer = setTimeout(pollReady, 5000);
      }
    };

    void pollReady();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, []);

  const deleteImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetSummaryState = useCallback(() => {
    setSourceSummary("");
    setEditedSummary("");
    setSourceOcrText("");
    setEditedOcrText("");
    setSaveMessage("");
    setError("");
  }, []);

  const handleClose = useCallback(() => {
    if (images.length > 0 && !isSaving) {
      if (!window.confirm("You have unsaved images. Are you sure you want to close?")) {
        return;
      }
    }

    setImages([]);
    resetSummaryState();
    setShowGallery(false);
    setAvailableSubfolders([]);
    setSelectedSubfolder(null);
    setSubfolderError("");
    setIssuerCanons([]);
    setCanonError("");
    setSelectedCanon(null);
    setCaptureSource(initialSource);
    setIsProcessingCapture(false);
    onOpenChange?.(false);
  }, [images.length, initialSource, isSaving, onOpenChange, resetSummaryState]);

  const ingestFile = useCallback(
    async (file: File, source: "camera" | "photos", preferredName?: string) => {
      setIsProcessingCapture(true);
      setError("");

      try {
        const { file: normalizedFile, previewUrl } = await normalizeCapture(file, source, {
          maxFileSize: DEFAULTS.MAX_FILE_SIZE,
          preferredName,
        });

        resetSummaryState();
        setShowGallery(false);
        setImages((prev) => [...prev, { url: previewUrl, file: normalizedFile }]);
      } catch (err) {
        setError(err instanceof CaptureError ? err.message : "Unable to process the image.");
      } finally {
        setIsProcessingCapture(false);
      }
    },
    [resetSummaryState],
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      const file = await cameraRef.current.capture();
      if (file) await ingestFile(file, "camera", `capture-${Date.now()}.jpeg`);
    } catch {
      setError("Unable to access camera capture.");
    }
  }, [ingestFile]);

  const handleAlbumSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await ingestFile(files[0], "photos");
  }, [ingestFile]);

  const handleCameraSwitch = useCallback(async () => {
    if (!cameraRef.current) return;
    const newMode = facingMode === "user" ? "environment" : "user";
    await cameraRef.current.switch(newMode);
    setFacingMode(newMode);
  }, [facingMode]);

  const handleImg2SixW = useCallback(async () => {
    setSaveMessage("");
    setError("");

    const [didSixW, didOcrText] = await Promise.all([
      runImgToSixWExtract({
        images,
        setIsSaving,
        setSourceSummary,
        setEditedSummary,
        setError,
      }),
      runImgToOcrTextExtract({
        images,
        setSourceOcrText,
        setEditedOcrText,
        onError: setError,
      }),
    ]);

    if ((didSixW || didOcrText) && images.length > 0) {
      setShowGallery(true);
    }
  }, [images]);

  const refreshCanons = useCallback(async () => {
    if (issuerCanonsLoading) return;
    setIssuerCanonsLoading(true);
    setCanonError("");

    try {
      const entries = await fetchIssuerCanonList();
      setIssuerCanons(entries);
    } catch (err) {
      setCanonError(err instanceof Error ? err.message : "Unable to load canon list.");
    } finally {
      setIssuerCanonsLoading(false);
    }
  }, [issuerCanonsLoading]);

  const refreshSubfolders = useCallback(async () => {
    if (subfolderLoading) return;
    setSubfolderLoading(true);
    setSubfolderError("");

    try {
      const response = await fetch("/api/active-subfolders");
      if (!response.ok) {
        throw new Error("Unable to load subfolder options.");
      }

      const json = (await response.json().catch(() => null)) as
        | { subfolders?: SubfolderOption[] }
        | null;

      setAvailableSubfolders(json?.subfolders ?? []);
    } catch (err) {
      setSubfolderError(err instanceof Error ? err.message : "Unable to load subfolder options.");
    } finally {
      setSubfolderLoading(false);
    }
  }, [subfolderLoading]);

  const selectSubfolder = useCallback((subfolder: SubfolderOption) => {
    setSelectedSubfolder(subfolder);
  }, []);

  const selectCanon = useCallback((canon: IssuerCanonEntry) => {
    setSelectedCanon(canon);
    setEditedSummary((current) =>
      applyCanonToSummary({
        canon,
        currentSummary: current,
        sourceSummary,
      }),
    );
  }, [sourceSummary]);

  useEffect(() => {
    if (showGallery && !issuerCanons.length && !issuerCanonsLoading) {
      refreshCanons();
    }
  }, [showGallery, issuerCanons.length, issuerCanonsLoading, refreshCanons]);

  useEffect(() => {
    if (showGallery && !availableSubfolders.length && !subfolderLoading) {
      refreshSubfolders();
    }
  }, [showGallery, availableSubfolders.length, subfolderLoading, refreshSubfolders]);

  const handleSaveImages = useCallback(async () => {
    if (isSaving) return;

    if (!session) {
      setError("Google login is required before saving to Drive.");
      return;
    }

    if (!images.length) {
      setError("No images are available to save.");
      return;
    }

    const finalSummary = editedSummary.trim();
    if (!finalSummary) {
      setError("Please ensure the summary is not empty before saving.");
      return;
    }

    const finalOcrText = editedOcrText.trim();
    if (!finalOcrText) {
      setError("Please ensure the OCR text is not empty before saving.");
      return;
    }

    setSaveMessage("");
    setError("");

    await handleSave({
      images,
      sourceSummary,
      finalSummary,
      ocrText: finalOcrText,
      accessToken: ((session as any)?.accessToken as string | undefined) ?? "",
      selectedCanon,
      selectedSubfolder,
      setIsSaving,
      onError: setError,
      onSuccess: ({ setName, targetFolderId, topic }) => {
        setShowGallery(false);
        const folderPath = topic || targetFolderId?.split("/").pop() || "Drive";
        const displayPath = folderPath.replace(/^Drive_/, "");
        const resolvedName = normalizeFilename(setName || "(untitled)");

        sessionStorage.setItem(
          "uploadConfirmation",
          JSON.stringify({ folder: displayPath, filename: resolvedName }),
        );
        window.dispatchEvent(new Event("upload-confirmation"));
        setSaveMessage(`uploaded to: ${displayPath}\nname: ${resolvedName}`);
        setImages([]);
        setSourceSummary("");
        setEditedSummary("");
        setSourceOcrText("");
        setEditedOcrText("");
        setSelectedCanon(null);
        setSelectedSubfolder(null);
        playSuccessChime();
        onOpenChange?.(false);
        router.push("/");
      },
    });
  }, [
    session,
    isSaving,
    images,
    sourceSummary,
    editedSummary,
    selectedCanon,
    selectedSubfolder,
    onOpenChange,
    router,
  ]);

  const state: State = {
    images,
    facingMode,
    isSaving,
    isProcessingCapture,
    isModelReady,
    isCheckingModelReady,
    showGallery,
    cameraError,
    captureSource,
    sourceSummary,
    editedSummary,
    sourceOcrText,
    editedOcrText,
    error,
    saveMessage,
    availableSubfolders,
    selectedSubfolder,
    subfolderLoading,
    subfolderError,
    issuerCanons,
    issuerCanonsLoading,
    canonError,
    selectedCanon,
  };

  const actions: Actions = {
    deleteImage,
    handleCapture,
    handleAlbumSelect,
    handleCameraSwitch,
    handleImg2SixW,
    handleSaveImages,
    handleClose,
    setCaptureSource,
    setEditedSummary,
    setSourceSummary,
    setEditedOcrText,
    setSourceOcrText,
    setModelReady,
    setShowGallery,
    setCameraError,
    setError,
    setCanonError,
    refreshSubfolders,
    selectSubfolder,
    refreshCanons,
    selectCanon,
  };

  return { state, actions, cameraRef };
};
