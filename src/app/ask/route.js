import { POST as handleAskPost } from "../api/ask/route";

export const dynamic = "force-dynamic";

export async function POST(req) {
  return handleAskPost(req);
}
