import {
  assertEquals,
  assertStringIncludes,
} from 'https://deno.land/std@0.204.0/assert/mod.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { TemplateCompiler } from './template_compiler.service.ts';

Deno.test('templates module', async (test) => {
  const compiler = inject(TemplateCompiler);

  await test.step('compiler properly renders @csrf directive', async () => {
    const rendered = await compiler.render('@csrf');

    assertStringIncludes(rendered, '<input type="hidden"');
  });

  await test.step('compiler properly renders @dev directive', async () => {
    const rendered = await compiler.render('@dev entropy @/dev');

    assertStringIncludes(rendered, 'entropy');
  });

  await test.step('compiler properly renders @each directive', async () => {
    const rendered = await compiler.render(
      '@each (item in [1, 2, 3]) {{ item }} @/each',
    );

    assertStringIncludes(rendered, '1');
    assertStringIncludes(rendered, '2');
    assertStringIncludes(rendered, '3');

    const renderedWithDestructuring = await compiler.render(
      `@each ({ name, surname } in [{ 'James', 'Bond' }]) {{ name }} {{ surname }} @/each`,
    );

    assertStringIncludes(renderedWithDestructuring, 'James Bond');
  });

  await test.step('compiler properly renders @hotReload directive', async () => {
    const rendered = await compiler.render('@hotReload');

    assertStringIncludes(rendered, '<script');
  });

  await test.step('compiler properly renders @if directive', async () => {
    const renderedTrue = await compiler.render('@if (true) yes @/if');
    const renderedFalse = await compiler.render('@if (false) yes @/if');
    const renderedElse = await compiler.render('@if (false) yes @else no @/if');

    assertStringIncludes(renderedTrue, 'yes');
    assertEquals(renderedFalse, '');
    assertStringIncludes(renderedElse, 'no');
  });

  await test.step('compiler properly renders @json directive', async () => {
    const rendered = await compiler.render(`@json({ name: 'Bond' })`);

    assertEquals(rendered, '{"name":"Bond"}');
  });

  await test.step('compiler properly renders @method directive', async () => {
    const rendered = await compiler.render(`@method('PATCH')`);

    assertStringIncludes(rendered, '<input type="hidden"');
  });

  await test.step('compiler properly renders @nonceProp directive', async () => {
    const rendered = await compiler.render('@nonceProp');

    assertStringIncludes(rendered, 'nonce=');
  });

  await test.step('compiler properly renders @prod directive', async () => {
    const rendered = await compiler.render('@prod entropy @/prod');

    assertEquals(rendered, '');
  });

  await test.step('compiler properly renders @stack and @push directive', async () => {
    const rendered = await compiler.render(
      `
      @stack('test')

      @push('test') a @/push
      @push('test') b @/push
      `,
    );

    assertStringIncludes(rendered, 'a');
    assertStringIncludes(rendered, 'b');
  });

  await test.step('compiler properly renders @switch directive', async () => {
    const rendered = await compiler.render(
      `
      @switch (2)
        @case (1)
          1
        @/case

        @case (2)
          2
        @/case

        @case (3)
          3
        @/case
      @/switch
      `,
    );

    assertStringIncludes(rendered, '2');
  });

  await test.step('compiler exposes $env function', async () => {
    const rendered = await compiler.render(`{{ $env('TESTING') }}`);

    assertEquals(rendered, 'true');
  });

  await test.step('compiler exposes $escape function', async () => {
    const rendered = await compiler.render(`{{# $escape('<div></div>') }}`);

    assertEquals(rendered, '&lt;div&gt;&lt;/div&gt;');
  });

  await test.step('compiler exposes $range function', async () => {
    const rendered = await compiler.render(`{{ $range(2, 6).length }}`);

    assertEquals(rendered, '5');
  });

  await test.step('compiler ignores raw interpolations', async () => {
    const rendered = await compiler.render('{{@ message }}');

    assertEquals(rendered, '{{ message }}');
  });

  await test.step('compiler interpolates data with pipes correctly', async () => {
    const rendered = await compiler.render(`{{ 'test' | upper }}`);

    assertEquals(rendered, 'TEST');
  });
});
