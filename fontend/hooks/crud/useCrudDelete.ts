import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UseCrudDeleteOptions {
  queryKey: readonly unknown[];
  mutationFn: (id: number) => Promise<unknown>;
}

export function useCrudDelete({ queryKey, mutationFn }: UseCrudDeleteOptions) {
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
