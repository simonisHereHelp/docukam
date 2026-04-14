# DocuKam

DocuKam is the Next.js front end for a two-step document pipeline:

1. `/api/ocr-extract` sends document images to a Paddle-OCR service and returns plain text.
2. `/api/summarize` sends that plain text to a Qwen service and returns a Chinese-labeled 6W summary.

This repo owns the browser UI, the API proxy routes, and the Google Drive save flow.

## Final Workflow

1. Launch camera or open the photo album.
2. Capture or choose one or more images.
3. Run `OCR xtract` to produce one combined plain-text OCR result.
4. Edit the OCR text if needed.
5. Run `Summarize` to produce one combined 6W summary.
6. Edit the 6W summary if needed.
7. Save the set to Google Drive.

Only the `Launch Camera` path should request camera access.

## Service Split

### `/api/ocr-extract`

- Runtime role: image-to-text OCR
- Backend target: local Paddle-OCR service
- Deployment target: `lenovo.ishere.help`
- Input: uploaded image files
- Output: plain text

Request flow:

- Next route: `app/api/ocr-extract/route.ts`
- Shared server adapter: `lib/model_service.ts`

Response shape:

```json
{
  "backend": "ocr-extract",
  "plainText": "Page 1\n\n同時請領 老年年金給付申請書及給付收據(月領) ...",
  "raw": {
    "plainText": "Page 1\n\n同時請領 老年年金給付申請書及給付收據(月領) ..."
  }
}
```

Example plain-text OCR output:

```text
Page 1

同時請領 老年年金給付申請書及給付收據(月領) 國民年金保險 交理 就 編號 填表日期 （填表前情詳閱費面說明） | 交理 編號
被 保 | 姓名 | 陳獻堂 | 出 生 日期 | 民團49年2月26日
銀 | 郵區號： 話：（ 0970139001 行動電話 | 前述地址烏：（勾遇）
您 人 | 址 | 鄭鎮 新生面 1 © 聯 村 6212元 樓 市區 裏 街 奔
中請金額 | 勞工保險 老年年金給付 （依勞保年資計算）
醫入戶 （ 一勾港 | ..0.0 請將申請人之存薄封面影本黏貼於背面
```

Source service repo:

- Local source repo: `D:\paddle-ocr`
- Downstream packaging target: Docker Hub repo

### `/api/summarize`

- Runtime role: plain-text document summarization
- Backend target: Hugging Face Qwen service
- Deployment target: `99c-bagel-qwen.hf.space`
- Input: JSON payload with:
  - `instruction`
  - `input`
- Output: plain-text 6W summary

Request flow:

- Next route: `app/api/summarize/route.ts`
- Shared server adapter: `lib/model_service.ts`

The summarize route sends the OCR plain text to Qwen with a fixed instruction focused on:

- `單位`
- `收件人`
- `日期`
- `主題`
- `地點`
- `abstract_summary`

Editor display uses only the parsed 6W section, not the diagnostic preamble returned by the model service.

Example 6W output:

```text
單位: 未識別
收件人: 未識別
日期: 未識別
主題: 未識別
地點: 未識別
abstract_summary: 重點內容包括：Page 1；同時請領 老年年金給付申請書及給付收據(月領) 國民年金保險 交理 就 編號 填表日期 （填表前情詳閱費面說明） | 交理 編號；被 保 | 姓名 | 陳獻堂 | 出 生 日期 | 民團49年2月26日；銀 | 郵區號： 話：（ 0970139001 行動電話 | 前述地址烏：（勾遇）；您 人 | 址 | 鄭鎮 新生面 1 © 聯 村 6212元 樓 市區 裏 街 奔；醫入戶 （ 一勾港 | ..0.0 請將申請人之存薄封面影本黏貼於背面。
```

Source service repo:

- Local source repo: `D:\qwen-hugface`
- Deployment target: Hugging Face Space `99cent.bagel`

## Save-to-Drive Output

Each saved document set uploads three artifact types:

- `xxxx.md`
  Master note containing the final 6W summary and asset links
- `xxxx.json`
  OCR-extracted plain text in JSON format
- `xxxx-p1.jpeg`, `xxxx-p2.jpeg`, ...
  Source document images

The markdown file links to the JSON sidecar:

```md
## json reference

[xxxx.json](./xxxx.json)
```

Current JSON sidecar shape:

```json
{
  "plainText": "Page 1\n\n..."
}
```

## Failed Model Attempts

### `image-2-6W`

- `Pix2Struct_base`
  OCR-free approach, but it produced poor Chinese text results and incoherent 6W responses.

## Frontend Notes

- `OCR xtract` runs `/api/ocr-extract`
- `Summarize` runs `/api/summarize`
- The same editor is reused across both stages
- OCR text is editable before summarize
- 6W summary is editable before save
- Issuer canon buttons can still update the `單位` field after summarize
- `Save to Drive` stays disabled until summarize succeeds

## Environment Variables

Required:

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DRIVE_FOLDER_ID`
- `PADDLE_OCR_URL`
- `PADDLE_OCR_BEARER_TOKEN`
- `QWEN_HF_URL`
- `QWEN_HF_TOKEN`

Optional:

- `PADDLE_OCR_TIMEOUT_MS`
- `DRIVE_FALLBACK_FOLDER_ID`
- `CANONICALS_BIBLE_JSON_PATH`
- `DRIVE_ACTIVE_SUBFOLDER_PATH`

## Run Locally

```powershell
npm install
npm run dev
```

## Deploy on Vercel

- Import this repo as one Next.js project
- Set the root directory to the repository root
- Configure the environment variables above
- Keep Paddle-OCR and Qwen service deployments managed outside this repo
