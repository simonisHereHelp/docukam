const DRIVE_RESUMABLE_CREATE_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink";

interface ResumableUploadParams {
  accessToken: string;
  folderId: string;
  fileName: string;
  mimeType: string;
  file: Blob;
}

export async function uploadDriveFileResumable({
  accessToken,
  folderId,
  fileName,
  mimeType,
  file,
}: ResumableUploadParams) {
  const startResponse = await fetch(DRIVE_RESUMABLE_CREATE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": mimeType,
      "X-Upload-Content-Length": String(file.size),
    },
    body: JSON.stringify({
      name: fileName,
      parents: [folderId],
      mimeType,
    }),
  });

  if (!startResponse.ok) {
    const message = await startResponse.text().catch(() => "");
    throw new Error(message || "Failed to start Drive resumable upload.");
  }

  const sessionUrl = startResponse.headers.get("Location");
  if (!sessionUrl) {
    throw new Error("Drive resumable upload session URL missing.");
  }

  const uploadResponse = await fetch(sessionUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const message = await uploadResponse.text().catch(() => "");
    throw new Error(message || "Failed to upload file to Drive.");
  }

  return uploadResponse.json().catch(() => null);
}

