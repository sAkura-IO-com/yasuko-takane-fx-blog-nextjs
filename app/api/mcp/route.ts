import { createPublicMcpHandler } from "@/lib/mcp/handler";
import { publicReadSource } from "@/lib/mcp/source";

const handler = createPublicMcpHandler(publicReadSource);

export { handler as GET, handler as POST };
