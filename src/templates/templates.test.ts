import { expect } from 'https://deno.land/std@0.215.0/expect/expect.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { TemplateCompiler } from './template_compiler.service.ts';

Deno.test('templates module', async (test) => {
  await test.step('compiler properly renders @csrf directive', async () => {
    const rendered = await inject(TemplateCompiler).render('@csrf');

    expect(rendered).toContain('<input type="hidden"');
  });

  await test.step('compiler properly renders @dev directive', async () => {
    const rendered = await inject(TemplateCompiler).render(
      '@dev entropy @/dev',
    );

    expect(rendered).toContain('entropy');
  });

  await test.step('compiler properly renders @for directive', async () => {
    const rendered = await inject(TemplateCompiler).render(
      '@for (item in [1, 2, 3]) {{ item }} @/for',
    );

    expect(rendered).toContain('1');
    expect(rendered).toContain('2');
    expect(rendered).toContain('3');

    const renderedWithDestructuring = await inject(TemplateCompiler).render(
      `
      @for ({ name, surname } in [{ name: 'James', surname: 'Bond' }])
        {{ name }} {{ surname }}
      @/for`,
    );

    expect(renderedWithDestructuring).toContain('James Bond');

    const renderedEmpty = await inject(TemplateCompiler).render(
      `
      @for (item in [])
        {{ item }}
      @empty
        no items
      @/for`,
    );

    expect(renderedEmpty).toContain('no items');
  });

  await test.step('compiler properly renders @hotReload directive', async () => {
    const rendered = await inject(TemplateCompiler).render('@hotReload');

    expect(rendered).toContain('<script');
  });

  await test.step('compiler properly renders @if directive', async () => {
    const renderedTrue = await inject(TemplateCompiler).render(
      '@if (true) yes @/if',
    );
    const renderedFalse = await inject(TemplateCompiler).render(
      '@if (false) yes @/if',
    );
    const renderedElse = await inject(TemplateCompiler).render(
      '@if (false) yes @else no @/if',
    );

    expect(renderedTrue).toContain('yes');
    expect(renderedFalse).toBe('');
    expect(renderedElse).toContain('no');
  });

  await test.step('compiler properly renders @json directive', async () => {
    const rendered = await inject(TemplateCompiler).render(
      `@json({ name: 'Bond' })`,
    );

    expect(rendered).toBe('{"name":"Bond"}');
  });

  await test.step('compiler properly renders @method directive', async () => {
    const rendered = await inject(TemplateCompiler).render(`@method('PATCH')`);

    expect(rendered).toContain('<input type="hidden"');
  });

  await test.step('compiler properly renders @nonceProp directive', async () => {
    const rendered = await inject(TemplateCompiler).render('@nonceProp');

    expect(rendered).toContain('nonce=');
  });

  await test.step('compiler properly renders @prod directive', async () => {
    const rendered = await inject(TemplateCompiler).render(
      '@prod entropy @/prod',
    );

    expect(rendered).toBe('');
  });

  await test.step('compiler properly renders @stack and @push directive', async () => {
    const rendered = await inject(TemplateCompiler).render(
      `
      @stack('test')

      @push('test') a @/push
      @push('test') b @/push
      `,
    );

    expect(rendered).toContain('a');
    expect(rendered).toContain('b');
  });

  await test.step('compiler properly renders @switch directive', async () => {
    const rendered = await inject(TemplateCompiler).render(
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

    expect(rendered).toContain('2');
  });

  await test.step('compiler exposes $env function', async () => {
    const rendered = await inject(TemplateCompiler).render(
      `{{ $env('TESTING') }}`,
    );

    expect(rendered).toBe('true');
  });

  await test.step('compiler exposes $escape function', async () => {
    const rendered = await inject(TemplateCompiler).render(
      `{{# $escape('<div></div>') }}`,
    );

    expect(rendered).toBe('&lt;div&gt;&lt;/div&gt;');
  });

  await test.step('compiler exposes $range function', async () => {
    const rendered = await inject(TemplateCompiler).render(
      `{{ $range(2, 6).length }}`,
    );

    expect(rendered).toBe('5');
  });

  await test.step('compiler ignores raw interpolations', async () => {
    const rendered = await inject(TemplateCompiler).render('{{@ message }}');

    expect(rendered).toBe('{{ message }}');
  });

  await test.step('compiler strips comments', async () => {
    const rendered = await inject(TemplateCompiler).render('{-- @csrf --}');

    expect(rendered).toBe('');
  });

  await test.step('compiler interpolates data with pipes correctly', async () => {
    const rendered = await inject(TemplateCompiler).render(
      `{{ 'test' | upper }}`,
    );

    expect(rendered).toBe('TEST');
  });
});
