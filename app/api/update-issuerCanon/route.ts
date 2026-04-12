import { NextResponse } from "next/server";

import { loadJsonSource, updateDriveJsonSource } from "@/lib/jsonSource";
import { CANONICALS_BIBLE_SOURCE } from "@/lib/jsonCanonSources";
import { extractIssuerField } from "@/lib/summaryFields";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const canonicalFileId = CANONICALS_BIBLE_SOURCE;

  if (!canonicalFileId) {
    return NextResponse.json({ error: "Missing DRIVE_FILE_ID_CANONICALS" }, { status: 500 });
  }

  try {
    const { sourceSummary, draftSummary, finalSummary } = await request.json();
    const canonicalSourceSummary = sourceSummary ?? draftSummary;

    if (!canonicalSourceSummary || !finalSummary) {
      return NextResponse.json({ error: "Missing summaries in request body." }, { status: 400 });
    }

    const issuerName = extractIssuerField(finalSummary);
    const issuerAlias = extractIssuerField(canonicalSourceSummary);

    if (!issuerName || !issuerAlias) {
      return NextResponse.json({
        status: "NO_ACTION",
        message: "Issuer field missing; canonical update skipped.",
      });
    }

    const bibleData = await loadJsonSource(canonicalFileId, true);
    const issuers = Array.isArray(bibleData?.issuers) ? bibleData.issuers : [];
    const masterEntry = issuers.find((entry: any) => entry.master === issuerName);

    if (masterEntry) {
      const aliases = Array.isArray(masterEntry.aliases) ? masterEntry.aliases : [];
      if (issuerAlias !== issuerName && !aliases.includes(issuerAlias)) {
        aliases.push(issuerAlias);
        masterEntry.aliases = aliases;
      } else {
        return NextResponse.json({
          status: "NO_ACTION",
          message: "No update required, entry already exists.",
        });
      }
    } else {
      issuers.push({
        master: issuerName,
        aliases: issuerAlias !== issuerName ? [issuerAlias] : [],
      });
    }

    bibleData.issuers = issuers;
    await updateDriveJsonSource(canonicalFileId, bibleData);

    return NextResponse.json(
      {
        status: "UPDATE_PERSISTED",
        message: `Canon updated: Master [${issuerName}] with Alias [${issuerAlias}]`,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("update-issuerCanon failed:", err.message);
    return NextResponse.json({ status: "SERVER_ERROR", error: err.message }, { status: 500 });
  }
}
