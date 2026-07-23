// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateActivationProgress(business: any) {
  if (!business) return { steps: [], isFullyComplete: false, totalSteps: 0, completedSteps: 0 };

  const steps = [
    {
      id: "profile",
      isComplete: !!business.name && !!business.industryTemplateId,
    },
    {
      id: "branch",
      isComplete: (business.branches?.length || 0) > 0,
    },
    {
      id: "google-review",
      isComplete: (business.reputationSettings?.length || 0) > 0,
    },
    {
      id: "campaign",
      isComplete: (business.reviewCampaigns?.length || 0) > 0,
    },
    {
      id: "feedback",
      isComplete: (business.customerFeedback?.length || 0) > 0,
    },
    {
      id: "teammate",
      isComplete: (business.members?.length || 0) > 1,
    },
  ];

  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.isComplete).length;
  const isFullyComplete = completedSteps === totalSteps;

  return { steps, isFullyComplete, totalSteps, completedSteps };
}
