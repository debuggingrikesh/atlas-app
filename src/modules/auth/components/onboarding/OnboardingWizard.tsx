 

'use client';

import { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Step1ProfileForm } from '@/modules/auth/components/onboarding/Step1ProfileForm';
import { Step2BusinessForm } from '@/modules/auth/components/onboarding/Step2BusinessForm';
import { Step3IndustryForm } from '@/modules/auth/components/onboarding/Step3IndustryForm';
import { Step4BranchForm } from '@/modules/auth/components/onboarding/Step4BranchForm';

const SESSION_KEY = 'atlas_onboarding_data';

type OnboardingData = {
  fullName?: string;
  businessName?: string;
  industryTemplateId?: string;
  branchName?: string;
  branchAddress?: string;
};

/** Read persisted data from sessionStorage (safe: returns {} on any error). */
function readSession(): OnboardingData {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as OnboardingData) : {};
  } catch {
    return {};
  }
}

/** Merge and persist data to sessionStorage. */
function writeSession(patch: Partial<OnboardingData>): OnboardingData {
  const next = { ...readSession(), ...patch };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // sessionStorage unavailable — carry on anyway
  }
  return next;
}

/** Clear persisted onboarding draft after successful completion. */
function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function OnboardingWizard() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const currentStep = Number(params.step) || 1;

  // Hydrate from sessionStorage via lazy initializer — runs once, avoids useEffect setState
  const [data, setData] = useState<OnboardingData>(() => readSession());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  function goTo(step: number) {
    router.push(`/onboarding/step/${step}`);
  }

  async function handleStep1(values: { fullName: string }) {
    if (returnTo) {
      setSubmitting(true);
      setSubmitError(undefined);
      try {
        // 1. Create the user profile by pushing step 4 to onboarding draft
        const draftRes = await fetch('/api/onboarding/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 4, data: null }),
        });
        if (!draftRes.ok) throw new Error('Failed to create profile skeleton.');

        // 2. Update the full name
        const profileRes = await fetch('/api/users/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName: values.fullName }),
        });
        if (!profileRes.ok) throw new Error('Failed to save profile name.');

        clearSession();
        router.push(returnTo);
      } catch (err) {
        console.error(err);
        setSubmitError('Failed to save profile. Please try again.');
        setSubmitting(false);
      }
      return;
    }

    setData(writeSession(values));
    goTo(2);
  }

  function handleStep2(values: { businessName: string }) {
    setData(writeSession(values));
    goTo(3);
  }

  function handleStep3(values: { industryTemplateId: string }) {
    setData(writeSession(values));
    goTo(4);
  }

  async function handleStep4(values: { branchName: string; branchAddress?: string }) {
    // Read fresh from sessionStorage in case React state lagged behind
    const final = { ...readSession(), ...values };

    if (!final.fullName || !final.businessName || !final.industryTemplateId || !final.branchName) {
      setSubmitError('Missing required information. Please start from step 1.');
      return;
    }

    setSubmitting(true);
    setSubmitError(undefined);

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: final.fullName,
          businessName: final.businessName,
          industryTemplateId: final.industryTemplateId,
          branchName: final.branchName,
          branchAddress: final.branchAddress,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setSubmitError(json.error?.message ?? 'Failed to complete setup. Please try again.');
        return;
      }

      clearSession();
      const { businessSlug } = json.data;
      router.push(`/dashboard/${businessSlug}`);
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    { number: 1, label: 'Profile' },
    { number: 2, label: 'Business' },
    { number: 3, label: 'Industry' },
    { number: 4, label: 'Branch' },
  ];

  return (
    <div className="w-full max-w-lg space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.number} className="flex flex-1 items-center gap-2">
            <div
              className={[
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                currentStep === s.number
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > s.number
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground',
              ].join(' ')}
            >
              {s.number}
            </div>
            <span
              className={[
                'text-sm hidden sm:block',
                currentStep === s.number ? 'font-medium text-foreground' : 'text-muted-foreground',
              ].join(' ')}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      {currentStep === 1 && (
        <Step1ProfileForm defaultValue={data.fullName} onNext={handleStep1} />
      )}
      {currentStep === 2 && (
        <Step2BusinessForm
          defaultValue={data.businessName}
          onNext={handleStep2}
          onBack={() => goTo(1)}
        />
      )}
      {currentStep === 3 && (
        <Step3IndustryForm
          defaultValue={data.industryTemplateId}
          onNext={handleStep3}
          onBack={() => goTo(2)}
        />
      )}
      {currentStep === 4 && (
        <Step4BranchForm
          defaultBranchName={data.branchName}
          defaultAddress={data.branchAddress}
          onNext={handleStep4}
          onBack={() => goTo(3)}
          submitting={submitting}
          error={submitError}
        />
      )}
    </div>
  );
}
