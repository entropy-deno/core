export interface AppConfig {
  defaultLocale: string;
  encryptionKey: string;
  envFile: string | false;
  host: string;
  isProduction: boolean;
  port: number;
}
