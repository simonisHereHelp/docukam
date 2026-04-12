import { loadJsonSource } from "./jsonSource";
import {
  DRIVE_ACTIVE_SUBFOLDER_SOURCE,
  DRIVE_FALLBACK_FOLDER_ID,
} from "./jsonCanonSources";

interface ActiveSubfolder {
  topic: string;
  folderId: string;
  keywords?: string[];
  description?: string;
}

interface SubfolderConfig {
  subfolders?: ActiveSubfolder[];
  fallbackFolderId?: string;
}

const BASE_DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;

const buildFolderPath = (slugOrPath: string, base: string) => {
  if (!slugOrPath) return base;
  if (slugOrPath.startsWith(`${base}/`) || slugOrPath === base) return slugOrPath;
  if (slugOrPath.includes("/")) return slugOrPath;
  return `${base}/${slugOrPath}`;
};

const normalizeSubfolderConfig = (
  config: unknown,
): { subfolders: ActiveSubfolder[]; fallbackFolderId?: string } => {
  if (!config) return { subfolders: [] };

  if (Array.isArray(config)) {
    return { subfolders: config as ActiveSubfolder[] };
  }

  const typed = config as SubfolderConfig;
  const subfolders = Array.isArray(typed?.subfolders) ? typed.subfolders : [];

  return { subfolders, fallbackFolderId: typed?.fallbackFolderId };
};

const findKeywordMatch = (summary: string, subfolders: ActiveSubfolder[]) => {
  const lowerSummary = summary.toLowerCase();
  return subfolders.find((folder) =>
    folder.keywords?.some((keyword) => lowerSummary.includes(keyword.toLowerCase())),
  );
};

const fetchActiveSubfolders = async () => {
  try {
    const config = await loadJsonSource(DRIVE_ACTIVE_SUBFOLDER_SOURCE);
    return normalizeSubfolderConfig(config);
  } catch (err) {
    console.warn("Failed to load active subfolder config:", err);
    return { subfolders: [] };
  }
};

export const resolveDriveFolder = async (
  summary: string,
): Promise<{ folderId: string; topic: string | null }> => {
  if (!BASE_DRIVE_FOLDER_ID) throw new Error("Missing DRIVE_FOLDER_ID for base path");

  let fallbackFolderId = DRIVE_FALLBACK_FOLDER_ID;
  const { subfolders, fallbackFolderId: configFallback } = await fetchActiveSubfolders();

  fallbackFolderId = configFallback || fallbackFolderId;
  if (!fallbackFolderId) throw new Error("Missing DRIVE_FOLDER_ID for fallback");

  const fallbackFolderPath = buildFolderPath(fallbackFolderId, BASE_DRIVE_FOLDER_ID);

  if (!subfolders.length) {
    return { folderId: fallbackFolderPath, topic: null };
  }

  const keywordMatch = findKeywordMatch(summary, subfolders);
  if (keywordMatch) {
    const folderPath = buildFolderPath(
      keywordMatch.folderId || keywordMatch.topic,
      BASE_DRIVE_FOLDER_ID,
    );
    return { folderId: folderPath, topic: keywordMatch.topic };
  }

  return { folderId: fallbackFolderPath, topic: null };
};
