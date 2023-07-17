export interface AppConfig {
  defaultLocale: string;
  encryptionKey: string;
  envFile: string | false;
  host: string;
  isDenoDeploy: boolean;
  isProduction: boolean;
  port: number;
}
