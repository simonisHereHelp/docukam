import { NextResponse } from "next/server";
import { Buffer } from "buffer";

import { driveSaveFiles, resolveUniqueDriveSetName } from "@/lib/driveSaveFiles";
import { DRIVE_FALLBACK_FOLDER_ID } from "@/lib/jsonCanonSources";
import { resolveDriveFolder } from "@/lib/driveSubfolderResolver";
import { normalizeFilename } from "@/lib/normalizeFilename";
import { buildNamingSummary, extractIssuerField } from "@/lib/summaryFields";

interface SelectedCanonMeta {
  master: string;
  aliases?: string[];
}

interface SelectedSubfolderMeta {
  topic: string;
  folderId?: string;
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

const resolveMimeType = (file: File, fallbackExtension: string) => {
  if (file.type) return file.type;
  const extension = resolveExtension(file.name, fallbackExtension);
  return mimeTypeByExtension[extension] ?? "application/octet-stream";
};

function buildMarkdown(params: {
  setName: string;
  summary: string;
  ocrJsonFileName: string;
  imageFiles: File[];
}) {
  const { setName, summary, ocrJsonFileName, imageFiles } = params;
  const images = imageFiles.map((file, idx) => {
    const pageNumber = idx + 1;
    const extension = resolveExtension(file.name, "jpeg");
    return `![${setName}-p${pageNumber}](./${setName}-p${pageNumber}.${extension})`;
  });

  return `# ${setName}

## summary

${summary.trim()}

---

## json reference

[${ocrJsonFileName}](./${ocrJsonFileName})

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
    const formData = await request.formData();
    const summary = (formData.get("summary") as string | null)?.trim() ?? "";
    const ocrPlainText = (formData.get("ocrPlainText") as string | null)?.trim() ?? "";
    const selectedCanonRaw = formData.get("selectedCanon");
    const selectedSubfolderRaw = formData.get("selectedSubfolder");
    let selectedCanon: SelectedCanonMeta | null = null;
    let selectedSubfolder: SelectedSubfolderMeta | null = null;

    if (typeof selectedCanonRaw === "string") {
      try {
        selectedCanon = (JSON.parse(selectedCanonRaw) as SelectedCanonMeta) ?? null;
      } catch (err) {
        console.warn("Unable to parse selectedCanon from request:", err);
      }
    }

    if (typeof selectedSubfolderRaw === "string") {
      try {
        selectedSubfolder =
          (JSON.parse(selectedSubfolderRaw) as SelectedSubfolderMeta) ?? null;
      } catch (err) {
        console.warn("Unable to parse selectedSubfolder from request:", err);
      }
    }

    const files = formData.getAll("files").filter((file): file is File => file instanceof File);

    if (!summary || !ocrPlainText || !files.length) {
      return NextResponse.json(
        { error: "Summary, OCR plain text, and files are required." },
        { status: 400 },
      );
    }

    const namingSummary = buildNamingSummary(summary, selectedCanon?.master ?? null);
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
      const resolved = await resolveDriveFolder(summary);
      targetFolderId = resolved.folderId;
      topic = resolved.topic;
    }

    const uniqueSetName = await resolveUniqueDriveSetName({
      folderId: targetFolderId,
      preferredBaseName: normalizedSetName,
    });

    const imageFiles = files;
    const ocrJsonFileName = `${uniqueSetName}.json`;
    const markdown = buildMarkdown({
      setName: uniqueSetName,
      summary,
      ocrJsonFileName,
      imageFiles,
    });

    const ocrJson = JSON.stringify(
      {
        plainText: ocrPlainText,
      },
      null,
      2,
    );

    const summaryFile = new File([markdown], "summary.md", { type: "text/markdown" });
    const ocrJsonFile = new File([ocrJson], "ocr.json", { type: "application/json" });
    const uploadFiles = [...imageFiles, ocrJsonFile, summaryFile];

    await driveSaveFiles({
      folderId: targetFolderId,
      files: uploadFiles,
      fileToUpload: async (file) => {
        const baseName = normalizeFilename(
          uniqueSetName.replace(/[\\/:*?"<>|]/g, "_"),
        );
        const extension = resolveExtension(file.name, "dat");

        const fileName = normalizeFilename(
          file === summaryFile || file.name === "summary.md"
            ? `${baseName}.md`
            : file === ocrJsonFile || file.name === "ocr.json"
              ? `${baseName}.json`
            : `${baseName}-p${imageFiles.indexOf(file) + 1}.${extension ?? "dat"}`,
        );

        return {
          name: fileName,
          buffer: Buffer.from(await file.arrayBuffer()),
          mimeType: resolveMimeType(file, extension),
        };
      },
    });

    return NextResponse.json(
      { setName: uniqueSetName, targetFolderId, topic },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("save-set failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
