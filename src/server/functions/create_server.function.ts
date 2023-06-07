import { Server } from '../server.service.ts';
import { ServerOptions } from '../interfaces/server_options.interface.ts';

export function createServer(options: ServerOptions): Server {
  return new Server(options);
}
