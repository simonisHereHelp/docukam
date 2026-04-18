# Doc-to-6Ws

This repo is the active 6W variant of the DocuKam project.

It is a Next.js app that:

- captures or selects document images
- sends images to an image-to-6W service
- lets the user edit the returned 6W text
- lets Issuer Canon overwrite the `單位` field
- saves the final result plus source images to Google Drive

## Current Runtime Flow

1. Open `Launch Camera` or `Photo Album`
2. Capture or choose one or more images
3. Run `Xtract`
4. Review and edit the returned 6W text in the album editor
5. Optionally apply an issuer canon to overwrite `單位`
6. Save to Drive

## Active API Route

### `/api/img-2-6w`

- Input: uploaded image files
- Backend target: `IMG_2_6W_URL`
- Output: 6W plain text

Current normalized output format:

```text
單位: ...
收件人: ...
日期: ...
主題: ...
地點: ...
abstract_summary: ...
```

If multiple images are uploaded, the route calls the service once per image and joins the returned 6W blocks into one editor payload.

## Active Frontend Flow

- Camera action button: `Xtract`
- Album editor label: `EDIT 6Ws`
- Issuer Canon behavior: overwrite the `單位` line in the current text
- Save button: enabled whenever edited 6W text exists

## Save Output

Each saved set currently uploads:

- `xxxx.md`
  final edited 6W text and image links
- `xxxx.json`
  JSON sidecar built from the source text currently held by the app
- `xxxx-p1.jpeg`, `xxxx-p2.jpeg`, ...
  source images

## Environment Variables

Required:

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DRIVE_FOLDER_ID`
- `IMG_2_6W_URL`

Optional:

- `IMG_2_6W_TIMEOUT_MS`
- `IMG_2_6W_BEARER_TOKEN`
- `DRIVE_FALLBACK_FOLDER_ID`
- `CANONICALS_BIBLE_JSON_PATH`
- `DRIVE_ACTIVE_SUBFOLDER_PATH`

Older OCR-plus-summarize environment variables are no longer part of the active pipeline.

## Repo Identity

Landing page subtitle reference:

- `docuKam`
- `8ball-docuKam`

This repo is the active 6W evolution line, while `main_docuKam` preserves the earlier DocuKam baseline.
