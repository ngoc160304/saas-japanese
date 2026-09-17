import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UseCrudCreateOptions<TCreate, TResponse> {
  queryKey: readonly unknown[];
  mutationFn: (data: TCreate) => Promise<TResponse>;
}

export function useCrudCreate<TCreate, TResponse>({
  queryKey,
  mutationFn,
}: UseCrudCreateOptions<TCreate, TResponse>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey,
      });
    },
  });
}
