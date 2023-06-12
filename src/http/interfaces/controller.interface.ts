import { RouteDefinition } from '../../router/interfaces/route_definition.interface.ts';
import { RouteOptions } from '../../router/interfaces/route_options.interface.ts';

type ClassMethodNameUnion<T> = {
  [K in keyof T]-?: T[K] extends ((...args: unknown[]) => unknown) ? K : never;
}[keyof T];

export interface Controller<T = any> {
  routes: (Omit<RouteDefinition, 'action'> & RouteOptions & {
    action: ClassMethodNameUnion<T>;
  })[];
}
