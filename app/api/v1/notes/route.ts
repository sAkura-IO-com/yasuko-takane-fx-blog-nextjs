import { OPTIONS } from "@/lib/api/v1/http";
import { getPostList } from "@/lib/api/v1/handlers";

export { OPTIONS };

export async function GET(request: Request) {
  return getPostList(request, "note");
}
