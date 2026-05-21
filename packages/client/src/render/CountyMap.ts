import type { County, CountyId, GameMap } from '@lor/shared';
import { Container, type FederatedPointerEvent, Graphics, Polygon, Text } from 'pixi.js';

/**
 * Earthy fill palette. Each county is assigned a palette entry by greedy
 * graph-colouring (see `colourCounties`) so no two neighbours share a fill.
 * Presentational and temporary — fill becomes the owning lord's colour once
 * counties have owners (M1.2+).
 */
const COUNTY_PALETTE: readonly number[] = [
  0x6f8f5f, // sage green
  0xc7a049, // gold
  0xb05a3c, // rust
  0x4f7d70, // teal
  0xa9794f, // leather brown
  0x8a8d9e, // slate grey
  0x9a6f86, // dusty plum
  0x7d9c4a, // olive
  0xc88a55, // amber
  0x5e7a93, // steel blue
];
const FALLBACK_FILL = 0x8a8a7a;

const BORDER_COLOR = 0x33291c;
const SELECTED_BORDER_COLOR = 0xffd24a;
const LABEL_COLOR = 0x241c10;

/** On dense maps, county labels stay hidden until the camera is zoomed in past
 *  this scale — the hovered and selected counties always show their label. */
const LABEL_ZOOM_THRESHOLD = 0.9;

/** Blends a colour toward white by `amount` (0–1). */
function lighten(color: number, amount: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const mix = (channel: number): number => Math.round(channel + (255 - channel) * amount);
  return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

/** Greedy graph-colouring: each county takes the lowest palette index not used
 *  by an already-coloured neighbour. */
function colourCounties(counties: readonly County[]): Map<CountyId, number> {
  const indexByCounty = new Map<CountyId, number>();
  for (const county of counties) {
    const usedByNeighbors = new Set<number>();
    for (const neighborId of county.neighbors) {
      const used = indexByCounty.get(neighborId);
      if (used !== undefined) {
        usedByNeighbors.add(used);
      }
    }
    let index = 0;
    while (usedByNeighbors.has(index)) {
      index++;
    }
    indexByCounty.set(county.id, index % COUNTY_PALETTE.length);
  }
  return indexByCounty;
}

interface CountyView {
  county: County;
  shape: Graphics;
  label: Text;
  points: number[];
  baseFill: number;
}

/**
 * Renders a strategic county map into a Pixi container — per-county polygons +
 * labels, hover/click interaction, and the selection highlight.
 *
 * A plain renderer: it never touches the selection store. It reports clicks via
 * the `onSelect` callback and is told the current selection via `setSelected`
 * (see CLAUDE.md §11, Separation).
 */
export class CountyMap {
  readonly container: Container;
  private readonly shapesLayer = new Container();
  private readonly labelsLayer = new Container();
  private readonly views = new Map<CountyId, CountyView>();
  private selectedId: CountyId | null = null;
  private hoveredId: CountyId | null = null;
  private pointerDownAt: { x: number; y: number } | null = null;
  private readonly denseMap: boolean;
  private labelsZoomedIn = false;

  constructor(
    map: GameMap,
    private readonly onSelect: (id: CountyId) => void,
  ) {
    this.container = new Container();
    this.container.addChild(this.shapesLayer, this.labelsLayer);

    const colourIndex = colourCounties(map.counties);
    // Dense maps (the 30-county realm) get smaller labels, hidden until zoomed in.
    this.denseMap = map.counties.length > 16;
    const labelSize = this.denseMap ? 16 : 22;
    for (const county of map.counties) {
      const index = colourIndex.get(county.id) ?? 0;
      const baseFill = COUNTY_PALETTE[index] ?? FALLBACK_FILL;
      this.views.set(county.id, this.createView(county, baseFill, labelSize));
    }
  }

  private createView(county: County, baseFill: number, labelSize: number): CountyView {
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
        fontSize: labelSize,
        fontWeight: 'bold',
        fill: LABEL_COLOR,
      },
      resolution: 2,
    });
    label.anchor.set(0.5);
    label.position.set(county.centroid.x, county.centroid.y);
    label.eventMode = 'none';
    this.labelsLayer.addChild(label);

    const view: CountyView = { county, shape, label, points, baseFill };
    this.repaint(view);
    return view;
  }

  private repaint(view: CountyView): void {
    const isSelected = this.selectedId === view.county.id;
    const isHovered = this.hoveredId === view.county.id;
    const fill = isSelected
      ? lighten(view.baseFill, 0.3)
      : isHovered
        ? lighten(view.baseFill, 0.24)
        : view.baseFill;
    view.shape
      .clear()
      .poly(view.points)
      .fill(fill)
      .stroke({
        width: isSelected ? 5 : isHovered ? 3 : 2,
        color: isSelected ? SELECTED_BORDER_COLOR : BORDER_COLOR,
        alignment: 0.5,
      });
    view.label.visible = !this.denseMap || this.labelsZoomedIn || isSelected || isHovered;
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

  /**
   * Counter-scales labels so they hold a constant on-screen size, and (on dense
   * maps) shows them only once zoomed in past `LABEL_ZOOM_THRESHOLD`.
   */
  setZoom(zoom: number): void {
    const scale = zoom > 0 ? 1 / zoom : 1;
    this.labelsZoomedIn = zoom >= LABEL_ZOOM_THRESHOLD;
    for (const view of this.views.values()) {
      view.label.scale.set(scale);
      const isSelected = this.selectedId === view.county.id;
      const isHovered = this.hoveredId === view.county.id;
      view.label.visible = !this.denseMap || this.labelsZoomedIn || isSelected || isHovered;
    }
  }
}
