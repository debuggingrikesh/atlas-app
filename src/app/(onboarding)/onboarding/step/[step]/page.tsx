import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OnboardingWizard } from '@/modules/auth/components/onboarding/OnboardingWizard';

export const metadata: Metadata = {
  title: 'Set up your business — Project Atlas',
  description: 'Complete your business setup to start collecting customer feedback.',
};

const VALID_STEPS = [1, 2, 3, 4];

interface Props {
  params: Promise<{ step: string }>;
}

export default async function OnboardingStepPage({ params }: Props) {
  const { step } = await params;
  const stepNumber = Number(step);

  if (!VALID_STEPS.includes(stepNumber)) {
    notFound();
  }

  return <OnboardingWizard />;
}

export function generateStaticParams() {
  return VALID_STEPS.map((step) => ({ step: String(step) }));
}
