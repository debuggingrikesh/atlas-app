 

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useBusiness } from '@/modules/business/components/BusinessProvider';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Settings, 
  MapPin, 
  Shield, 
  UserCircle,
  Star,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolvePermissions } from '@/lib/permissions/resolve-permissions';
import { PERMISSIONS } from '@atlas/core/auth';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { currentBusiness } = useBusiness();



  if (!currentBusiness) {
    return (
      <button
        className="shrink-0 md:hidden p-2 rounded-md hover:bg-muted focus:outline-none opacity-50 cursor-not-allowed"
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    );
  }

  const perms = resolvePermissions(currentBusiness);

  const navItems = [
    {
      name: 'Dashboard',
      href: `/dashboard/${currentBusiness.slug}`,
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Reputation',
      href: `/dashboard/${currentBusiness.slug}/reputation`,
      icon: Star,
      show: perms.hasPermission(PERMISSIONS.reputation.view),
    },
    {
      name: 'Billing & Plan',
      href: `/dashboard/${currentBusiness.slug}/settings/subscription`,
      icon: CreditCard,
      show: perms.hasPermission(PERMISSIONS.business.read),
    },
    {
      name: 'Team',
      href: '/settings/team',
      icon: Users,
      show: perms.hasPermission(PERMISSIONS.member.read),
    },
    {
      name: 'Activity Timeline',
      href: '/settings/activity',
      icon: Activity,
      show: perms.hasPermission(PERMISSIONS.activity.read),
    },
    {
      name: 'Business Settings',
      href: '/settings/business',
      icon: Settings,
      show: perms.hasPermission(PERMISSIONS.business.read),
    },
    {
      name: 'Branches',
      href: '/settings/branches',
      icon: MapPin,
      show: perms.hasPermission(PERMISSIONS.branch.read),
    },
    {
      name: 'Roles & Permissions',
      href: '/settings/roles',
      icon: Shield,
      show: perms.hasPermission(PERMISSIONS.role.read),
    },
    {
      name: 'My Profile',
      href: '/settings/profile',
      icon: UserCircle,
      show: true,
    },
  ].filter((item) => item.show);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            className="shrink-0 md:hidden p-2 rounded-md hover:bg-muted focus:outline-none"
            aria-label="Toggle navigation menu"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
            <span className="">Atlas</span>
          </Link>
        </div>
        <div className="overflow-auto py-4">
          <nav className="grid gap-1 px-2 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                    isActive 
                      ? 'bg-muted text-primary' 
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
