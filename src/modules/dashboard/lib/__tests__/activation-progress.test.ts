import { describe, it, expect } from "vitest";
import { calculateActivationProgress } from "../activation-progress";

describe("calculateActivationProgress", () => {
  it("returns 0 completed steps for a new business with no associated data", () => {
    const business = {
      name: "Test Business",
      industryTemplateId: "tmpl_1",
      branches: [],
      reputationSettings: [],
      reviewCampaigns: [],
      customerFeedback: [],
      members: [{ id: "mem_1" }], // Only owner
    };

    const result = calculateActivationProgress(business);
    expect(result.totalSteps).toBe(6);
    expect(result.completedSteps).toBe(1); // Profile is complete (name + template)
    expect(result.isFullyComplete).toBe(false);
  });

  it("calculates progress correctly based on relationships", () => {
    const business = {
      name: "Fully Active",
      industryTemplateId: "tmpl_2",
      branches: [{ id: "branch_1" }],
      reputationSettings: [{ id: "rep_1" }],
      reviewCampaigns: [{ id: "camp_1" }],
      customerFeedback: [{ id: "fb_1" }],
      members: [{ id: "mem_1" }, { id: "mem_2" }],
    };

    const result = calculateActivationProgress(business);
    expect(result.completedSteps).toBe(6);
    expect(result.isFullyComplete).toBe(true);
  });
});
