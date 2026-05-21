import { useEffect } from 'react';
import { joinGameRoom } from './net/colyseus';
import { useConnectionStore } from './net/store';
import { MapStage } from './render/MapStage';

export function App() {
  const status = useConnectionStore((state) => state.status);
  const roomId = useConnectionStore((state) => state.roomId);
  const error = useConnectionStore((state) => state.error);

  useEffect(() => {
    const { setConnecting, setConnected, setError } = useConnectionStore.getState();
    let room: Awaited<ReturnType<typeof joinGameRoom>> | null = null;

    setConnecting();
    joinGameRoom()
      .then((joined) => {
        room = joined;
        setConnected(joined.roomId);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : String(cause));
      });

    return () => {
      void room?.leave();
    };
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Lords of the Realms</h1>
      <p style={{ color: '#666' }}>Milestone M0 — repo scaffold</p>
      <p>
        Server connection: <strong>{status}</strong>
        {roomId ? ` — room ${roomId}` : ''}
        {error ? ` — ${error}` : ''}
      </p>
      <MapStage />
    </main>
  );
}
