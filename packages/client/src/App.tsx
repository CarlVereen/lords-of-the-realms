import { MAPS, type MapId } from '@lor/shared';
import { useEffect } from 'react';
import { joinGameRoom } from './net/colyseus';
import { useConnectionStore } from './net/store';
import { MapStage } from './render/MapStage';
import { useMapStore } from './state/mapStore';
import { CountyPanel } from './ui/CountyPanel';

export function App() {
  const status = useConnectionStore((state) => state.status);
  const roomId = useConnectionStore((state) => state.roomId);
  const error = useConnectionStore((state) => state.error);
  const currentMapId = useMapStore((state) => state.currentMapId);

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
          alignItems: 'center',
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
        <label
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#c9bda0',
          }}
        >
          Map
          <select
            value={currentMapId}
            onChange={(event) => {
              useMapStore.getState().setMap(event.target.value as MapId);
            }}
          >
            {Object.values(MAPS).map((gameMap) => (
              <option key={gameMap.id} value={gameMap.id}>
                {gameMap.name} ({gameMap.counties.length})
              </option>
            ))}
          </select>
        </label>
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
