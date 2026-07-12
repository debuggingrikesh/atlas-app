import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding industry templates...');

  const templates = [
    { name: 'Healthcare Clinic', slug: 'healthcare-clinic' },
    { name: 'Education', slug: 'education' },
    { name: 'Restaurant', slug: 'restaurant' },
    { name: 'Retail', slug: 'retail' },
    { name: 'Hospitality', slug: 'hospitality' },
  ];

  for (const t of templates) {
    await prisma.industryTemplate.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
