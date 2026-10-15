'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Covers editor buttons and same-tab links (including the existing shell).
 * No history patching: browser back/forward within the SPA is not intercepted. */
export function useAdminJlptQuestionExit(dirty: boolean, pending: boolean) {
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const bypass = useRef(false);
  const requestExit = useCallback(
    (href: string) => {
      if (pending) return;
      if (dirty && !bypass.current) setDestination(href);
      else router.push(href);
    },
    [dirty, pending, router],
  );
  useEffect(() => {
    if (!dirty && !pending) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (bypass.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    const onClick = (event: MouseEvent) => {
      if (
        bypass.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self')
      )
        return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      event.preventDefault();
      event.stopPropagation();
      requestExit(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty, pending, requestExit]);
  return {
    destination,
    requestExit,
    cancel: () => setDestination(null),
    discard: () => {
      if (!destination || pending) return;
      bypass.current = true;
      setDestination(null);
      router.push(destination);
    },
  };
}
