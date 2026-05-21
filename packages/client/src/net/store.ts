import { create } from 'zustand';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface ConnectionState {
  status: ConnectionStatus;
  roomId: string | null;
  error: string | null;
  setConnecting: () => void;
  setConnected: (roomId: string) => void;
  setError: (error: string) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'idle',
  roomId: null,
  error: null,
  setConnecting: () => set({ status: 'connecting', error: null }),
  setConnected: (roomId) => set({ status: 'connected', roomId }),
  setError: (error) => set({ status: 'error', error }),
}));
