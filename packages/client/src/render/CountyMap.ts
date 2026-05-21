import { COUNTIES, type County, type CountyId } from '@lor/shared';
import { Container, type FederatedPointerEvent, Graphics, Polygon, Text } from 'pixi.js';

/**
 * Per-county base fill colours. Purely presentational and temporary — once
 * counties have owners (M1.2+), fill becomes the owning lord's colour.
 */
const COUNTY_COLORS: Record<CountyId, number> = {
  northumbria: 0x6f8f5f,
  lancaster: 0xa07154,
  york: 0xb59149,
  mercia: 0x8aa46c,
  anglia: 0xc4ab68,
  wessex: 0x5f8a6f,
  cornwall: 0xb0926a,
  kent: 0x9c8b56,
};

const BORDER_COLOR = 0x33291c;
const SELECTED_BORDER_COLOR = 0xffd24a;
const LABEL_COLOR = 0x241c10;

/** Blends a colour toward white by `amount` (0–1). */
function lighten(color: number, amount: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const mix = (channel: number): number => Math.round(channel + (255 - channel) * amount);
  return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

interface CountyView {
  county: County;
  shape: Graphics;
  label: Text;
  points: number[];
}

/**
 * Renders the strategic county map into a Pixi container. Owns the per-county
 * Graphics + labels, hover/click interaction, and the selection highlight.
 *
 * This is a plain renderer — it never touches the selection store directly; it
 * reports clicks through the `onSelect` callback and is told the current
 * selection via `setSelected` (see CLAUDE.md §11, Separation).
 */
export class CountyMap {
  readonly container: Container;
  private readonly shapesLayer = new Container();
  private readonly labelsLayer = new Container();
  private readonly views = new Map<CountyId, CountyView>();
  private selectedId: CountyId | null = null;
  private hoveredId: CountyId | null = null;
  private pointerDownAt: { x: number; y: number } | null = null;

  constructor(private readonly onSelect: (id: CountyId) => void) {
    this.container = new Container();
    this.container.addChild(this.shapesLayer, this.labelsLayer);
    for (const county of COUNTIES) {
      this.views.set(county.id, this.createView(county));
    }
  }

  private createView(county: County): CountyView {
    const points = county.polygon.flatMap((point) => [point.x, point.y]);

    const shape = new Graphics();
    shape.eventMode = 'static';
    shape.cursor = 'pointer';
    // Exact-shape hit test — adjacent irregular polygons have overlapping
    // bounding boxes, so default Graphics hit-testing would mis-select borders.
    shape.hitArea = new Polygon(points);
    shape.on('pointerover', () => {
      this.hoveredId = county.id;
      this.paintCounty(county.id);
    });
    shape.on('pointerout', () => {
      if (this.hoveredId === county.id) {
        this.hoveredId = null;
        this.paintCounty(county.id);
      }
    });
    shape.on('pointerdown', (event) => {
      this.pointerDownAt = { x: event.global.x, y: event.global.y };
    });
    shape.on('pointertap', (event) => {
      event.stopPropagation();
      // A drag-pan ends with pointerdown/up on the same county (it moves with
      // the map), so Pixi fires `pointertap`. Only select on a genuine click.
      if (this.wasClick(event)) {
        this.onSelect(county.id);
      }
    });
    this.shapesLayer.addChild(shape);

    const label = new Text({
      text: county.name,
      style: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 24,
        fontWeight: 'bold',
        fill: LABEL_COLOR,
      },
      resolution: 2,
    });
    label.anchor.set(0.5);
    label.position.set(county.centroid.x, county.centroid.y);
    label.eventMode = 'none';
    this.labelsLayer.addChild(label);

    const view: CountyView = { county, shape, label, points };
    this.repaint(view);
    return view;
  }

  private repaint(view: CountyView): void {
    const isSelected = this.selectedId === view.county.id;
    const isHovered = this.hoveredId === view.county.id;
    const base = COUNTY_COLORS[view.county.id];
    const fill = isSelected ? lighten(base, 0.3) : isHovered ? lighten(base, 0.24) : base;
    view.shape
      .clear()
      .poly(view.points)
      .fill(fill)
      .stroke({
        width: isSelected ? 5 : isHovered ? 3 : 2,
        color: isSelected ? SELECTED_BORDER_COLOR : BORDER_COLOR,
        alignment: 0.5,
      });
  }

  private paintCounty(id: CountyId): void {
    const view = this.views.get(id);
    if (view) {
      this.repaint(view);
    }
  }

  /** True when the pointer barely moved since pointerdown — a click, not a drag. */
  private wasClick(event: FederatedPointerEvent): boolean {
    const down = this.pointerDownAt;
    if (!down) {
      return true;
    }
    const dx = event.global.x - down.x;
    const dy = event.global.y - down.y;
    return dx * dx + dy * dy <= 36;
  }

  /** Updates the selection highlight. Pass `null` to clear it. */
  setSelected(id: CountyId | null): void {
    if (id === this.selectedId) {
      return;
    }
    const previous = this.selectedId;
    this.selectedId = id;
    if (previous) {
      this.paintCounty(previous);
    }
    if (id) {
      this.paintCounty(id);
      const view = this.views.get(id);
      if (view) {
        // Bring the selected county forward so its highlight border is not
        // overdrawn by a neighbour's fill.
        this.shapesLayer.addChild(view.shape);
      }
    }
  }

  /** Counter-scales labels so they hold a constant on-screen size as zoom changes. */
  setZoom(zoom: number): void {
    const scale = zoom > 0 ? 1 / zoom : 1;
    for (const view of this.views.values()) {
      view.label.scale.set(scale);
    }
  }
}
