import {
  commitHarvest,
  DEFAULT_ECONOMY_CONFIG,
  getMap,
  projectFoodBalance,
  seasonForTurn,
  yearForTurn,
} from '@lor/shared';
import type { CSSProperties, ReactNode } from 'react';
import { useGameStore } from '../state/gameStore';
import { useMapStore } from '../state/mapStore';
import { useSelectionStore } from '../state/selectionStore';

const cfg = DEFAULT_ECONOMY_CONFIG;

/**
 * The county economy panel (M1.2). Shows the selected county's land, fertility,
 * granary and last-turn report; the home county can re-allocate land in spring.
 *
 * The only React consumer of the selection store (see CLAUDE.md §11).
 */
export function CountyPanel() {
  const currentMapId = useMapStore((state) => state.currentMapId);
  const selectedCountyId = useSelectionStore((state) => state.selectedCountyId);
  const game = useGameStore((state) => state.game);
  const homeCountyId = useGameStore((state) => state.homeCountyId);
  const lastReports = useGameStore((state) => state.lastReports);
  const setLandAllocation = useGameStore((state) => state.setLandAllocation);

  const map = getMap(currentMapId);
  const staticCounty = selectedCountyId
    ? (map.counties.find((candidate) => candidate.id === selectedCountyId) ?? null)
    : null;
  const county = selectedCountyId
    ? (game.counties.find((candidate) => candidate.countyId === selectedCountyId) ?? null)
    : null;

  if (!staticCounty || !county) {
    return (
      <aside style={panelStyle}>
        <div style={emptyStyle}>Select a county to view its economy.</div>
      </aside>
    );
  }

  const season = seasonForTurn(game.turn);
  const year = yearForTurn(game.turn);
  const isHome = county.countyId === homeCountyId;
  const canEdit = isHome && season === 'spring';
  const report = lastReports.find((entry) => entry.countyId === county.countyId) ?? null;
  const expectedHarvest = commitHarvest(county.land.crops, county.fertility, cfg.crop);
  const projectedFood = projectFoodBalance(county, season, cfg);

  const adjust = (deltaCrops: number, deltaPasture: number): void => {
    setLandAllocation(county.land.crops + deltaCrops, county.land.pasture + deltaPasture);
  };

  return (
    <aside style={panelStyle}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 24 }}>
          {staticCounty.name}
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7a6e52' }}>
          {isHome ? 'Your home county' : 'Unclaimed'} · {capitalize(season)}, Year {year}
        </p>
      </header>

      <div style={bodyStyle}>
        {report && report.foodShortfall > 0 ? (
          <div style={famineStyle}>
            ⚠ Famine — {report.foodShortfall} food short. Left unfed, {report.starvationLosses}{' '}
            peasants would be lost (population loss arrives with M1.3).
          </div>
        ) : null}

        <Section title="Land use">
          <LandRow
            label="Crops"
            value={county.land.crops}
            canEdit={canEdit}
            onInc={() => adjust(1, 0)}
            onDec={() => adjust(-1, 0)}
          />
          <LandRow
            label="Pasture"
            value={county.land.pasture}
            canEdit={canEdit}
            onInc={() => adjust(0, 1)}
            onDec={() => adjust(0, -1)}
          />
          <Stat label="Fallow" value={county.land.fallow} />
          {!canEdit ? (
            <p style={noteStyle}>
              {isHome
                ? 'Land is sown in spring and locked for the year.'
                : 'Only your home county can be managed.'}
            </p>
          ) : null}
        </Section>

        <Section title="County">
          <Stat label="Fertility" value={`${Math.round(county.fertility * 100)}%`} />
          <Stat label="Granary" value={county.granary} />
          <Stat label="Population" value={county.population} />
          <Stat label="Livestock" value={county.livestock} />
        </Section>

        <Section title="Projection">
          <Stat label="Expected harvest" value={`~${expectedHarvest} grain`} />
          <Stat label="Next turn food" value={signed(projectedFood)} />
        </Section>

        {report ? (
          <Section title={`Last turn — ${capitalize(report.season)}`}>
            <Stat label="Grain harvested" value={report.grainHarvested} />
            <Stat label="Livestock food" value={report.livestockFood} />
            <Stat label="Livestock born" value={report.livestockBorn} />
            <Stat label="Food consumed" value={report.foodConsumed} />
            <Stat label="Food balance" value={signed(report.foodBalance)} />
            <Stat label="Fertility change" value={signed(report.fertilityChange)} />
          </Section>
        ) : null}
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 18 }}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={rowStyle}>
      <span style={{ color: '#7a6e52' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function LandRow({
  label,
  value,
  canEdit,
  onInc,
  onDec,
}: {
  label: string;
  value: number;
  canEdit: boolean;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div style={rowStyle}>
      <span style={{ color: '#7a6e52' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {canEdit ? (
          <button type="button" style={stepperStyle} onClick={onDec}>
            −
          </button>
        ) : null}
        <span style={{ fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{value}</span>
        {canEdit ? (
          <button type="button" style={stepperStyle} onClick={onInc}>
            +
          </button>
        ) : null}
      </span>
    </div>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

const panelStyle: CSSProperties = {
  width: 300,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  background: '#efe7d3',
  borderLeft: '1px solid #cabfa3',
  color: '#3a3122',
};

const headerStyle: CSSProperties = {
  padding: '18px 20px',
  borderBottom: '1px solid #d8ccae',
};

const bodyStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: 20,
  fontSize: 14,
};

const emptyStyle: CSSProperties = {
  margin: 'auto',
  padding: 24,
  textAlign: 'center',
  fontSize: 14,
  color: '#7a6e52',
};

const famineStyle: CSSProperties = {
  marginBottom: 18,
  padding: '10px 12px',
  borderRadius: 4,
  background: '#7a2318',
  color: '#f6e3d4',
  fontSize: 13,
  lineHeight: 1.5,
};

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 8px',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  color: '#9a8c68',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 0',
};

const noteStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 12,
  fontStyle: 'italic',
  color: '#9a8c68',
};

const stepperStyle: CSSProperties = {
  width: 24,
  height: 24,
  border: '1px solid #b6a982',
  background: '#e3d8ba',
  borderRadius: 3,
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
  color: '#3a3122',
};
