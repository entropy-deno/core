export interface AppConfig {
  defaultLocale: string;
  encryptionKey: string;
  envFile: string | false;
  host: string;
  isDenoDeploy: boolean;
  isProduction: boolean;
  logger: boolean;
  port: number;
  tlsCertificate: string | false;
  tlsCertificateFile: string | false;
  tlsKey: string | false;
  tlsKeyFile: string | false;
  wsPort: number;
}
