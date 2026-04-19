import { Loader2, Save, X, RefreshCw } from "lucide-react";
import { Button } from "@/ui/components";
import type { State, Actions } from "./types";

export function GalleryView({ state, actions }: { state: State; actions: Actions }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black/95">
      <div className="flex justify-between border-b border-white/10 p-4">
        <h3 className="font-bold text-white">{state.images.length} Photos</h3>
        <button
          onClick={() => actions.setShowGallery(false)}
          className="app-button flex h-8 w-8 items-center justify-center rounded-full"
        >
          <X />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2">
          {state.images.map((img, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-white/5">
              <img src={img.url} className="h-full w-full object-contain" />
              <button
                onClick={() => actions.deleteImage(i)}
                className="app-button absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {state.error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {state.error}
            </div>
          )}

          {state.saveMessage && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200 whitespace-pre-line">
              {state.saveMessage}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-blue-300">EDIT 6Ws</label>
                <span className="text-[10px] text-white/55">
                  6W output. You can refine it directly, and Issuer Canon overwrites the {"\u55ae\u4f4d"} field.
                </span>
              </div>
            </div>
            <textarea
              value={state.editedSummary}
              onChange={(e) => actions.setEditedSummary(e.target.value)}
              placeholder="6W output will appear here. You can refine it before saving."
              className="min-h-[150px] w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-blue-300">EDIT OCR TEXT</label>
                <span className="text-[10px] text-white/55">
                  OCR text output. You can refine it directly before saving.
                </span>
              </div>
              <Button
                onClick={actions.handleImgToOcrText}
                disabled={state.isProcessingOcrText || state.images.length === 0}
                className="app-button h-10 px-4"
              >
                {state.isProcessingOcrText ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                <span className="app-button-label">Run OCR</span>
              </Button>
            </div>
            <textarea
              value={state.editedOcrText}
              onChange={(e) => actions.setEditedOcrText(e.target.value)}
              placeholder="OCR text will appear here. You can refine it before saving."
              className="min-h-[180px] w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300">ISSUER CANONS</span>
              <button
                onClick={actions.refreshCanons}
                className="app-button flex h-6 w-6 items-center justify-center rounded-full"
              >
                <RefreshCw
                  size={14}
                  className={state.issuerCanonsLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {state.issuerCanons.map((canon) => (
                <button
                  key={canon.master}
                  onClick={() => actions.selectCanon(canon)}
                  className={`rounded-full border px-3 py-1 text-[10px] transition ${
                    state.selectedCanon?.master === canon.master
                      ? "border-blue-400 bg-blue-600"
                      : "border-white/20 text-white/70"
                  }`}
                >
                  {canon.master}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-white/55">
              Selecting an issuer canon overwrites the {"\u55ae\u4f4d"} line in the current 6W text.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300">TARGET SUBFOLDER</span>
              <button
                onClick={actions.refreshSubfolders}
                className="app-button flex h-6 w-6 items-center justify-center rounded-full"
              >
                <RefreshCw size={14} className={state.subfolderLoading ? "animate-spin" : ""} />
              </button>
            </div>
            {state.subfolderError && (
              <p className="mb-2 text-[10px] text-red-300">{state.subfolderError}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {state.availableSubfolders.length === 0 && !state.subfolderLoading ? (
                <span className="text-[10px] text-white/60">No subfolders configured.</span>
              ) : (
                state.availableSubfolders.map((subfolder) => (
                  <button
                    key={subfolder.topic}
                    onClick={() => actions.selectSubfolder(subfolder)}
                    className={`rounded-full border px-3 py-1 text-[10px] transition ${
                      state.selectedSubfolder?.topic === subfolder.topic
                        ? "border-blue-400 bg-blue-600"
                        : "border-white/20 text-white/70"
                    }`}
                  >
                    {subfolder.topic}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <Button
          onClick={actions.handleSaveImages}
          disabled={state.isSaving}
          className="app-button h-12 w-full"
        >
          {state.isSaving ? (
            <Loader2 className="mr-2 animate-spin" />
          ) : (
            <Save className="mr-2" />
          )}{" "}
          <span className="app-button-label">Save to Drive</span>
        </Button>
      </div>
    </div>
  );
}
