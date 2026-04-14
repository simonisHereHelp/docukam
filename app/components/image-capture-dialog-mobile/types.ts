import type React from "react"; // Required for React.RefObject
import type { FacingMode, WebCameraHandler } from "@/lib/react-web-camera";
import type { IssuerCanonEntry } from "@/lib/issuerCanon";

export interface Image {
  url: string;
  file: File;
}

export interface SubfolderOption {
  topic: string;
  folderId?: string;
  keywords?: string[];
  description?: string;
}

export interface State {
  images: Image[];
  facingMode: FacingMode;
  isSaving: boolean;
  isProcessingCapture: boolean;
  showGallery: boolean;
  cameraError: boolean;
  captureSource: "camera" | "photos";
  editorMode: "raw-text" | "meta-summary";
  ocrSummary: string;
  editedSummary: string;
  error: string;
  saveMessage: string;
  availableSubfolders: SubfolderOption[];
  selectedSubfolder: SubfolderOption | null;
  subfolderLoading: boolean;
  subfolderError: string;
  issuerCanons: IssuerCanonEntry[];
  issuerCanonsLoading: boolean;
  canonError: string;
  selectedCanon: IssuerCanonEntry | null;
}

export interface Actions {
  deleteImage: (index: number) => void;
  handleCapture: () => Promise<void>;
  handleCameraSwitch: () => Promise<void>;
  handleAlbumSelect: (files: FileList | null) => Promise<void>;
  handleSummarize: () => Promise<void>;
  handleImg2SixW: () => Promise<void>;
  handleEnhance: () => Promise<void>;
  handleSaveImages: () => Promise<void>;
  handleClose: () => void;
  setCaptureSource: (source: "camera" | "photos") => void;
  setEditorMode: (mode: "raw-text" | "meta-summary") => void;
  setEditedSummary: (summary: string) => void;
  setOcrSummary: (summary: string) => void;
  setShowGallery: (show: boolean) => void;
  setCameraError: (error: boolean) => void;
  setError: (message: string) => void;
  setCanonError: (message: string) => void;
  refreshSubfolders: () => Promise<void>;
  selectSubfolder: (subfolder: SubfolderOption) => void;
  refreshCanons: () => Promise<void>;
  selectCanon: (canon: IssuerCanonEntry) => void;
}

export interface CameraViewProps {
  state: State;
  actions: Actions;
  cameraRef: React.RefObject<WebCameraHandler | null>;
}
