'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Reset when route changes complete
    setIsNavigating(false);
    setProgress(0);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Listen for link clicks to start progress
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && 
          anchor.href && 
          !anchor.href.startsWith('javascript:') &&
          !anchor.href.startsWith('tel:') &&
          !anchor.href.startsWith('mailto:') &&
          !anchor.target &&
          anchor.hostname === window.location.hostname) {
        
        // Don't trigger for same page anchors
        if (anchor.pathname !== pathname || anchor.search !== window.location.search) {
          setIsNavigating(true);
          setProgress(30);
          
          // Simulate progress
          setTimeout(() => setProgress(60), 100);
          setTimeout(() => setProgress(80), 200);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-1 z-[9999] bg-transparent"
      style={{
        opacity: isNavigating ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? 'none' : 'width 0.3s ease-out',
        }}
      />
    </div>
  );
}
