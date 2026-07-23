/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationProgressInner() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [prevPath, setPrevPath] = useState(pathname);
  const [prevSearch, setPrevSearch] = useState(searchParams.toString());

  if (pathname !== prevPath || searchParams.toString() !== prevSearch) {
    setPrevPath(pathname);
    setPrevSearch(searchParams.toString());
    setIsNavigating(false);
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (!anchor) return;
      
      const href = anchor.getAttribute('href');
      
      // Only track internal navigation that isn't just an anchor hash
      if (
        href && 
        href.startsWith('/') && 
        !href.startsWith('//') && 
        !href.startsWith('#') &&
        href !== pathname
      ) {
        // If meta keys are pressed, it opens in a new tab, so no progress needed
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        
        setIsNavigating(true);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-primary/20 overflow-hidden">
      <div className="h-full bg-primary animate-[progress_1.5s_ease-in-out_infinite]" />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress {
          0% { width: 0%; transform: translateX(0); }
          50% { width: 30%; transform: translateX(100vw); }
          100% { width: 100%; transform: translateX(100vw); }
        }
      `}} />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
