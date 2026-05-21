import { countyById } from '@lor/shared';
import { useSelectionStore } from '../state/selectionStore';

/**
 * The county-detail panel. In M1.1 it shows the selected county's name and an
 * empty state; from M1.2 its body fills with economy, population, and army
 * management for the selected county.
 *
 * This is the only React consumer of the selection store (see CLAUDE.md §11).
 */
export function CountyPanel() {
  const selectedCountyId = useSelectionStore((state) => state.selectedCountyId);
  const county = selectedCountyId ? countyById[selectedCountyId] : null;

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
