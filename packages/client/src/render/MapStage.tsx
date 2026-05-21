import { getMap } from '@lor/shared';
import { Viewport } from 'pixi-viewport';
import { Application, Graphics } from 'pixi.js';
import { useEffect, useRef } from 'react';
import { useMapStore } from '../state/mapStore';
import { useSelectionStore } from '../state/selectionStore';
import { CountyMap } from './CountyMap';

const SEA_COLOR = 0x3a6b86;

/**
 * Hosts the Pixi strategic map: a `pixi-viewport` camera (pan / zoom) containing
 * the sea background and the `CountyMap` renderer for the current map.
 *
 * The effect rebuilds the whole Pixi scene when the current map changes (a rare,
 * deliberate action). Selection is bridged to the renderer imperatively, so a
 * selection change never re-renders this component (CLAUDE.md §11). Cleanup
 * tears the Pixi tree down so React 19 StrictMode's dev double-mount cannot leak.
 */
export function MapStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const currentMapId = useMapStore((state) => state.currentMapId);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const map = getMap(currentMapId);
    // A freshly built map starts with nothing selected.
    useSelectionStore.getState().selectCounty(null);

    const app = new Application();
    let disposed = false;
    let cleanup: (() => void) | null = null;

    void app
      .init({
        width: host.clientWidth || 960,
        height: host.clientHeight || 600,
        background: SEA_COLOR,
        antialias: true,
      })
      .then(() => {
        if (disposed) {
          app.destroy(true);
          return;
        }
        host.appendChild(app.canvas);

        const viewport = new Viewport({
          screenWidth: app.renderer.width,
          screenHeight: app.renderer.height,
          worldWidth: map.width,
          worldHeight: map.height,
          events: app.renderer.events,
        });
        viewport
          .drag()
          .wheel()
          .decelerate()
          .clamp({ direction: 'all', underflow: 'center' })
          .clampZoom({ minScale: 0.2, maxScale: 5 });
        app.stage.addChild(viewport);

        // Sea background — also the deselect target (a click on open water).
        const sea = new Graphics().rect(0, 0, map.width, map.height).fill(SEA_COLOR);
        sea.eventMode = 'static';
        let seaDownAt: { x: number; y: number } | null = null;
        sea.on('pointerdown', (event) => {
          seaDownAt = { x: event.global.x, y: event.global.y };
        });
        sea.on('pointertap', (event) => {
          // Ignore the tap that ends a drag-pan started on open water.
          if (seaDownAt) {
            const dx = event.global.x - seaDownAt.x;
            const dy = event.global.y - seaDownAt.y;
            if (dx * dx + dy * dy > 36) {
              return;
            }
          }
          useSelectionStore.getState().selectCounty(null);
        });
        viewport.addChild(sea);

        const countyMap = new CountyMap(map, (id) => {
          useSelectionStore.getState().selectCounty(id);
        });
        viewport.addChild(countyMap.container);
        countyMap.setSelected(useSelectionStore.getState().selectedCountyId);

        // Store -> renderer bridge (imperative; MapStage never re-renders on selection).
        const unsubscribe = useSelectionStore.subscribe((state) => {
          countyMap.setSelected(state.selectedCountyId);
        });

        // Keep county labels a constant on-screen size as the camera zooms.
        const syncZoom = (): void => {
          countyMap.setZoom(viewport.scale.x);
        };
        viewport.on('zoomed', syncZoom);
        viewport.on('zoomed-end', syncZoom);

        // Frame the whole realm once the host has a real size, then track resizes.
        let framed = false;
        const resizeObserver = new ResizeObserver(() => {
          const width = host.clientWidth;
          const height = host.clientHeight;
          if (width === 0 || height === 0) {
            return;
          }
          app.renderer.resize(width, height);
          viewport.resize(width, height, map.width, map.height);
          if (!framed) {
            framed = true;
            viewport.fit();
            viewport.moveCenter(map.width / 2, map.height / 2);
          }
          syncZoom();
        });
        resizeObserver.observe(host);

        cleanup = () => {
          unsubscribe();
          resizeObserver.disconnect();
          viewport.off('zoomed', syncZoom);
          viewport.off('zoomed-end', syncZoom);
          app.destroy(true, { children: true });
        };
      });

    return () => {
      disposed = true;
      if (cleanup) {
        cleanup();
      }
    };
  }, [currentMapId]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
}
