import { inject } from '../../injector/functions/inject.function.ts';
import { Localizator } from '../localizator.service.ts';

export function translate(text: string, amount = 1) {
  return inject(Localizator).get(text, amount);
}
