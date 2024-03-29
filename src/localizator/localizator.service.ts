import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

export class Localizator {
  private readonly configurator = inject(Configurator);

  private translations = new Map<string, Map<string, string | string[]>>();

  private async loadTranslations(): Promise<void> {
    const supportedLocales = this.configurator.entries.locales.supported.filter(
      (locale) => locale !== this.configurator.entries.locales.default,
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

  public async all(locale: string): Promise<Record<string, string | string[]>> {
    if (!this.translations.size) {
      await this.loadTranslations();
    }

    return Object.fromEntries(
      locale === this.configurator.entries.locales.default
        ? new Map()
        : this.translations.get(locale) ?? new Map(),
    );
  }

  public async reload(): Promise<void> {
    await this.loadTranslations();
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

  public async translate(
    locale: string,
    text: string,
    quantity = 1,
  ): Promise<string> {
    if (!this.translations.size) {
      await this.loadTranslations();
    }

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
