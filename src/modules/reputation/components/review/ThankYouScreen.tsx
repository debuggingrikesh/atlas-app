 

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ThankYouScreenProps {
  action: 'GOOGLE_REDIRECT' | 'INTERNAL_FEEDBACK_SAVED';
  redirectUrl?: string;
  userComment?: string;
}

export function ThankYouScreen({ action, redirectUrl, userComment }: ThankYouScreenProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (action === 'GOOGLE_REDIRECT' && userComment && navigator.clipboard) {
      navigator.clipboard.writeText(userComment).then(() => {
        setCopied(true);
      }).catch(err => {
        console.error('Failed to copy to clipboard', err);
      });
    }
  }, [action, userComment]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in-95 duration-500 py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {action === 'GOOGLE_REDIRECT' 
            ? 'Thank you for your feedback!' 
            : 'Thank you for helping us improve.'}
        </h2>
        <p className="text-muted-foreground">
          {action === 'GOOGLE_REDIRECT' 
            ? 'We are thrilled to hear you had a great experience.' 
            : 'Your feedback has been securely sent to our team.'}
        </p>
        
        {action === 'GOOGLE_REDIRECT' && userComment && (
          <div className="mt-4 p-4 bg-muted rounded-md border text-sm text-muted-foreground animate-in slide-in-from-bottom-2">
            {copied ? (
              <span className="text-green-600 font-medium flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                We've automatically copied your review to your clipboard!
              </span>
            ) : (
              <span>Your review is ready to be pasted on Google.</span>
            )}
          </div>
        )}
      </div>

      {action === 'GOOGLE_REDIRECT' && redirectUrl && (
        <a 
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto"
        >
          <Button size="lg" className="w-full sm:w-auto mt-4" onClick={() => {
            // Backup copy on click just in case auto-copy failed due to permissions
            if (userComment && navigator.clipboard && !copied) {
              navigator.clipboard.writeText(userComment).catch(() => {});
            }
          }}>
            Leave us a Google Review
          </Button>
        </a>
      )}
    </div>
  );
}
