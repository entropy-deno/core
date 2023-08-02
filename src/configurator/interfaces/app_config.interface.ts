import { TemplateDirectiveDefinition } from '../../template_compiler/interfaces/template_directive_definition.interface.ts';
import { ValidationRuleDefinition } from '../../validator/interfaces/validation_rule_definition.interface.ts';

export interface AppConfig {
  contentSecurityPolicy: {
    allowedOrigins: string[];
  };
  cors: {
    allowCredentials: boolean;
    allowedHeaders: string[];
    allowedMethods: string[];
    allowedOrigins: string[];
    maxAge: number;
  };
  defaultLocale: string;
  encryptionKey: string;
  envFile: string | false;
  host: string;
  isDenoDeploy: boolean;
  isProduction: boolean;
  logger: boolean;
  port: number;
  templateDirectives: TemplateDirectiveDefinition[];
  tls: {
    cert: string | false;
    certFile: string | false;
    key: string | false;
    keyFile: string | false;
  };
  validatorRules: ValidationRuleDefinition[];
  wsPort: number;
}
