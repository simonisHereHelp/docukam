import { handleImg2SixW } from "@/lib/model_service";

export async function POST(req: Request) {
  return handleImg2SixW(req);
}
