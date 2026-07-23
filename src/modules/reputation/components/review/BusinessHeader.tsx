 

import React from 'react';

interface BusinessHeaderProps {
  name: string;
  logoUrl?: string | null;
}

import Image from 'next/image';

export function BusinessHeader({ name, logoUrl }: BusinessHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      {logoUrl ? (
        <div className="relative h-16 w-16 overflow-hidden rounded-full shadow-sm ring-1 ring-border">
          <Image
            src={logoUrl}
            alt={`${name} logo`}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary shadow-sm ring-1 ring-border">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{name}</h1>
    </div>
  );
}
