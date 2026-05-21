import { Room, type Client } from '@colyseus/core';

/**
 * Hello-world game room (M0).
 *
 * Later milestones give this room the plain-TS authoritative game state and a
 * `@colyseus/schema` projection for network sync (see CLAUDE.md §11). For now
 * it only proves the connection lifecycle works.
 */
export class GameRoom extends Room {
  override maxClients = 4;

  override onCreate(): void {
    console.log(`[server] GameRoom ${this.roomId} created`);

    this.onMessage('ping', (client) => {
      client.send('pong', { at: this.clock.currentTime });
    });
  }

  override onJoin(client: Client): void {
    console.log(`[server] ${client.sessionId} joined GameRoom ${this.roomId}`);
  }

  override onLeave(client: Client): void {
    console.log(`[server] ${client.sessionId} left GameRoom ${this.roomId}`);
  }

  override onDispose(): void {
    console.log(`[server] GameRoom ${this.roomId} disposed`);
  }
}
