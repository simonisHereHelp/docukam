import { Loader2, Save, Sparkles, X, RefreshCw } from "lucide-react";
import { Button } from "@/ui/components";
import type { State, Actions } from "./types";

export function GalleryView({ state, actions }: { state: State; actions: Actions }) {
  return (
    <div className="absolute inset-0 bg-black/95 z-40 flex flex-col">
      <div className="flex justify-between p-4 border-b border-white/10">
        <h3 className="text-white font-bold">{state.images.length} Photos</h3>
        <button
          onClick={() => actions.setShowGallery(false)}
          className="app-button h-8 w-8 rounded-full flex items-center justify-center"
        >
          <X />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Responsive Image Grid */}
        <div className="grid grid-cols-2 gap-2">
          {state.images.map((img, i) => (
            <div key={i} className="relative aspect-square bg-white/5 rounded-lg overflow-hidden">
              <img src={img.url} className="object-contain w-full h-full" />
              <button
                onClick={() => actions.deleteImage(i)}
                className="app-button absolute top-1 right-1 h-6 w-6 rounded-full flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary Editor Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-blue-300">
                  {state.editorMode === "raw-text" ? "EDIT OCR TEXT" : "EDIT SUMMARY"}
                </label>
                <span className="text-[10px] text-white/55">
                  {state.editorMode === "raw-text"
                    ? "OCR raw text. Your edits will be used for summarize."
                    : "Meta summary output. You can refine it and apply issuer canon."}
                </span>
              </div>
              <Button
                onClick={actions.handleEnhance}
                disabled={state.isSaving || (!state.ocrSummary.trim() && !state.editedSummary.trim())}
                className="app-button h-8 px-3"
              >
                {state.isSaving ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-3 w-3" />
                )}
                <span className="app-button-label">Summarize</span>
              </Button>
            </div>
            <textarea
              value={state.editedSummary}
              onChange={(e) => actions.setEditedSummary(e.target.value)}
              placeholder={
                state.editorMode === "raw-text"
                  ? "OCR raw text will appear here. Edit it before summarize."
                  : "Meta summary output will appear here. You can refine it before saving."
              }
              className="w-full min-h-[150px] bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Canon Selection */}
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-blue-300">ISSUER CANONS</span>
              <button
                onClick={actions.refreshCanons}
                disabled={state.editorMode === "raw-text"}
                className="app-button h-6 w-6 rounded-full flex items-center justify-center"
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
                  disabled={state.editorMode === "raw-text"}
                  className={`text-[10px] px-3 py-1 rounded-full border transition ${
                    state.selectedCanon?.master === canon.master
                      ? "bg-blue-600 border-blue-400"
                      : "border-white/20 text-white/70"
                  }`}
                >
                  {canon.master}
                </button>
              ))}
            </div>
            {state.editorMode === "raw-text" && (
              <p className="mt-2 text-[10px] text-white/55">
                Enhance first to turn OCR text into meta summary before applying issuer canon.
              </p>
            )}
          </div>

          {/* Target Subfolder Selection */}
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-blue-300">TARGET SUBFOLDER</span>
              <button
                onClick={actions.refreshSubfolders}
                className="app-button h-6 w-6 rounded-full flex items-center justify-center"
              >
                <RefreshCw size={14} className={state.subfolderLoading ? "animate-spin" : ""} />
              </button>
            </div>
            {state.subfolderError && (
              <p className="text-[10px] text-red-300 mb-2">{state.subfolderError}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {state.availableSubfolders.length === 0 && !state.subfolderLoading ? (
                <span className="text-[10px] text-white/60">No subfolders configured.</span>
              ) : (
                state.availableSubfolders.map((subfolder) => (
                  <button
                    key={subfolder.topic}
                    onClick={() => actions.selectSubfolder(subfolder)}
                    className={`text-[10px] px-3 py-1 rounded-full border transition ${
                      state.selectedSubfolder?.topic === subfolder.topic
                        ? "bg-blue-600 border-blue-400"
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

      <div className="p-4 border-t border-white/10">
        <Button
          onClick={actions.handleSaveImages}
          disabled={
            state.isSaving ||
            state.editorMode !== "meta-summary" ||
            !state.editedSummary.trim()
          }
          className="app-button w-full h-12"
        >
          {state.isSaving ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Save className="mr-2" />
          )}{" "}
          <span className="app-button-label">
            {state.editorMode === "meta-summary" ? "Save to Drive" : "Enhance to Enable Save"}
          </span>
        </Button>
      </div>
    </div>
  );
}
