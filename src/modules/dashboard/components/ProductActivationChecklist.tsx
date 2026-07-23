import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { calculateActivationProgress } from "../lib/activation-progress";

interface ProductActivationChecklistProps {
  businessId: string;
  businessSlug: string;
}

export async function ProductActivationChecklist({ businessId, businessSlug }: ProductActivationChecklistProps) {
  // Fetch required data for activation state
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      branches: { take: 1 },
      reputationSettings: { take: 1 },
      reviewCampaigns: { take: 1 },
      customerFeedback: { take: 1 },
      members: { take: 2 }, // Check if there's more than just the owner
    },
  });

  if (!business) return null;

  const steps = [
    {
      id: "profile",
      title: "Complete business profile",
      description: "Ensure your business details are accurate.",
      isComplete: !!business.name && !!business.industryTemplateId,
      href: `/dashboard/${businessSlug}/settings/business`,
    },
    {
      id: "branch",
      title: "Add your first branch",
      description: "Define a physical location for reviews.",
      isComplete: business.branches.length > 0,
      href: `/dashboard/${businessSlug}/settings/branches`,
    },
    {
      id: "google-review",
      title: "Add Google review destination",
      description: "Set up where high ratings will be redirected.",
      isComplete: business.reputationSettings.length > 0,
      href: `/dashboard/${businessSlug}/reputation/settings/ai`, // Simplification for MVP
    },
    {
      id: "campaign",
      title: "Create your first campaign",
      description: "Start collecting reviews from customers.",
      isComplete: business.reviewCampaigns.length > 0,
      href: `/dashboard/${businessSlug}/reputation/campaigns`,
    },
    {
      id: "feedback",
      title: "Receive your first feedback",
      description: "Wait for a customer to submit a review.",
      isComplete: business.customerFeedback.length > 0,
      href: `/dashboard/${businessSlug}/reputation/feedback`,
    },
    {
      id: "teammate",
      title: "Invite a teammate",
      description: "Bring your team into Atlas.",
      isComplete: business.members.length > 1,
      href: `/dashboard/${businessSlug}/settings/team`,
    },
  ];

  const { isFullyComplete, totalSteps, completedSteps, steps: progressSteps } = calculateActivationProgress(business);
  
  // Merge dynamic completion state with UI presentation info
  const displaySteps = steps.map(step => ({
    ...step,
    isComplete: progressSteps.find(ps => ps.id === step.id)?.isComplete || false
  }));

  if (isFullyComplete) {
    return null; // Hide when complete
  }

  return (
    <div className="rounded-lg border bg-card p-6 col-span-1 lg:col-span-3">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Activation Checklist</h2>
        <p className="text-sm text-muted-foreground">
          Complete these steps to get the most out of Atlas ({completedSteps}/{totalSteps}).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displaySteps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={`flex items-start gap-3 rounded-md border p-4 transition-colors hover:bg-muted/50 ${
              step.isComplete ? "opacity-60" : ""
            }`}
          >
            {step.isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div>
              <p className={`font-medium ${step.isComplete ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
