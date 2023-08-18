import { Configurator } from '../configurator.service.ts';
import { EnvVariable } from '../types/env_variable.type.ts';
import { inject } from '../../injector/functions/inject.function.ts';

const configurator = inject(Configurator);

export function env<TValue extends EnvVariable>(
  key: string,
): TValue | undefined {
  return configurator.getEnv<TValue>(key);
}
