import { handleImgToOcrText } from "@/lib/model_service";

export async function POST(req: Request) {
  return handleImgToOcrText(req);
}
