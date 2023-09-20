import {
  assert,
  assertEquals,
} from 'https://deno.land/std@0.202.0/assert/mod.ts';
import { inject } from './functions/inject.function.ts';
import { Injector } from './injector.class.ts';

class TestService {
  public readonly test = 'test';
}

Deno.test('injector module', async (test) => {
  await test.step('injector class properly resolves services', () => {
    const service = Injector.resolve(TestService);

    assert(service instanceof TestService);
    assertEquals(service.test, 'test');
  });

  await test.step('inject function properly resolves services', () => {
    const service = inject(TestService);

    assert(service instanceof TestService);
    assertEquals(service.test, 'test');
  });

  await test.step('injector creates singletons', () => {
    assertEquals(Injector.resolve(TestService), Injector.resolve(TestService));
  });
});
