import { Server } from '../server.service.ts';

export function createServer(): Server {
  return new Server();
}
