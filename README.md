# DocuKam

DocuKam is a Next.js app for capturing document images, extracting OCR text, summarizing the text with a 6W framework, and saving the images plus a generated `summary.md` file into Google Drive.

## Summary pipeline

- `POST /api/ocr-extract`: image upload to Paddle OCR `/extract`
- `POST /api/summarize`: plain-text OCR input to Qwen `/ingest` using a built-in 6W instruction payload

## `/api/ocr-extract`

Returns plain text OCR output.

Example:

```text
Page 1

同時請領 老年年金給付申請書及給付收據(月領) 國民年金保險 交理 就 編號 填表日期 （填表前情詳閱費面說明） | 交理 編號
被 保 | 姓名 | 陳獻堂 | 出 生 日期 | 民團49年2月26日
銀 | 郵區號： 話：（ 0970139001 行動電話 | 前述地址烏：（勾遇）
您 人 | 址 | 鄭鎮 新生面 1 © 聯 村 6212元 樓 市區 裏 街 奔
中請金額 | 勞工保險 老年年金給付 （依勞保年資計算）
醫入戶 （ 一勾港 | ..0.0 請將申請人之存薄...
```

Response shape:

```json
{
  "backend": "ocr-extract",
  "plainText": "Page 1\\n\\n同時請領 ...",
  "raw": {}
}
```

## `/api/summarize`

Accepts plain text from `/api/ocr-extract` and returns a plain-text 6W summary.

Example output:

```text
單位: 未識別
收件人: 未識別
日期: 未識別
主題: 未識別
地點: 未識別
abstract_summary: 重點內容包括：Page 1；同時請領 老年年金給付申請書及給付收據(月領) 國民年金保險 交理 就 編號 填表日期 （填表前情詳閱費面說明） | 交理 編號；被 保 | 姓名 | 陳獻堂 | 出 生 日期 | 民團49年2月26日；銀 | 郵區號： 話：（ 0970139001 行動電話 | 前述地址烏：（勾遇）；您 人 | 址 | 鄭鎮 新生面 1 © 聯 村 6212元 樓 市區 裏 街 奔；醫入戶 （ 一勾港 | ..0.0 請將申請人之存薄封面影本黏貼於背面。
```

Response shape:

```json
{
  "backend": "summarize",
  "summary": "單位: 未識別\\n收件人: 未識別\\n日期: 未識別\\n主題: 未識別\\n地點: 未識別\\nabstract_summary: ...",
  "raw": "單位: 未識別\\n收件人: 未識別\\n日期: 未識別\\n主題: 未識別\\n地點: 未識別\\nabstract_summary: ..."
}
```

## Environment variables

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DRIVE_FOLDER_ID`
- `PADDLE_OCR_URL`
- `PADDLE_OCR_BEARER_TOKEN`
- `QWEN_HF_URL`
- `QWEN_HF_TOKEN`

Optional:

- `CANONICALS_BIBLE_JSON_PATH` or `DRIVE_FILE_ID_CANONICALS`
- `DRIVE_ACTIVE_SUBFOLDER_PATH` or `DRIVE_ACTIVE_SUBFOLDER_ID`
- `PADDLE_OCR_TIMEOUT_MS`
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
