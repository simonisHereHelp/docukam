import { handleOcrExtract } from "@/lib/summary/server";

export async function POST(req: Request) {
  return handleOcrExtract(req);
}
