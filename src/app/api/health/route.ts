/* eslint-disable @typescript-eslint/no-explicit-any */

import { successResponse, errorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    // Check DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    return successResponse({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Health Check] Database unreachable:", error);
    return errorResponse("SERVICE_UNAVAILABLE", "Service is currently degraded.", 503);
  }
}
