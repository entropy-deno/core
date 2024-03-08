import { expect } from 'https://deno.land/std@0.219.0/expect/expect.ts';
import { Localizator } from './localizator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

Deno.test('localizator module', async (test) => {
  const localizator = inject(Localizator);

  await test.step('localizator properly sets translations', async () => {
    localizator.set('pl', 'hello world', 'witaj świecie');

    expect(await localizator.translate('pl', 'hello world')).toBe(
      'witaj świecie',
    );
  });

  await test.step('localizator properly returns translation list', async () => {
    expect(await localizator.all('pl')).toEqual({
      'hello world': 'witaj świecie',
    });
  });
});
