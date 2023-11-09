import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

export class Localizator {
  private readonly configurator = inject(Configurator);

  private readonly defaultLocale = this.configurator.entries.locales.default;

  private translations = new Map<string, Map<string, string | string[]>>();

  private async loadTranslations(): Promise<void> {
    const supportedLocales = this.configurator.entries.locales.supported.filter(
      (locale) => locale !== this.defaultLocale,
    );

    for (const locale of supportedLocales) {
      try {
        const locales = JSON.parse(
          await Deno.readTextFile(`locales/${locale}.json`),
        );

        for (const [key, value] of Object.entries<string | string[]>(locales)) {
          this.set(locale, key, value);
        }
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }

        throw new Error(
          `Locale '${locale}' has no corresponding translation file in '/locales' directory`,
        );
      }
    }
  }

  public all(locale: string): Record<string, string | string[]> {
    return Object.fromEntries(
      locale === this.defaultLocale
        ? new Map()
        : this.translations.get(locale) ?? new Map(),
    );
  }

  public set(
    locale: string,
    text: string,
    translation: string | string[],
  ): void {
    if (!this.translations.has(locale)) {
      this.translations.set(locale, new Map());
    }

    this.translations.get(locale)!.set(text, translation);
  }

  public async setup(): Promise<void> {
    await this.loadTranslations();
  }

  public translate(locale: string, text: string, quantity = 1): string {
    if (quantity > 1) {
      const key = [...this.translations.keys()].find((key) => {
        return key.startsWith(`${text}|`);
      }) ?? text;

      if (!Array.isArray(this.translations.get(key))) {
        throw new TypeError(
          `Pluralized translation for '${text}' is not an array`,
        );
      }

      return this.translations.get(locale)?.get(key)?.[0] ?? text;
    }

    return (this.translations.get(locale)?.get(text) as string) ?? text;
  }
}
