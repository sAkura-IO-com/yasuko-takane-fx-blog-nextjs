import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/better-auth/runtime";

export const { GET, POST } = toNextJsHandler({
  handler: async (request: Request) => {
    const auth = await getAuth();
    return auth.handler(request);
  },
});
