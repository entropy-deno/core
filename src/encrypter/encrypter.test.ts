import { assertEquals } from '@std/testing/asserts.ts';
import { load as loadEnv } from '@std/dotenv/mod.ts';
import { Encrypter } from './encrypter.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

Deno.test('encrypter module', async (test) => {
  await loadEnv({
    allowEmptyValues: true,
    envPath: `${Deno.cwd()}/../app-template/.env`,
    export: true,
  });

  await test.step('encrypter properly hashes a string', async () => {
    const hash = await inject(Encrypter).hash('test hash');

    assertEquals(typeof hash, 'string');
  });
});
