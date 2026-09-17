import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UseCrudUpdateOptions<TData, TResponse> {
  queryKey: readonly unknown[];
  mutationFn: (id: string | number, data: TData) => Promise<TResponse>;
}

interface UpdateVariables<TData> {
  id: string | number;
  data: TData;
}

export function useCrudUpdate<TData, TResponse>({
  queryKey,
  mutationFn,
}: UseCrudUpdateOptions<TData, TResponse>) {
  const queryClient = useQueryClient();

  return useMutation<TResponse, Error, UpdateVariables<TData>>({
    mutationFn: ({ id, data }) => mutationFn(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey,
      });
    },
  });
}
