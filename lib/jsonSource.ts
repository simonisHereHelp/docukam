import fs from "fs/promises";
import path from "path";

import { auth } from "@/auth";

const resolveLocalPath = (source: string) => {
  const looksLikeDriveId = /^[a-zA-Z0-9_-]{10,}$/.test(source) && !source.includes("/");
  if (looksLikeDriveId || source.startsWith("http")) return null;

  return path.isAbsolute(source) ? source : path.join(process.cwd(), source);
};

export async function loadJsonSource(source: string, useAuth = false): Promise<any> {
  if (!source) throw new Error("File source is required");

  const resolvedPath = resolveLocalPath(source);
  if (resolvedPath) {
    const fileContent = await fs.readFile(resolvedPath, "utf-8");
    return JSON.parse(fileContent);
  }

  let url = `https://drive.google.com/uc?export=download&id=${source}`;
  const headers: HeadersInit = {};

  if (useAuth) {
    const session = await auth();
    const tokenError = (session as any)?.tokenError;
    const accessToken = (session as any)?.accessToken;
    if (tokenError) throw new Error("Google Drive session expired. Please sign in again.");
    if (!accessToken) throw new Error("Missing Google Drive access token");

    url = `https://www.googleapis.com/drive/v3/files/${source}?alt=media&supportsAllDrives=true`;
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Fetch file ${source} failed (Status: ${response.status})`);
  }

  return response.json();
}

export async function updateDriveJsonSource(source: string, data: unknown): Promise<void> {
  const resolvedPath = resolveLocalPath(source);
  if (resolvedPath) {
    throw new Error(
      "Updating local JSON sources is not supported. Provide a Drive file ID via environment variable.",
    );
  }

  const session = await auth();
  const tokenError = (session as any)?.tokenError;
  const accessToken = (session as any)?.accessToken;
  if (tokenError) throw new Error("Google Drive session expired. Please sign in again.");
  if (!accessToken) throw new Error("Missing Google Drive access token");

  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${source}?uploadType=media&supportsAllDrives=true`;
  const response = await fetch(uploadUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data, null, 2),
  });

  if (!response.ok) {
    throw new Error("Failed to update JSON file on Drive");
  }
}
