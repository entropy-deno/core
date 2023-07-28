import { Configurator } from '../configurator.service.ts';
import { EnvVariable } from '../types/env_variable.type.ts';
import { inject } from '../../injector/functions/inject.function.ts';

const configurator = inject(Configurator);

export function env<T = EnvVariable>(
  key: string,
  defaultValue?: T,
): typeof defaultValue extends EnvVariable ? T : T | undefined {
  return configurator.getEnv(key, defaultValue);
}
