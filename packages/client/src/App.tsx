import { useEffect } from 'react';
import { joinGameRoom } from './net/colyseus';
import { useConnectionStore } from './net/store';
import { MapStage } from './render/MapStage';
import { CountyPanel } from './ui/CountyPanel';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 16,
          padding: '10px 18px',
          background: '#2b2117',
          color: '#f0e7d2',
        }}
      >
        <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 20 }}>
          Lords of the Realms
        </h1>
        <span style={{ fontSize: 12, color: '#c9bda0' }}>
          Server: {status}
          {roomId ? ` · room ${roomId}` : ''}
          {error ? ` · ${error}` : ''}
        </span>
      </header>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <MapStage />
        </div>
        <CountyPanel />
      </div>
    </div>
  );
}
