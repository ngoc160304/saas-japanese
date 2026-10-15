'use client';

import { useEffect } from 'react';

export function useAdminJlptHashFocus(resource: string) {
  useEffect(() => {
    let frame = 0;
    const focus = () => {
      cancelAnimationFrame(frame);
      // Allow builder expansion and dialog/editor fields to mount before focusing.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          const id = window.location.hash.slice(1);
          if (
            !/^(exam-overview|session-\d+|part-\d+|question-[a-zA-Z-]+|answer-resource-\d+)$/.test(
              id,
            )
          )
            return;
          const element = document.getElementById(id);
          if (!element) return;
          const base = element.matches(':disabled') ? (element.parentElement ?? element) : element;
          const target = element.matches(
            'input:not(:disabled),textarea:not(:disabled),select:not(:disabled),button:not(:disabled)',
          )
            ? element
            : ((id.startsWith('answer-resource-')
                ? base.querySelector<HTMLElement>('textarea:not(:disabled)')
                : null) ??
              base.querySelector<HTMLElement>(
                'textarea:not(:disabled),input:not(:disabled),button:not(:disabled)',
              ) ??
              base);
          if (!target.hasAttribute('tabindex') && !target.matches('input,textarea,select,button'))
            target.tabIndex = -1;
          target.focus({ preventScroll: true });
          element.scrollIntoView({ block: 'center' });
        });
      });
    };
    focus();
    window.addEventListener('hashchange', focus);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', focus);
    };
  }, [resource]);
}
