/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '../src/lib/db/prisma';
import { CampaignService } from '../src/modules/reputation/services/campaign-service';
import { ReviewRequestService } from '../src/modules/reputation/services/review-request-service';
import { FeedbackService } from '../src/modules/reputation/services/feedback-service';
import { ReputationSummaryService } from '../src/modules/reputation/services/reputation-summary-service';
import { ReputationRepository } from '../src/modules/reputation/repositories/reputation-repository';
import { resolvePermissions } from '../src/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@atlas/core/auth';
import * as crypto from 'crypto';

async function runQa() {
  console.log("--- Starting QA Scenario: Education Consultancy Workflow ---");
  
  // 1. Setup DB
  // Delete previous test data if it exists
  await prisma.userProfile.deleteMany({ where: { email: { contains: 'qa-edu' } } });
  await prisma.business.deleteMany({ where: { slug: 'qa-edu-consultancy' } });
  await prisma.industryTemplate.deleteMany({ where: { name: 'QA Education' } });

  // Create Industry Template
  const industry = await prisma.industryTemplate.create({
    data: { name: 'QA Education', slug: 'qa-education-slug' }
  });

  // Create Users
  const ownerId = crypto.randomUUID();
  const staffId = crypto.randomUUID();
  const owner = await prisma.userProfile.create({
    data: { id: ownerId, email: 'owner@qa-edu.com', fullName: 'QA Owner' }
  });
  const staff = await prisma.userProfile.create({
    data: { id: staffId, email: 'staff@qa-edu.com', fullName: 'QA Staff' }
  });

  // Create Business
  const business = await prisma.business.create({
    data: {
      name: 'QA Edu Consultancy',
      slug: 'qa-edu-consultancy',
      industryTemplateId: industry.id,
      branches: {
        create: [{ name: 'Main Campus', address: '123 QA St', isActive: true }]
      },
      members: {
        create: [
          { userId: owner.id, role: 'OWNER' },
          { userId: staff.id, role: 'MEMBER' }
        ]
      },
      reputationSettings: {
        create: {
          googleRedirectRating: 4,
        }
      }
    },
    include: { branches: true, members: { include: { rbacRole: { include: { permissions: { include: { permission: true } } } } } } }
  });

  const branch = business.branches[0];
  const ownerMembership = business.members.find(m => m.userId === owner.id)!;
  // Removing unused staffMembership assignment

  console.log("✅ Created Business, Owner, and Staff.");

  // 2. Owner creates campaign
  const campaign = await CampaignService.createCampaign(
    owner.id,
    business.id,
    {
      name: 'Fall Admissions Feedback',
      branchId: branch.id,
      googleReviewUrl: 'https://g.page/r/abc'
    }
  );
  console.log(`✅ Owner created campaign: ${campaign.name}`);

  // 3. Staff member sends WhatsApp review links (Usage limit 6)
  console.log("✅ Staff member creates 6 review requests (via WhatsApp)...");
  const reviewTokens: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const req = await ReviewRequestService.createRequest(
      staff.id,
      business.id,
      {
        campaignId: campaign.id,
        customerName: `Student ${i}`,
        customerPhone: `+1234567890${i}`,
        source: 'WHATSAPP'
      }
    );
    if ('error' in req) {
      console.error(`❌ Failed to create request ${i}:`, req.error);
    } else if ('request' in req) {
      reviewTokens.push(req.request.token);
    }
  }
  console.log(`✅ Created ${reviewTokens.length} review requests.`);

  // 4. Students submit reviews
  console.log("✅ Simulating students submitting reviews...");
  // Student 1: 5 Stars (Positive)
  const res1 = await FeedbackService.submitPublicReview(reviewTokens[0], { rating: 5 });
  console.log(`   Student 1 rated 5 stars. Action: ${'action' in res1 ? res1.action : 'error'}`);
  
  // Student 2: 4 Stars (Positive)
  const res2 = await FeedbackService.submitPublicReview(reviewTokens[1], { rating: 4, comment: 'Good!' });
  console.log(`   Student 2 rated 4 stars. Action: ${'action' in res2 ? res2.action : 'error'}`);

  // Student 3: 2 Stars (Negative)
  const res3 = await FeedbackService.submitPublicReview(reviewTokens[2], { rating: 2, comment: 'Too slow admissions process.' });
  console.log(`   Student 3 rated 2 stars. Action: ${'action' in res3 ? res3.action : 'error'}`);

  // Student 4: 1 Star (Negative)
  const res4 = await FeedbackService.submitPublicReview(reviewTokens[3], { rating: 1, comment: 'Terrible communication.' });
  console.log(`   Student 4 rated 1 stars. Action: ${'action' in res4 ? res4.action : 'error'}`);

  // Students 5 and 6 didn't reply yet.

  // 5. Dashboard updates
  // Owner views dashboard
  console.log("✅ Owner checks Dashboard...");
  const ownerPerms = resolvePermissions({ ...business, role: ownerMembership.role, rbacRole: ownerMembership.rbacRole });
  if (ownerPerms.hasPermission(PERMISSIONS.reputation.view)) {
     
    const summary = await ReputationSummaryService.getSummary(business.id, { ...business, role: ownerMembership.role, rbacRole: ownerMembership.rbacRole } as any);
    console.log("   Dashboard Stats:", summary);
  } else {
    console.log("   ❌ Owner lacks permission!");
  }

  // 6. Negative feedback appears
  console.log("✅ Owner checks Feedback Inbox...");
  const feedbackRes = await ReputationRepository.getFeedback(business.id);
  console.log(`   Total feedback records: ${feedbackRes.total}`);
  feedbackRes.data.forEach(fb => {
    console.log(`   - Rating: ${fb.rating} | Comment: ${fb.comment} | Status: ${fb.status}`);
  });

  // 7. Usage limit works
  console.log("✅ Staff member tries to create 7th review request (Should hit limit)...");
  const req7 = await ReviewRequestService.createRequest(
    staff.id,
    business.id,
    {
      campaignId: campaign.id,
      customerName: `Student 7`,
      customerPhone: `+12345678907`,
      source: 'WHATSAPP'
    }
  );
  if ('error' in req7) {
    console.log(`✅ correctly hit limit: ${req7.error}`);
  } else {
    console.error(`❌ Did not hit limit! Request created.`);
  }

  console.log("--- QA Scenario Complete ---");
}

runQa().catch(console.error).finally(() => prisma.$disconnect());
