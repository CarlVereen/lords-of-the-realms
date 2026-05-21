import { Client, type Room } from 'colyseus.js';

const endpoint = import.meta.env.VITE_SERVER_URL ?? 'ws://localhost:2567';

export const colyseusClient = new Client(endpoint);

/** Joins the shared `game` room, creating it if it does not exist yet. */
export function joinGameRoom(): Promise<Room> {
  return colyseusClient.joinOrCreate('game');
}
