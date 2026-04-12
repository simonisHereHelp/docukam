import { handleSummarize } from "@/lib/model_service";

export async function POST(req: Request) {
  return handleSummarize(req);
}
