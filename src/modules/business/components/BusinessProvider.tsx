/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { BusinessWithMembership } from '@/modules/business/types';
import { useParams, useRouter, usePathname } from 'next/navigation';

interface BusinessContextValue {
  currentBusiness: BusinessWithMembership | null;
  businessId: string | null;
  businesses: BusinessWithMembership[];
  setActiveBusiness: (id: string) => void;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

export function BusinessProvider({
  children,
  initialBusinesses,
}: {
  children: React.ReactNode;
  initialBusinesses: BusinessWithMembership[];
}) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  
  // If no businesses exist, default to null.
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(
    initialBusinesses.length > 0 ? initialBusinesses[0].id : null
  );

  useEffect(() => {
    // 1. Sync from URL slug if available
    if (params.businessSlug) {
      const b = initialBusinesses.find(b => b.slug === params.businessSlug);
      if (b) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentBusinessId(b.id);
        localStorage.setItem('activeBusinessId', b.id);
        document.cookie = `activeBusinessId=${b.id}; path=/; max-age=31536000`;
        return;
      }
    }

    // 2. Otherwise sync from localStorage if available
    const stored = localStorage.getItem('activeBusinessId');
    if (stored && initialBusinesses.some(b => b.id === stored)) {
      setCurrentBusinessId(stored);
      document.cookie = `activeBusinessId=${stored}; path=/; max-age=31536000`;
    }
  }, [params.businessSlug, initialBusinesses]);

  const setActiveBusiness = (id: string) => {
    const b = initialBusinesses.find(b => b.id === id);
    if (b) {
      setCurrentBusinessId(id);
      localStorage.setItem('activeBusinessId', id);
      document.cookie = `activeBusinessId=${id}; path=/; max-age=31536000`;
      
      // If we are currently on a dashboard page that uses the slug, navigate to the new slug.
      if (pathname.startsWith('/dashboard/')) {
        router.push(`/dashboard/${b.slug}`);
      } else if (pathname.startsWith('/settings/')) {
        // If we're on a settings page, refresh to trigger server components to re-read the cookie
        router.refresh();
      }
    }
  };

  const currentBusiness = initialBusinesses.find(b => b.id === currentBusinessId) || initialBusinesses[0] || null;

  return (
    <BusinessContext.Provider
      value={{
        currentBusiness,
        businessId: currentBusiness?.id || null,
        businesses: initialBusinesses,
        setActiveBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
