import { assertEquals } from 'https://deno.land/std@0.205.0/assert/mod.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Validator } from './validator.service.ts';

Deno.test('validator module', async (test) => {
  const validator = inject(Validator);

  await test.step('validator properly asserts data satisfies requirements', async () => {
    assertEquals(
      Object.keys(
        await validator.validate({
          email: {
            email: true,
          },
        }, {
          email: 'test@entropy.deno.dev',
        }),
      ).length,
      0,
    );

    assertEquals(
      (await validator.validate({
        email: {
          email: true,
          maxLength: 12,
        },
      }, {
        email: '@invalid@entropy.deno.dev',
      })).email.length,
      2,
    );
  });
});
