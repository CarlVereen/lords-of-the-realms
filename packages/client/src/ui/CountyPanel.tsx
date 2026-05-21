import { getMap } from '@lor/shared';
import { useMapStore } from '../state/mapStore';
import { useSelectionStore } from '../state/selectionStore';

/**
 * The county-detail panel. In M1.1 it shows the selected county's name and an
 * empty state; from M1.2 its body fills with economy, population, and army
 * management for the selected county.
 *
 * The only React consumer of the selection store (see CLAUDE.md §11).
 */
export function CountyPanel() {
  const currentMapId = useMapStore((state) => state.currentMapId);
  const selectedCountyId = useSelectionStore((state) => state.selectedCountyId);
  const map = getMap(currentMapId);
  const county = selectedCountyId
    ? (map.counties.find((candidate) => candidate.id === selectedCountyId) ?? null)
    : null;

  return (
    <aside
      style={{
        width: 300,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#efe7d3',
        borderLeft: '1px solid #cabfa3',
        color: '#3a3122',
      }}
    >
      {county ? (
        <>
          <header style={{ padding: '18px 20px', borderBottom: '1px solid #d8ccae' }}>
            <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 24 }}>{county.name}</h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7a6e52' }}>Owner: Unclaimed</p>
          </header>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: 20,
              fontSize: 14,
              lineHeight: 1.6,
              color: '#6b6048',
            }}
          >
            County management — land, population, and armies — arrives with milestone M1.2.
          </div>
        </>
      ) : (
        <div
          style={{
            margin: 'auto',
            padding: 24,
            textAlign: 'center',
            fontSize: 14,
            color: '#7a6e52',
          }}
        >
          Select a county to view its details.
        </div>
      )}
    </aside>
  );
}
