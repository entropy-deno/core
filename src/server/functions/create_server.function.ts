import { inject } from '../../injector/functions/inject.function.ts';
import { Server } from '../server.service.ts';
import { ServerOptions } from '../interfaces/server_options.interface.ts';

export function createServer(options: Partial<ServerOptions> = {}): Server {
  const server = inject(Server);

  server.configure(options);

  return server;
}
