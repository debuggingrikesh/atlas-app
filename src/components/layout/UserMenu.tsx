'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';

interface UserMenuProps {
  fullName: string;
  email: string;
}

export function UserMenu({ fullName, email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus:outline-none"
        aria-label="User menu"
      >
        <span className="text-sm font-medium">
          {fullName ? fullName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border bg-popover shadow-md outline-none animate-in fade-in zoom-in-95">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium leading-none truncate">{fullName}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{email}</p>
          </div>
          <div className="p-1">
            <Link
              href="/settings/profile"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="w-4 h-4" />
              Profile Settings
            </Link>
          </div>
          <div className="border-t border-border p-1">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-red-500 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
