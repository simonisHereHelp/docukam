import { handleOcrExtract } from "@/lib/model_service";

export async function POST(req: Request) {
  return handleOcrExtract(req);
}
