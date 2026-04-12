import { handleSummarize } from "@/lib/summary/server";

export async function POST(req: Request) {
  return handleSummarize(req);
}
