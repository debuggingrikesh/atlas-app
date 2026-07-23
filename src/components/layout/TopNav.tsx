 

'use client';

import { NotificationBell } from '@/modules/notifications/components/NotificationBell';
import { BusinessSwitcher } from './BusinessSwitcher';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';

interface TopNavProps {
  userFullName: string;
  userEmail: string;
}

export function TopNav({ userFullName, userEmail }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:h-[60px] lg:px-6">
      <MobileNav />

      <div className="w-full flex-1">
        <BusinessSwitcher />
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <NotificationBell />
        <UserMenu fullName={userFullName} email={userEmail} />
      </div>
    </header>
  );
}
