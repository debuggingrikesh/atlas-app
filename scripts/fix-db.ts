import { prisma } from '../src/lib/db/prisma'

async function main() {
  console.log("Running raw SQL to fix AuditLog table...");
  await prisma.$executeRawUnsafe(`ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`);
  console.log("Column 'occurredAt' added successfully to AuditLog!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
