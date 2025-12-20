
import { useCallback } from 'react';
import { useStore } from './useStore';

/**
 * Hook utilitário para expor a função de atualização.
 * Removido o useEffect para evitar loops de montagem.
 */
export const useInitializeData = () => {
  const refreshData = useStore(state => state.refreshData);
  
  const refreshAll = useCallback(async (fullLoading = false) => {
    await refreshData(fullLoading);
  }, [refreshData]);

  return { refreshAll };
};
