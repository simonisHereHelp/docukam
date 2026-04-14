import {
  Camera,
  CameraOff,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
  Save,
  X,
} from "lucide-react";
import WebCamera from "@/lib/react-web-camera";
import { Button } from "@/ui/components";
import type { CameraViewProps } from "./types";

export function CameraView({ state, actions, cameraRef }: CameraViewProps) {
  const isCamera = state.captureSource === "camera";
  const latestImage = state.images[state.images.length - 1];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col p-0.5">
        {state.cameraError && isCamera && (
          <div className="flex h-full w-full flex-col items-center justify-center bg-black text-white/50">
            <CameraOff className="mb-4 h-12 w-12" />
            <p>Camera unavailable.</p>
          </div>
        )}

        {isCamera && !state.cameraError && (
          <WebCamera
            ref={cameraRef}
            className="h-full w-full object-cover"
            videoClassName="rounded-lg"
            captureMode="back"
            onError={() => actions.setCameraError(true)}
          />
        )}

        {!isCamera && (
          <div className="relative flex w-full min-h-0 flex-1 items-center justify-center rounded-lg bg-black">
            {latestImage ? (
              <img src={latestImage.url} className="max-h-full object-contain" alt="Preview" />
            ) : (
              <div className="text-center text-white/60">
                <ImageIcon className="mx-auto mb-2 h-10 w-10" />
                <p>Pick a photo</p>
              </div>
            )}
            <div className="absolute bottom-6 flex w-full flex-col gap-2 px-8">
              <Button
                onClick={() => document.getElementById("photo-picker")?.click()}
                className="app-button"
              >
                {state.isProcessingCapture && <Loader2 className="mr-2 animate-spin" />}
                <span className="app-button-label">Choose Photo</span>
              </Button>
            </div>
          </div>
        )}

        {isCamera && (
          <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-between px-6 pb-[max(env(safe-area-inset-bottom),0px)] sm:px-8">
            <button
              onClick={() => actions.setShowGallery(true)}
              className="app-button h-16 w-16 overflow-hidden rounded-xl border-2 border-white/30"
            >
              {latestImage ? (
                <img src={latestImage.url} className="h-full w-full object-cover" alt="Latest capture" />
              ) : (
                <div className="h-full w-full" />
              )}
            </button>

            <Button
              onClick={actions.handleCapture}
              disabled={state.isSaving || state.cameraError}
              className="app-button h-20 w-20 rounded-full border-4 border-white/50"
            >
              <Camera className="h-8 w-8" />
            </Button>

            <Button
              onClick={actions.handleCameraSwitch}
              className="app-button h-16 w-16 rounded-full"
            >
              <RefreshCcw
                className={`transition-transform ${
                  state.facingMode === "user" ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-2 bg-black/80 p-4 pb-[calc(1rem+max(env(safe-area-inset-bottom),0px))]">
        <Button onClick={actions.handleClose} className="app-button flex-1">
          <X className="mr-2 h-4 w-4" /> <span className="app-button-label">Cancel</span>
        </Button>
        <Button
          onClick={actions.handleImg2SixW}
          disabled={
            state.images.length === 0 ||
            state.isSaving ||
            state.isCheckingModelReady ||
            !state.isModelReady
          }
          className="app-button flex-1"
        >
          {state.isSaving || state.isCheckingModelReady ? (
            <Loader2 className="mr-2 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}{" "}
          <span className="app-button-label">
            {state.isCheckingModelReady
              ? "Warming..."
              : state.isModelReady
                ? "Xtract"
                : "Model Loading"}
          </span>
        </Button>
      </div>

      <input
        id="photo-picker"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => actions.handleAlbumSelect(e.target.files)}
      />
    </div>
  );
}
