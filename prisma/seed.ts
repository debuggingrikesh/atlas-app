import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const templates = [
    {
      name: "Healthcare Clinic",
      slug: "healthcare-clinic",
      description: "Healthcare clinics and medical service providers",
    },
    {
      name: "Education",
      slug: "education",
      description: "Education consultancies and institutions",
    },
    {
      name: "Restaurant",
      slug: "restaurant",
      description: "Restaurants and food businesses",
    },
    {
      name: "Retail",
      slug: "retail",
      description: "Retail businesses and stores",
    },
    {
      name: "Hospitality",
      slug: "hospitality",
      description: "Hotels and hospitality businesses",
    },
  ];

  for (const template of templates) {
    await prisma.industryTemplate.upsert({
      where: {
        slug: template.slug,
      },
      update: {},
      create: template,
    });
  }

  console.log("✅ Industry templates seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });