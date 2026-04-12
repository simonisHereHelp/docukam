# DocuKam

DocuKam is a Next.js app for capturing document images, extracting OCR text with Paddle OCR, enhancing summaries through the Qwen ingestion backend, and saving the images plus a generated `summary.md` file into Google Drive.

This repository is now structured as a single app at the repo root so it deploys cleanly on Vercel without workspace/package coupling.

## Structure

- `app`: App Router pages, metadata, and API routes
- `lib`: Drive, summary pipeline, filename, and local camera helpers
- `ui`: shared UI components
- `json_canon`: local prompt and canon JSON files
- `dist`: vendored camera component bundle used by the app

## Summary pipeline

- `POST /api/ocr-extract`: image upload to Paddle OCR `/extract`
- `POST /api/summarize`: OCR text to Qwen `/ingest` using `PROMPT_SUMMARY_JSON_PATH`

## Environment variables

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DRIVE_FOLDER_ID`
- `PADDLE_OCR_URL`
- `PADDLE_OCR_BEARER_TOKEN`
- `QWEN_HF_URL`

Optional source overrides:

- `CANONICALS_BIBLE_JSON_PATH` or `DRIVE_FILE_ID_CANONICALS`
- `PROMPT_SUMMARY_JSON_PATH` or `PROMPT_SUMMARY_JSON_ID`
- `DRIVE_ACTIVE_SUBFOLDER_PATH` or `DRIVE_ACTIVE_SUBFOLDER_ID`
- `PADDLE_OCR_TIMEOUT_MS`
- `QWEN_HF_TOKEN`
- `DRIVE_FALLBACK_FOLDER_ID`

## Run locally

```powershell
npm install
npm run dev
```

## Deploy on Vercel

- Import the repo as a single Next.js project
- Root directory should be the repository root
- Copy the environment variables from the old project before deploying
