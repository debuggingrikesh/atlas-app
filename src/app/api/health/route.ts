import { logger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/api/handler';
import { successResponse } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export const GET = withErrorHandling(async function GET(request: Request) {
  // Check DB connectivity
  await prisma.$queryRaw`SELECT 1`;

  return successResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}, 'GET /api/health');
