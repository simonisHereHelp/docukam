# README_UI

This file is a short final-state UI note for DocuKam.

## Current UI Flow

### Landing page

- `Launch Camera`
  Opens the camera dialog and is the only path that should request media access.
- `Photo Album`
  Opens the same document workflow without requesting camera access.

### Camera view

- Primary action label: `OCR xtract`
- Result: sends captured images to `/api/ocr-extract`

### Album / editor view

- Header before summarize: `EDIT OCR TEXT`
- Header after summarize: `EDIT SUMMARY`
- Action button in editor header: `Summarize`
- OCR output and summary output both use the same editor container

### Editor behavior

- OCR stage:
  - Editor contains OCR plain text
  - User edits are used as the input to `/api/summarize`
- Summary stage:
  - Editor contains 6W summary text
  - User edits are used as the input to `Save to Drive`

### Save gating

- `Save to Drive` is disabled until summarize succeeds
- A saved set includes:
  - one markdown master file
  - one OCR JSON sidecar
  - one or more image files

## Current UI Intent

- Reuse one editor surface across OCR and summary stages
- Keep the workflow mobile-friendly
- Keep photo album and camera paths aligned
- Treat OCR text and 6W summary as user-editable working content
