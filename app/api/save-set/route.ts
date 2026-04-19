import { NextResponse } from "next/server";

import { ensureFolderPath, resolveUniqueDriveSetName } from "@/lib/driveSaveFiles";
import { DRIVE_FALLBACK_FOLDER_ID } from "@/lib/jsonCanonSources";
import { resolveDriveFolder } from "@/lib/driveSubfolderResolver";
import { normalizeSixWText } from "@/lib/formatSixWText";
import { normalizeFilename } from "@/lib/normalizeFilename";
import { buildNamingSummary, extractIssuerField } from "@/lib/summaryFields";
import { auth } from "@/auth";

interface SelectedCanonMeta {
  master: string;
  aliases?: string[];
}

interface SelectedSubfolderMeta {
  topic: string;
  folderId?: string;
}

interface ImagePlanInput {
  name: string;
  type?: string;
}

const buildFolderPath = (slugOrPath: string, base: string) => {
  if (!slugOrPath) return base;
  if (slugOrPath.startsWith(`${base}/`) || slugOrPath === base) return slugOrPath;
  if (slugOrPath.includes("/")) return slugOrPath;
  return `${base}/${slugOrPath}`;
};

const mimeTypeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const resolveExtension = (fileName: string, fallback: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension && extension.length ? extension : fallback;
};

const resolveMimeType = (type: string | undefined, fileName: string, fallbackExtension: string) => {
  if (type) return type;
  const extension = resolveExtension(fileName, fallbackExtension);
  return mimeTypeByExtension[extension] ?? "application/octet-stream";
};

function buildMarkdown(params: {
  setName: string;
  summary: string;
  sourceJsonFileName: string;
  imageFileNames: string[];
}) {
  const { setName, summary, sourceJsonFileName, imageFileNames } = params;
  const formattedSummary = normalizeSixWText(summary);
  const images = imageFileNames.map((fileName, idx) => {
    const pageNumber = idx + 1;
    return `![${setName}-p${pageNumber}](./${fileName})`;
  });

  return `# ${setName}

## summary

${formattedSummary}

---

## json reference

[${sourceJsonFileName}](./${sourceJsonFileName})

---

## support

${images.join("\n\n")}
`;
}

export const runtime = "nodejs";

const BASE_DRIVE_FOLDER_ID = DRIVE_FALLBACK_FOLDER_ID;
const ROOT_DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;

async function deriveSetNameFromSummary(summary: string): Promise<string> {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const issuerName = extractIssuerField(summary);
  const fallbackTitle = normalizeFilename(issuerName || "document");
  return `${fallbackTitle}-${datePart}`;
}

export async function POST(request: Request) {
  if (!ROOT_DRIVE_FOLDER_ID && !BASE_DRIVE_FOLDER_ID) {
    return NextResponse.json({ error: "Missing DRIVE_FOLDER_ID" }, { status: 500 });
  }

  try {
    const {
      summary,
      ocrText,
      selectedCanon,
      selectedSubfolder,
      images,
    } = (await request.json()) as {
      summary?: string;
      ocrText?: string;
      selectedCanon?: SelectedCanonMeta | null;
      selectedSubfolder?: SelectedSubfolderMeta | null;
      images?: ImagePlanInput[];
    };

    const trimmedSummary = summary?.trim() ?? "";
    const trimmedOcrText = ocrText?.trim() ?? "";
    const imagePlans = Array.isArray(images) ? images : [];

    if (!trimmedSummary || !trimmedOcrText || !imagePlans.length) {
      return NextResponse.json(
        { error: "Summary, OCR text, and image metadata are required." },
        { status: 400 },
      );
    }

    const namingSummary = buildNamingSummary(trimmedSummary, selectedCanon?.master ?? null);
    const normalizedSetName = normalizeFilename(
      await deriveSetNameFromSummary(namingSummary),
    );

    const baseFolderId = ROOT_DRIVE_FOLDER_ID || BASE_DRIVE_FOLDER_ID;
    if (!baseFolderId) {
      return NextResponse.json({ error: "Missing DRIVE_FOLDER_ID" }, { status: 500 });
    }

    let targetFolderId: string;
    let topic: string | null = null;

    if (selectedSubfolder) {
      targetFolderId = buildFolderPath(
        selectedSubfolder.folderId || selectedSubfolder.topic,
        baseFolderId,
      );
      topic = selectedSubfolder.topic;
    } else {
      const resolved = await resolveDriveFolder(trimmedSummary);
      targetFolderId = resolved.folderId;
      topic = resolved.topic;
    }

    const session = await auth();
    const accessToken = (session as any)?.accessToken as string | undefined;
    if (!accessToken) {
      return NextResponse.json({ error: "Missing Google Drive access token on session." }, { status: 401 });
    }

    const resolvedTargetFolderId = await ensureFolderPath(targetFolderId, accessToken);

    const uniqueSetName = await resolveUniqueDriveSetName({
      folderId: targetFolderId,
      preferredBaseName: normalizedSetName,
    });

    const imageUploads = imagePlans.map((image, idx) => {
      const extension = resolveExtension(image.name, "jpeg");
      const fileName = normalizeFilename(`${uniqueSetName}-p${idx + 1}.${extension}`);
      return {
        sourceIndex: idx,
        fileName,
        mimeType: resolveMimeType(image.type, image.name, extension),
      };
    });

    const sourceJsonFileName = `${uniqueSetName}.json`;
    const markdownFileName = `${uniqueSetName}.md`;

    const markdownText = buildMarkdown({
      setName: uniqueSetName,
      summary: trimmedSummary,
      sourceJsonFileName,
      imageFileNames: imageUploads.map((image) => image.fileName),
    });

    const jsonText = JSON.stringify(
      {
        sixWText: trimmedSummary,
        ocrText: trimmedOcrText,
        sourceContent: {
          sixWText: trimmedSummary,
          ocrText: trimmedOcrText,
        },
      },
      null,
      2,
    );

    return NextResponse.json(
      {
        setName: uniqueSetName,
        targetFolderId: resolvedTargetFolderId,
        topic,
        markdownFileName,
        markdownText,
        jsonFileName: sourceJsonFileName,
        jsonText,
        imageUploads,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("save-set plan failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
