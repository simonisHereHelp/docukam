// @/lib/driveSaveFiles.ts
import { auth } from "@/auth";
import { normalizeFilename } from "@/lib/normalizeFilename";


const DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink";

function buildMultipartBody(
  boundary: string,
  metadata: Record<string, unknown>,
  fileBuffer: Buffer,
  mimeType: string,
) {
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata);

  const filePartHeader =
    delimiter + `Content-Type: ${mimeType || "application/octet-stream"}\r\n\r\n`;

  return Buffer.concat([
    Buffer.from(metaPart, "utf8"),
    Buffer.from(filePartHeader, "utf8"),
    fileBuffer,
    Buffer.from(closeDelimiter, "utf8"),
  ]);
}

/**
 * Save multiple files to Google Drive.
 * - You provide `fileToUpload(file)` which returns `{ name, buffer, mimeType }`.
 * - This keeps route-level naming logic (baseName) intact and testable.
 */
export async function driveSaveFiles(params: {
  folderId: string; // May be a folder ID or a baseId/child path like "<BASE_ID>/Insurance"
  files: File[];
  fileToUpload: (file: File) => Promise<{
    name: string; // e.g. baseName
    buffer: Buffer;
    mimeType: string;
  }>;
}) {
  const { folderId, files, fileToUpload } = params;
  const session = await auth();
  if (!session) throw new Error("Not authenticated.");

  const accessToken = (session as any)?.accessToken as string | undefined;

  if (!accessToken) throw new Error("Missing Google Drive access token on session.");

  const resolvedFolderId = await ensureFolderPath(folderId, accessToken);

  for (const file of files) {
    const { name, buffer, mimeType } = await fileToUpload(file);
    const normalizedName = normalizeFilename(name);
    const resolvedMimeType = mimeType || "application/octet-stream";

    const boundary = "drive-boundary-" + Date.now() + Math.random().toString(16);
    const metadata = {
      name: normalizedName,
      parents: [resolvedFolderId],
      mimeType: resolvedMimeType,
    };
    const body = buildMultipartBody(boundary, metadata, buffer, resolvedMimeType);

    const res = await fetch(DRIVE_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Drive upload failed: ${res.status} ${text}`);
    }

  }

}

export async function resolveUniqueDriveSetName(params: {
  folderId: string;
  preferredBaseName: string;
}): Promise<string> {
  const { folderId, preferredBaseName } = params;
  const session = await auth();
  if (!session) throw new Error("Not authenticated.");

  const accessToken = (session as any)?.accessToken as string | undefined;
  if (!accessToken) throw new Error("Missing Google Drive access token on session.");

  const resolvedFolderId = await ensureFolderPath(folderId, accessToken);
  const normalizedBaseName = normalizeFilename(preferredBaseName);

  const preferredSummaryName = `${normalizedBaseName}.md`;
  const preferredExists = await driveFileExists({
    folderId: resolvedFolderId,
    name: preferredSummaryName,
    accessToken,
  });

  if (!preferredExists) {
    return normalizedBaseName;
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidateBaseName = `${normalizedBaseName}-${suffix}`;
    const candidateExists = await driveFileExists({
      folderId: resolvedFolderId,
      name: `${candidateBaseName}.md`,
      accessToken,
    });

    if (!candidateExists) {
      return candidateBaseName;
    }
  }

  throw new Error("Unable to resolve a unique Drive file name.");
}

export async function ensureFolderPath(folderPath: string, accessToken: string): Promise<string> {
  if (!folderPath) throw new Error("Missing target Drive folder");

  const parts = folderPath.split("/").filter(Boolean);
  if (!parts.length) throw new Error("Malformed Drive folder path");

  let currentId = parts.shift()!; // base folder ID

  for (const segment of parts) {
    currentId = await findOrCreateChildFolder({
      parentId: currentId,
      name: segment,
      accessToken,
    });
  }

  return currentId;
}

async function driveFileExists(params: {
  folderId: string;
  name: string;
  accessToken: string;
}): Promise<boolean> {
  const { folderId, name, accessToken } = params;
  const escapedName = name.replace(/'/g, "\\'");
  const query = encodeURIComponent(
    `name = '${escapedName}' and '${folderId}' in parents and trashed = false`,
  );

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)&pageSize=1`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to inspect Drive files '${name}': ${response.status} ${text}`);
  }

  const payload = (await response.json().catch(() => ({}))) as { files?: { id: string }[] };
  return Boolean(payload?.files?.length);
}

async function findOrCreateChildFolder(params: {
  parentId: string;
  name: string;
  accessToken: string;
}): Promise<string> {
  const { parentId, name, accessToken } = params;

  const query = encodeURIComponent(
    `name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
  );

  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!listRes.ok) {
    const text = await listRes.text().catch(() => "");
    throw new Error(`Failed to inspect Drive folder '${name}': ${listRes.status} ${text}`);
  }

  const data = (await listRes.json().catch(() => ({}))) as { files?: { id: string }[] };
  const existingId = data?.files?.[0]?.id;
  if (existingId) return existingId;

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text().catch(() => "");
    throw new Error(`Failed to create Drive subfolder '${name}': ${createRes.status} ${text}`);
  }

  const created = (await createRes.json().catch(() => null)) as { id?: string } | null;
  if (!created?.id) throw new Error(`Drive did not return an id for folder '${name}'`);

  return created.id;
}
