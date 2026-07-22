import { successResponse } from "@/lib/api/response";
import { CORE_INFO } from "@atlas/core/metadata";
import packageJson from "../../../../../package.json";
import { requirePlatformRole } from "@/lib/auth/require-auth";

export async function GET() {
  // Only SUPER_ADMIN can check platform integrity
  const { errorRes } = await requirePlatformRole(['SUPER_ADMIN']);
  if (errorRes) return errorRes;

  const configuredCore = packageJson.dependencies?.["@atlas/core"];
  
  let configuredSha = "unknown";
  if (configuredCore && configuredCore.includes("#")) {
    configuredSha = configuredCore.split("#")[1];
  }

  return successResponse({
    status: "ok",
    configuredSha,
    loadedCore: CORE_INFO,
    timestamp: new Date().toISOString(),
  });
}
