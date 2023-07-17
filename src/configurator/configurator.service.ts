import { AppConfig } from './interfaces/app_config.interface.ts';
import { env } from '../utils/functions/env.function.ts';

export class Configurator {
  private options: Readonly<AppConfig> = {
    defaultLocale: 'en',
    encryptionKey: env<string>('ENCRYPTION_KEY') ?? crypto.randomUUID(),
    envFile: '.env',
    host: env<string>('HOST') ?? 'localhost',
    isDenoDeploy: !!env<string>('DENO_DEPLOYMENT_ID') ?? false,
    isProduction: env<boolean>('PRODUCTION') ?? false,
    port: env<number>('PORT') ?? 5050,
    tlsCertificate: env<string>('TLS_CERTIFICATE') ?? false,
    tlsCertificateFile: false,
    tlsKey: env<string>('TLS_KEY') ?? false,
    tlsKeyFile: false,
  };

  public all(): AppConfig {
    return this.entries;
  }

  public get entries(): Readonly<AppConfig> {
    return this.options;
  }

  public get<T = string>(option: string, defaultValue: T): T {
    return this.options[option as keyof Readonly<AppConfig>] as unknown as T ??
      defaultValue;
  }

  public setup(options: Partial<AppConfig> = {}): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }
}
