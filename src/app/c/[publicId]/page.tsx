/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import Link from 'next/link';
import { FeedbackService } from '@/modules/reputation/services/feedback-service';
import { ReviewPage } from '@/modules/reputation/components/review/ReviewPage';

interface PageProps {
  params: Promise<{ publicId: string }>;
}

export default async function PublicCampaignPage({ params }: PageProps) {
  const { publicId } = await params;
  const result = await FeedbackService.getCampaignDetailsByPublicId(publicId);

  // Render a full-page layout for the message
  const renderMessage = (title: string, description: string) => (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="mx-auto max-w-md w-full rounded-xl border bg-card p-6 shadow-sm text-center">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <Link 
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );

  if (result.error || !result.campaign) {
    if (result.status === 404) {
      return renderMessage('Invalid Link', 'This campaign link is no longer available or does not exist.');
    }
    if (result.status === 400 && result.error.includes('inactive')) {
      return renderMessage('Campaign Inactive', 'This campaign is currently inactive.');
    }
    return renderMessage('Error', 'An unexpected error occurred. Please try again.');
  }

  const { business, name: campaignName } = result.campaign;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <ReviewPage 
        submitUrl={`/api/public/campaigns/${publicId}`}
        business={{
          name: business.name,
          logoUrl: business.logoUrl,
        }}
        campaign={{
          name: campaignName,
        }}
      />
    </div>
  );
}
