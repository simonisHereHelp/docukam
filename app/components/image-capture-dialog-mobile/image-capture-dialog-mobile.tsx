// app/components/image-capture-dialog-mobile/ImageCaptureDialogMobile.tsx
"use client";

import { Dialog, DialogContent, DialogTitle } from "@/ui/components";
import { CameraView } from "./CameraView";
import { GalleryView } from "./GalleryView";
import { useImageCaptureState } from "./useImageCaptureState";

interface ImageCaptureDialogMobileProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  initialSource?: "camera" | "photos";
}

export function ImageCaptureDialogMobile({
  open,
  onOpenChange,
  initialSource = "camera",
}: ImageCaptureDialogMobileProps) {
  if (!open) {
    return null;
  }

  const { state, actions, cameraRef } = useImageCaptureState(
    onOpenChange,
    initialSource,
  );

  const { showGallery } = state;
  const { handleClose } = actions;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTitle className="sr-only">Image Capture</DialogTitle>

      <DialogContent className="fixed inset-0 left-0 top-0 grid h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-black p-0 shadow-none sm:inset-auto sm:left-[50%] sm:top-[50%] sm:h-[680px] sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem] sm:shadow-lg [&>button:last-child]:hidden">
        <div className="relative flex h-full min-h-0 w-full flex-col bg-black">
          {!showGallery && (
            <CameraView
              state={state}
              actions={actions}
              cameraRef={cameraRef}
            />
          )}

          {showGallery && <GalleryView state={state} actions={actions} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImageCaptureDialogMobile;
