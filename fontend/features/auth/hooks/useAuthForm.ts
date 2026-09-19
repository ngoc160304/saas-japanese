'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { selectAuthInitialized, selectIsAuthenticated } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import { getAuthError } from '../auth-error';

export function useAuthForm<T extends FieldValues>(
  form: UseFormReturn<T>,
  context: 'login' | 'register' | 'verify',
  fields: Path<T>[],
  destination = '/',
) {
  const router = useRouter();
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const status = useAppSelector((state) => state.auth.status);
  const locked = useRef(false);
  const busy = !initialized || !['idle', 'error'].includes(status);
  useEffect(() => {
    if (authenticated && !locked.current) router.replace(destination);
  }, [authenticated, destination, router]);

  async function submit<R>(
    operation: () => Promise<R>,
    pendingMessage: string,
    successMessage: string,
    onSuccess: (result: R) => void,
  ) {
    if (locked.current || busy || authenticated) return;
    locked.current = true;
    form.clearErrors();
    const id = toast.loading(pendingMessage);
    try {
      const result = await operation();
      form.reset();
      toast.success(successMessage, { id });
      onSuccess(result);
    } catch (error) {
      const failure = getAuthError(error, context);
      form.setError('root', { message: failure.message });
      for (const field of fields) {
        if (failure.fieldErrors[field])
          form.setError(field, { type: 'server', message: failure.fieldErrors[field] });
      }
      toast.error(failure.message, { id });
    } finally {
      locked.current = false;
    }
  }
  return { submit, busy: busy || authenticated, initialized };
}
