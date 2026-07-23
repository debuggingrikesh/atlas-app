/* eslint-disable @typescript-eslint/no-explicit-any */

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    migrations: {
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        // Prisma 7: this URL is used by migrate dev and prisma generate.
        // At runtime, src/lib/db/prisma.ts uses the PrismaPg adapter with DATABASE_URL (pooler).
        // DIRECT_URL (port 5432, no pgbouncer) is required for DDL migrations.
        url: process.env.DIRECT_URL,
    },
});