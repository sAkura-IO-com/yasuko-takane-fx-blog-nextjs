import { OPTIONS } from "@/lib/api/v1/http";
import { getProfile } from "@/lib/api/v1/handlers";

export { OPTIONS };

export async function GET(request: Request) {
  return getProfile(request);
}
