import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createRng } from '@lor/shared';
import { GameRoom } from './rooms/GameRoom';

const port = Number(process.env.PORT ?? 2567);

// Smoke-test the @lor/shared wiring so a broken workspace link fails loudly at boot.
const rngSample = createRng(1)().toFixed(6);

const gameServer = new Server({
  transport: new WebSocketTransport(),
});

gameServer.define('game', GameRoom);

gameServer
  .listen(port)
  .then(() => {
    console.log(`[server] Colyseus listening on ws://localhost:${port}`);
    console.log(`[server] @lor/shared wired (rng sample: ${rngSample})`);
  })
  .catch((error: unknown) => {
    console.error('[server] failed to start', error);
    process.exit(1);
  });
