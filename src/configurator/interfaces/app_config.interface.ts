import { TemplateDirectiveDefinition } from '../../template_compiler/interfaces/template_directive_definition.interface.ts';
import { ValidationRuleDefinition } from '../../validator/interfaces/validation_rule_definition.interface.ts';

export interface AppConfig {
  cspAllowedOrigins: string[];
  corsAllowCredentials: boolean;
  corsAllowedHeaders: string[];
  corsAllowedMethods: string[];
  corsAllowedOrigins: string[];
  corsMaxAge: number;
  defaultLocale: string;
  encryptionKey: string;
  envFile: string | false;
  host: string;
  isDenoDeploy: boolean;
  isProduction: boolean;
  logger: boolean;
  port: number;
  templateDirectives: TemplateDirectiveDefinition[];
  tlsCert: string | false;
  tlsCertFile: string | false;
  tlsKey: string | false;
  tlsKeyFile: string | false;
  validatorRules: ValidationRuleDefinition[];
  wsPort: number;
}
