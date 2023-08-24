import { RoutePath } from '../../router/types/route_path.type.ts';
import { TemplateDirectiveDefinition } from '../../templates/interfaces/template_directive_definition.interface.ts';
import { ValidationRuleDefinition } from '../../validator/interfaces/validation_rule_definition.interface.ts';

export interface AppConfig {
  contentSecurityPolicy: {
    allowInlineScripts: boolean;
    allowInlineStyles: boolean;
    allowedOrigins: string[];
  };
  cors: {
    allowCredentials: boolean;
    allowedHeaders: string[];
    allowedMethods: string[];
    allowedOrigins: string[];
    exposedHeaders: string[];
    maxAge: number;
  };
  defaultLocale: string;
  encryption: {
    key: string;
  };
  envFile: string | false;
  host: string;
  isDenoDeploy: boolean;
  isProduction: boolean;
  logger: boolean;
  port: number;
  seo: {
    robots: boolean;
    sitemap: boolean;
    sitemapUrls: RoutePath[];
  };
  templateDirectives: TemplateDirectiveDefinition[];
  tls: {
    cert: string | false;
    certFile: string | false;
    enabled: boolean;
    key: string | false;
    keyFile: string | false;
  };
  validatorRules: ValidationRuleDefinition[];
  webSocket: boolean;
}
