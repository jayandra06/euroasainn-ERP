import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const STORAGE_EVENT_KEY = 'data-sync';

interface DataSyncEventDetail {
  queryKeys: string[][];
  timestamp: number;
}

export function triggerCrossTabSync(queryKeys: string[][]) {
  window.localStorage.setItem(
    STORAGE_EVENT_KEY,
    JSON.stringify({ queryKeys, timestamp: Date.now() })
  );
}

export function useCrossTabSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_EVENT_KEY && event.newValue) {
        try {
          const { queryKeys }: DataSyncEventDetail = JSON.parse(event.newValue);
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        } catch (error) {
          console.error('Failed to parse data-sync event from localStorage', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient]);
}
