# DocuKam

DocuKam is the document-capture app in this workspace. A signed-in user can open the camera or photo library, generate a summary with OpenAI, optionally apply an issuer canon, choose a Drive topic folder, and save the images plus a generated `summary.md` file into Google Drive.

The active app lives in `examples/with-nextjs`. The repository root still carries the upstream `@shivantra/react-web-camera` package metadata, so older package-oriented README content was not an accurate description of the app anymore.

## Current structure

- `examples/with-nextjs`: Next.js 15 app
- `examples/with-nextjs/app/components/image-capture-dialog-mobile`: mobile capture flow
- `examples/with-nextjs/app/api`: summarize, save, subfolder, and issuer-canon routes
- `examples/with-nextjs/auth.ts`: NextAuth Google provider setup
- `json_canon`: local JSON prompts and canon sources

## What the app does today

- Shows a landing page titled `DocuKam`
- Supports Google sign-in through NextAuth
- Opens a mobile-first camera or photo picker dialog
- Summarizes uploaded images through `/api/summarize`
- Saves images and a generated Markdown summary through `/api/save-set`
- Loads configurable Drive subfolder choices through `/api/active-subfolders`
- Updates issuer canon aliases through `/api/update-issuerCanon` when the canon source is a Drive file

## Environment variables

### Required for auth

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET`

The Google provider also requests `https://www.googleapis.com/auth/drive.file`.

### Required for AI

- `OPENAI_API_KEY`

### Required for Drive save flow

- `DRIVE_FOLDER_ID`

Optional:

- `DRIVE_FALLBACK_FOLDER_ID` defaults to `DRIVE_FOLDER_ID`
- `JSON_CANON_BASE_PATH` defaults to `<repo>/json_canon`

## JSON source resolution

Each JSON config can be supplied by local path or Drive file ID. If neither env var is set, the code falls back to a local file under `json_canon`.

- `PROMPT_SUMMARY_JSON_PATH` or `PROMPT_SUMMARY_JSON_ID`
- `PROMPT_SET_NAME_JSON_PATH` or `PROMPT_SET_NAME_JSON_ID`
- `PROMPT_ISSUER_CANON_JSON_PATH` or `PROMPT_ISSUER_CANON_JSON_ID`
- `PROMPT_DESIGNATED_SUBFOLDER` or `PROMPT_DESIGNATED_SUBFOLDER_ID`
- `DRIVE_ACTIVE_SUBFOLDER_PATH` or `DRIVE_ACTIVE_SUBFOLDER_ID`
- `CANONICALS_BIBLE_JSON_PATH` or `DRIVE_FILE_ID_CANONICALS`

## Local JSON files expected by code

- `json_canon/canonicals_bible.json`
- `json_canon/drive_active_subfolders.json`
- `json_canon/prompt_designated_subfolder.json`
- `json_canon/prompt_summary.json`
- `json_canon/prompts_issuerCanon.json`
- `json_canon/prompts_setName.json`

Only the first three are present in the current worktree. If the prompt files are not provided through env overrides or Drive IDs, summarize and set-name generation will fail.

## API summary

### `POST /api/summarize`

- Expects multipart `image` files
- Loads the summary prompt and canon bible
- Sends images plus prompt text to `gpt-4o-mini`
- Returns `{ summary }`

### `GET /api/active-subfolders`

- Loads `drive_active_subfolders.json`
- Returns `{ subfolders }`
- Falls back to an empty list if the config cannot be loaded

### `POST /api/save-set`

- Requires `summary` and `files`
- Accepts optional `selectedCanon` and `selectedSubfolder`
- Generates a normalized set name from the summary
- Resolves the target Drive folder by selected subfolder, keyword match, LLM topic match, or fallback folder
- Uploads captured images plus a generated Markdown file
- Returns `{ setName, targetFolderId, topic }`

### `POST /api/update-issuerCanon`

- Requires `draftSummary` and `finalSummary`
- Extracts issuer names with OpenAI
- Refuses to write when the canon source resolves to a local file path

## Running locally

Start the app from the app directory:

```powershell
cd examples/with-nextjs
pnpm dev
```

The workspace root still has the camera package test command:

```powershell
pnpm test
```

## Verification notes

- The landing page title and browser metadata now use `DocuKam`
- The mobile capture dialog is configured to fill the viewport on phones
- Save output is a Markdown file based on the generated set name, not `summary.json`
- The active-subfolder local config filename now matches what the code actually looks for
