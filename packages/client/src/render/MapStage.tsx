import { useEffect, useRef } from 'react';
import { Application, Graphics } from 'pixi.js';

/**
 * Minimal Pixi.js canvas (M0).
 *
 * This proves the rendering pipeline is wired up. M1.1 replaces it with the
 * real strategic county map (pan/zoom, selectable counties).
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

    void app
      .init({ width: 480, height: 300, background: '#2f6b3a', antialias: true })
      .then(() => {
        if (disposed) {
          app.destroy(true);
          return;
        }
        host.appendChild(app.canvas);
        const placeholderCounty = new Graphics().roundRect(40, 40, 140, 140, 8).fill('#c9a86a');
        app.stage.addChild(placeholderCounty);
      });

    return () => {
      disposed = true;
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={hostRef} style={{ marginTop: 16, width: 480, height: 300 }} />;
}
