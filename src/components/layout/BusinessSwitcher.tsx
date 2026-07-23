 

'use client';

import { useState } from 'react';
import { useBusiness } from '@/modules/business/components/BusinessProvider';
import { Building2, PlusCircle, ChevronDown } from 'lucide-react';
import { CreateBusinessModal } from './CreateBusinessModal';

export function BusinessSwitcher() {
  const { currentBusiness, businesses, setActiveBusiness } = useBusiness();
  const [modalOpen, setModalOpen] = useState(false);

  if (!businesses || businesses.length === 0) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Create Business
        </button>
        <CreateBusinessModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        {businesses.length === 1 && currentBusiness ? (
          <span className="truncate text-sm font-medium">{currentBusiness.name}</span>
        ) : (
          <div className="relative flex items-center">
            <select
              className="h-9 w-[200px] appearance-none rounded-md border border-input bg-transparent pl-3 pr-8 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={currentBusiness?.id || ''}
              onChange={(e) => setActiveBusiness(e.target.value)}
              aria-label="Switch active business"
            >
              <option value="" disabled>Select a business</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
        <button
          onClick={() => setModalOpen(true)}
          className="ml-1 flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Create a new business"
          aria-label="Create a new business"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <CreateBusinessModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
