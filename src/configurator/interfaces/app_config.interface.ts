import { RoutePath } from '../../router/types/route_path.type.ts';
import { TemplateDirective } from '../../templates/interfaces/template_directive.interface.ts';
import { ValidationRule } from '../../validator/interfaces/validation_rule.interface.ts';

export interface AppConfig {
  contentSecurityPolicy: {
    allowInlineScripts: boolean;
    allowInlineStyles: boolean;
    allowedOrigins: string[];
  };
  cookies: {
    maxAge: number;
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
    sitemapExcludeUrls: RoutePath[];
    sitemapUrls: RoutePath[];
  };
  session: {
    lifetime: number;
  };
  templateDirectives: TemplateDirective[];
  tls: {
    cert: string | false;
    certFile: string | false;
    enabled: boolean;
    key: string | false;
    keyFile: string | false;
  };
  validatorRules: ValidationRule[];
  webSocket: boolean;
}
