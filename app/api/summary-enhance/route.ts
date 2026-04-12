import { handleSummaryEnhance } from "@/lib/summary/server";

export async function POST(req: Request) {
  return handleSummaryEnhance(req);
}
