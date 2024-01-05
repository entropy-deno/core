import { expect } from 'https://deno.land/std@0.211.0/expect/expect.ts';
import { inject } from './functions/inject.function.ts';
import { Injector } from './injector.class.ts';

class TestService {
  public readonly test = 'test';
}

Deno.test('injector module', async (test) => {
  await test.step('injector class properly resolves services', () => {
    const service = Injector.resolve(TestService);

    expect(service).toBeInstanceOf(TestService);
    expect(service.test).toBe('test');
  });

  await test.step('inject function properly resolves services', () => {
    const service = inject(TestService);

    expect(service).toBeInstanceOf(TestService);
    expect(service.test).toBe('test');
  });

  await test.step('injector creates singletons', () => {
    expect(Injector.resolve(TestService)).toBe(Injector.resolve(TestService));
  });
});
