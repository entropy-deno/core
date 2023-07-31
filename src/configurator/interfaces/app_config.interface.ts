import { ValidationRuleDefinition } from '../../validator/interfaces/validation_rule_definition.interface.ts';

export interface AppConfig {
  cspAllowedOrigins: string[];
  defaultLocale: string;
  encryptionKey: string;
  envFile: string | false;
  host: string;
  isDenoDeploy: boolean;
  isProduction: boolean;
  logger: boolean;
  port: number;
  tlsCert: string | false;
  tlsCertFile: string | false;
  tlsKey: string | false;
  tlsKeyFile: string | false;
  validationRules: ValidationRuleDefinition[];
  wsPort: number;
}
