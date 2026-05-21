import { MAP_HEIGHT, MAP_WIDTH } from '@lor/shared';
import { Viewport } from 'pixi-viewport';
import { Application, Graphics } from 'pixi.js';
import { useEffect, useRef } from 'react';
import { useSelectionStore } from '../state/selectionStore';
import { CountyMap } from './CountyMap';

const SEA_COLOR = 0x3a6b86;

/**
 * Hosts the Pixi strategic map: a `pixi-viewport` camera (pan / zoom) containing
 * the sea background and the `CountyMap` renderer.
 *
 * This component never reads selection through a React hook — it bridges the
 * selection store to the renderer imperatively (CLAUDE.md §11). The effect runs
 * once; its cleanup tears the whole Pixi tree down so React 19 StrictMode's dev
 * double-mount cannot leak.
 */
export function MapStage() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

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
          worldWidth: MAP_WIDTH,
          worldHeight: MAP_HEIGHT,
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
        const sea = new Graphics().rect(0, 0, MAP_WIDTH, MAP_HEIGHT).fill(SEA_COLOR);
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

        const countyMap = new CountyMap((id) => {
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
          viewport.resize(width, height, MAP_WIDTH, MAP_HEIGHT);
          if (!framed) {
            framed = true;
            viewport.fit();
            viewport.moveCenter(MAP_WIDTH / 2, MAP_HEIGHT / 2);
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
  }, []);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
}
