# README_UI

## Current UI Theme

The active UI theme is 6W-first.

Old OCR and summarize stages have been removed from the user flow. The current product centers on one extraction action and one editor surface.

## Landing Page

- Title: `Doc-to-6Ws`
- Repo subtitle appears once below the action buttons
- Camera access should only happen when `Launch Camera` is used

## Camera View

- Primary action: `Xtract`
- This sends images to `/api/img-2-6w`

## Album View

- Editor header: `EDIT 6Ws`
- The editor displays the current 6W text
- The user may edit all fields directly
- Issuer Canon can overwrite the `單位` line

## Save Behavior

- `Save to Drive` is available when edited 6W text exists
- Saved output includes markdown, JSON sidecar, and images
