import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Injector } from '../injector.class.ts';

export function use<T>(service: Constructor<T>): T {
  return Injector.use<T>(service);
}
