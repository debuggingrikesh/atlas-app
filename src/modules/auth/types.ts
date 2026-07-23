 

// Auth module types

export type AuthUser = {
  id: string;
  email: string;
  emailConfirmedAt: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  onboardingStep: number;
  onboardingCompletedAt: Date | null;
  onboardingData: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
