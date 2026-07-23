/* eslint-disable @typescript-eslint/no-explicit-any */

import { successResponse, errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { CORE_INFO } from "@atlas/core/metadata";
import packageJson from "../../../../../package.json";
import { headers } from "next/headers";
import crypto from "crypto";

export async function GET() {
   
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse("UNAUTHORIZED", "Missing or invalid authorization header.", 401);
  }

  const token = authHeader.split(" ")[1];
  const expectedToken = process.env.INTERNAL_INTEGRITY_SECRET;

  if (!expectedToken) {
    logger.error("App endpoint misconfigured: missing INTERNAL_INTEGRITY_SECRET");
    return errorResponse("INTERNAL_ERROR", "Server misconfigured. Missing internal secret.", 500);
  }

  // Constant-time comparison
  let isValid = false;
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expectedToken);
    if (a.length === b.length) {
      isValid = crypto.timingSafeEqual(a, b);
    }
  } catch (e) {
    isValid = false;
  }

  if (!isValid) {
    return errorResponse("FORBIDDEN", "Invalid integrity secret.", 403);
  }

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
