import { AppConfig } from './interfaces/app_config.interface.ts';
import { EnvVariable } from './types/env_variable.type.ts';
import { Utils } from '../utils/utils.class.ts';

export class Configurator {
  private options: Readonly<AppConfig> = {
    contentSecurityPolicy: {
      allowedOrigins: [],
    },
    cors: {
      allowCredentials: false,
      allowedHeaders: [],
      allowedMethods: ['*'],
      allowedOrigins: ['*'],
      exposedHeaders: [],
      maxAge: 0,
    },
    defaultLocale: 'en',
    encryption: {
      key: this.getEnv<string>('ENCRYPTION_KEY') ?? crypto.randomUUID(),
    },
    envFile: '.env',
    host: this.getEnv<string>('HOST') ?? 'localhost',
    isDenoDeploy: !!this.getEnv<string>('DENO_DEPLOYMENT_ID') ?? false,
    isProduction: (this.getEnv<boolean>('PRODUCTION') ?? false) ||
      (!!this.getEnv<string>('DENO_DEPLOYMENT_ID') ?? false),
    logger: true,
    port: this.getEnv<number>('PORT') ?? 5050,
    templateDirectives: [],
    tls: {
      cert: this.getEnv<string>('TLS_CERT') ?? false,
      certFile: false,
      enabled: false,
      key: this.getEnv<string>('TLS_KEY') ?? false,
      keyFile: false,
    },
    validatorRules: [],
    webSocket: {
      enabled: true,
      port: this.getEnv<number>('WEB_SOCKET_PORT') ??
        (this.getEnv<number>('PORT') ?? 5050) + 1,
    },
  };

  public all(): AppConfig {
    return this.entries;
  }

  public get entries(): Readonly<AppConfig> {
    return this.options;
  }

  public get<T = string>(option: string, defaultValue: T): T {
    return this.options[option as keyof Readonly<AppConfig>] as T ??
      defaultValue;
  }

  public getEnv<T extends EnvVariable>(key: string): T | undefined {
    if (!(key in Deno.env.toObject())) {
      return undefined;
    }

    try {
      return JSON.parse(Deno.env.get(key)?.toString() ?? 'null') as T | undefined;
    } catch {
      return Deno.env.get(key) as T;
    }
  }

  public setup(options: Partial<AppConfig> = {}): void {
    this.options = Utils.deepMerge(this.options, options);
  }
}
