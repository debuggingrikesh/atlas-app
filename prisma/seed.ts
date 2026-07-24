 

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SYSTEM_ROLE_PERMISSIONS } from '@atlas/core';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// ── Permission definitions ─────────────────────────────────────────────────

type PermissionDef = { key: string; description: string; category: string };

const PERMISSIONS: PermissionDef[] = [
  // Business
  { key: 'business.read',    description: 'View business details',       category: 'business' },
  { key: 'business.update',  description: 'Update business information',  category: 'business' },
  { key: 'business.delete',  description: 'Delete the business',          category: 'business' },
  // Member
  { key: 'member.read',      description: 'View business members',        category: 'member'   },
  { key: 'member.invite',    description: 'Invite new members',           category: 'member'   },
  { key: 'member.remove',    description: 'Remove members from business', category: 'member'   },
  { key: 'member.role_update', description: 'Update member roles',        category: 'member'   },
  // Role
  { key: 'role.read',        description: 'View roles and permissions',   category: 'role'     },
  { key: 'role.create',      description: 'Create roles',                 category: 'role'     },
  { key: 'role.update',      description: 'Update roles',                 category: 'role'     },
  { key: 'role.delete',      description: 'Delete roles',                 category: 'role'     },
  { key: 'role.manage',      description: 'Create and update roles',      category: 'role'     },
  // Settings
  { key: 'settings.manage',  description: 'Manage business settings',     category: 'settings' },
  // Activity
  { key: 'activity.read',    description: 'View activity timeline',       category: 'activity' },
  // Branch
  { key: 'branch.read',      description: 'View branches',                category: 'branch'   },
  { key: 'branch.create',    description: 'Create new branches',          category: 'branch'   },
  { key: 'branch.update',    description: 'Update branches',              category: 'branch'   },
  { key: 'branch.delete',    description: 'Delete branches',              category: 'branch'   },
  // Owner
  { key: 'owner.transfer',   description: 'Transfer business ownership',  category: 'owner'    },
  // Billing
  { key: 'billing.manage',   description: 'Manage business billing',      category: 'billing'  },
  // Reputation
  { key: 'reputation.view',               description: 'View reputation dashboard',   category: 'reputation' },
  { key: 'reputation.manage',             description: 'Manage reputation campaigns', category: 'reputation' },
  { key: 'reputation.settings_manage',    description: 'Manage reputation settings',  category: 'reputation' },
  { key: 'reputation.request_create',     description: 'Send review requests',        category: 'reputation' },
  { key: 'reputation.feedback_view',      description: 'View customer feedback',      category: 'reputation' },
  { key: 'reputation.ai_response_generate', description: 'Generate AI responses',     category: 'reputation' },
  { key: 'reputation.ai_settings_manage', description: 'Manage AI settings',          category: 'reputation' },
];


// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Upserts the three system roles for a given business and assigns the correct
 * permissions to each. Idempotent — safe to call multiple times.
 */
async function seedSystemRolesForBusiness(
  businessId: string,
  permissionMap: Map<string, string>
): Promise<void> {
  const roleNames = ['OWNER', 'ADMIN', 'MEMBER'] as const;

  for (const roleName of roleNames) {
    const role = await prisma.role.upsert({
      where: { businessId_name: { businessId, name: roleName } },
      update: {},
      create: { name: roleName, businessId, isSystem: true },
    });

    const permKeys = SYSTEM_ROLE_PERMISSIONS[roleName];
    for (const key of permKeys) {
      const permissionId = permissionMap.get(key);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Seed industry templates
  const templates = [
    { name: "Healthcare Clinic",  slug: "healthcare-clinic",  description: "Healthcare clinics and medical service providers" },
    { name: "Education",          slug: "education",           description: "Education consultancies and institutions" },
    { name: "Restaurant",         slug: "restaurant",          description: "Restaurants and food businesses" },
    { name: "Retail",             slug: "retail",              description: "Retail businesses and stores" },
    { name: "Hospitality",        slug: "hospitality",         description: "Hotels and hospitality businesses" },
  ];

  for (const template of templates) {
    await prisma.industryTemplate.upsert({
      where: { slug: template.slug },
      update: {},
      create: template,
    });
  }
  console.log("✅ Industry templates seeded");

  // 2. Seed global permissions
  const permissionMap = new Map<string, string>(); // key → id

  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description, category: perm.category },
      create: perm,
    });
    permissionMap.set(record.key, record.id);
  }
  console.log(`✅ ${PERMISSIONS.length} permissions seeded`);

  // 3. Seed system roles for every existing business
  const businesses = await prisma.business.findMany({ select: { id: true, name: true } });

  for (const business of businesses) {
    await seedSystemRolesForBusiness(business.id, permissionMap);
    console.log(`  ✅ System roles seeded for: ${business.name}`);
  }

  if (businesses.length > 0) {
    console.log(`✅ System roles seeded for ${businesses.length} existing businesses`);
  } else {
    console.log("ℹ️  No existing businesses — system roles will be created on next business signup");
  }

  // 4. Backfill roleId for existing BusinessMembers that do not have one
  const unlinkedMembers = await prisma.businessMember.findMany({
    where: { roleId: null },
    select: { id: true, userId: true, businessId: true, role: true },
  });

  let backfilled = 0;
  for (const member of unlinkedMembers) {
    const role = await prisma.role.findUnique({
      where: { businessId_name: { businessId: member.businessId, name: member.role } },
      select: { id: true },
    });

    if (role) {
      await prisma.businessMember.update({
        where: { id: member.id },
        data: { roleId: role.id },
      });
      backfilled++;
    }
  }

  if (backfilled > 0) {
    console.log(`✅ Backfilled roleId for ${backfilled} existing BusinessMember rows`);
  }

  // 5. Seed billing plans
  const freePlan = await prisma.plan.upsert({
    where: { code: 'FREE' },
    update: {},
    create: {
      name: 'Free Plan',
      code: 'FREE',
      price: 0,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { code: 'PRO' },
    update: {},
    create: {
      name: 'Pro Plan',
      code: 'PRO',
      price: 49,
    },
  });

  // Free Features
  await prisma.planFeature.upsert({
    where: { planId_featureKey: { planId: freePlan.id, featureKey: 'REPUTATION_REVIEW_REQUESTS' } },
    update: { limit: 6, enabled: true },
    create: { planId: freePlan.id, featureKey: 'REPUTATION_REVIEW_REQUESTS', limit: 6, enabled: true },
  });
  await prisma.planFeature.upsert({
    where: { planId_featureKey: { planId: freePlan.id, featureKey: 'AI_REPUTATION_ANALYSIS' } },
    update: { limit: -1, enabled: false },
    create: { planId: freePlan.id, featureKey: 'AI_REPUTATION_ANALYSIS', limit: -1, enabled: false },
  });

  // Pro Features
  await prisma.planFeature.upsert({
    where: { planId_featureKey: { planId: proPlan.id, featureKey: 'REPUTATION_REVIEW_REQUESTS' } },
    update: { limit: -1, enabled: true },
    create: { planId: proPlan.id, featureKey: 'REPUTATION_REVIEW_REQUESTS', limit: -1, enabled: true },
  });
  await prisma.planFeature.upsert({
    where: { planId_featureKey: { planId: proPlan.id, featureKey: 'AI_REPUTATION_ANALYSIS' } },
    update: { limit: -1, enabled: true },
    create: { planId: proPlan.id, featureKey: 'AI_REPUTATION_ANALYSIS', limit: -1, enabled: true },
  });
  console.log('✅ Billing plans seeded');

  // 6. Backfill FREE subscriptions for businesses without one
  let subscriptionsCreated = 0;
  for (const business of businesses) {
    const existingSub = await prisma.businessSubscription.findUnique({
      where: { businessId: business.id },
    });
    if (!existingSub) {
      await prisma.businessSubscription.create({
        data: {
          businessId: business.id,
          planId: freePlan.id,
          status: 'ACTIVE',
        },
      });
      subscriptionsCreated++;
    }
  }
  if (subscriptionsCreated > 0) {
    console.log(`✅ Backfilled FREE subscription for ${subscriptionsCreated} businesses`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });