import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

export class Localizator {
  private readonly configurator = inject(Configurator);

  private currentLocale = 'en';

  private translations = new Map<string, string | string[]>();

  private async loadTranslations(): Promise<void> {
    try {
      const data = JSON.parse(
        await Deno.readTextFile(`locales/${this.currentLocale}.json`),
      );

      for (const [key, value] of Object.entries<string | string[]>(data)) {
        this.translations.set(key, value);
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  }

  public all(): Record<string, string | string[]> {
    return Object.fromEntries(this.translations);
  }

  public get(text: string, quantity = 1): string {
    if (quantity > 1) {
      const key = [...this.translations.keys()].find((key) => {
        return key.startsWith(`${text}|`);
      }) ?? text;

      if (!Array.isArray(this.translations.get(key))) {
        throw new TypeError(`Pluralized translation for '${text}' is not an array`);
      }

      return this.translations.get(key)?.[0] ?? text;
    }

    return (this.translations.get(text) as string) ?? text;
  }

  public async setRequestLocale(locale: string): Promise<void> {
    if (this.currentLocale === locale) {
      return;
    }

    this.currentLocale = locale;

    await this.loadTranslations();
  }

  public async setup(): Promise<void> {
    this.currentLocale = this.configurator.entries.defaultLocale;

    await this.loadTranslations();
  }
}
