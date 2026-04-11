// app/content.tsx
"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "@/ui/components";
import { ImageCaptureDialogMobile } from "@/app/components";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

function Content() {
  const [dialogSource, setDialogSource] = useState<"camera" | "photos" | null>(
    null,
  );
  const [uploadConfirmation, setUploadConfirmation] = useState<{
    folder: string;
    filename: string;
  } | null>(null);
  const isMobile = useIsMobile();

  const { data: session } = useSession();

  const handleOpen = (source: "camera" | "photos") => setDialogSource(source);
  const handleClose = () => setDialogSource(null);

  useEffect(() => {
    const loadConfirmation = () => {
      const raw = sessionStorage.getItem("uploadConfirmation");
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as { folder?: string; filename?: string };
        if (parsed.folder && parsed.filename) {
          setUploadConfirmation({ folder: parsed.folder, filename: parsed.filename });
        }
      } catch (error) {
        console.warn("Unable to parse upload confirmation:", error);
      } finally {
        sessionStorage.removeItem("uploadConfirmation");
      }
    };

    loadConfirmation();

    const handleConfirmation = () => loadConfirmation();
    window.addEventListener("upload-confirmation", handleConfirmation);
    return () => window.removeEventListener("upload-confirmation", handleConfirmation);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto flex h-screen flex-col items-center px-4 py-8">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-slate-800 dark:text-slate-100">
            DocuKam
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Google Login: {session ? "Connected" : "Not connected"}
          </p>
          {!session ? (
            <Button onClick={() => signIn("google")} className="app-button mt-4">
              <span className="app-button-label">Login</span>
            </Button>
          ) : (
            <Button onClick={() => signOut()} className="app-button mt-4">
              <span className="app-button-label">Logout</span>
            </Button>
          )}
        </div>

        <div className="h-full w-full max-w-4xl flex-1">
          <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-800 md:p-12">
            <div className="text-center">
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    onClick={() => handleOpen("camera")}
                    className="app-button h-12 cursor-pointer rounded-lg text-lg font-medium shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl !px-8 !py-3"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    <span className="app-button-label">Launch Camera</span>
                  </Button>
                  <Button
                    onClick={() => handleOpen("photos")}
                    className="app-button h-12 cursor-pointer rounded-lg text-lg font-medium shadow-lg transition-all duration-200 hover:shadow-xl !px-8 !py-3"
                  >
                    <span className="app-button-label">Photo Album</span>
                  </Button>
                </div>
                {uploadConfirmation ? (
                  <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                    <p>upload to {uploadConfirmation.folder}</p>
                    <p>filename: {uploadConfirmation.filename}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isMobile
                      ? "Mobile-optimized interface"
                      : "Desktop-enhanced experience"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageCaptureDialogMobile
        open={dialogSource !== null}
        onOpenChange={handleClose}
        initialSource={dialogSource ?? "camera"}
      />
    </div>
  );
}

export default Content;
