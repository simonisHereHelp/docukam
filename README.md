# DocuKam

DocuKam is a Next.js app for capturing document images, summarizing them with OpenAI, and saving the images plus a generated `summary.md` file into Google Drive.

This repository is now structured as a single app at the repo root so it deploys cleanly on Vercel without workspace/package coupling.

## Structure

- `app`: App Router pages, metadata, and API routes
- `lib`: Drive, prompt, filename, and local camera helpers
- `ui`: shared UI components
- `json_canon`: local prompt and canon JSON files
- `dist`: vendored camera component bundle used by the app

## Environment variables

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `DRIVE_FOLDER_ID`

Optional source overrides:

- `CANONICALS_BIBLE_JSON_PATH` or `DRIVE_FILE_ID_CANONICALS`
- `PROMPT_SUMMARY_JSON_PATH` or `PROMPT_SUMMARY_JSON_ID`
- `PROMPT_SET_NAME_JSON_PATH` or `PROMPT_SET_NAME_JSON_ID`
- `PROMPT_DESIGNATED_SUBFOLDER` or `PROMPT_DESIGNATED_SUBFOLDER_ID`
- `DRIVE_ACTIVE_SUBFOLDER_PATH` or `DRIVE_ACTIVE_SUBFOLDER_ID`
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
