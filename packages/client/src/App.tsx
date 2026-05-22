import { MAPS, seasonForTurn, yearForTurn, type MapId } from '@lor/shared';
import { useEffect } from 'react';
import { joinGameRoom } from './net/colyseus';
import { useConnectionStore } from './net/store';
import { MapStage } from './render/MapStage';
import { useGameStore } from './state/gameStore';
import { useMapStore } from './state/mapStore';
import { useSelectionStore } from './state/selectionStore';
import { CountyPanel } from './ui/CountyPanel';

export function App() {
  const status = useConnectionStore((state) => state.status);
  const roomId = useConnectionStore((state) => state.roomId);
  const error = useConnectionStore((state) => state.error);
  const currentMapId = useMapStore((state) => state.currentMapId);
  const turn = useGameStore((state) => state.game.turn);

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

  // A new map is a new game: re-seed the realm and drop the stale selection.
  useEffect(() => {
    useGameStore.getState().resetGame(currentMapId);
    useSelectionStore.getState().selectCounty(null);
  }, [currentMapId]);

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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '8px 18px',
          background: '#3a2e1f',
          color: '#e7dcc2',
          borderBottom: '1px solid #1e160d',
        }}
      >
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 15 }}>
          Year {yearForTurn(turn)} · {capitalize(seasonForTurn(turn))}
        </span>
        <span style={{ fontSize: 12, color: '#a99b78' }}>turn {turn}</span>
        <button
          type="button"
          style={{
            marginLeft: 'auto',
            padding: '6px 16px',
            background: '#c8a24a',
            border: '1px solid #8a6f2b',
            borderRadius: 4,
            color: '#2b2117',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={() => {
            useGameStore.getState().advanceTurn();
          }}
        >
          Advance Turn
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <MapStage />
        </div>
        <CountyPanel />
      </div>
    </div>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
