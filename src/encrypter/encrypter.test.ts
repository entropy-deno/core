import { expect } from 'https://deno.land/std@0.208.0/expect/expect.ts';
import { Encrypter } from './encrypter.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

Deno.test('encrypter module', async (test) => {
  const encrypter = inject(Encrypter);

  await test.step('encrypter properly hashes a string', async () => {
    const hash = await encrypter.hash('test');

    expect(typeof hash).toBe('string');
  });

  await test.step('encrypter properly compares hash with plain text', async () => {
    const hash = await encrypter.hash('test');
    const equal = await encrypter.compareHash('test', hash);

    expect(equal).toBe(true);
  });
});
