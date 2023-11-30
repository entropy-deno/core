import { RoutePath } from '../../router/types/route_path.type.ts';
import { TemplateDirective } from '../../templates/interfaces/template_directive.interface.ts';
import { ValidatorRule } from '../../validator/interfaces/validator_rule.interface.ts';

export interface AppConfig {
  cache: {
    enabled: boolean;
    maxAge: number;
  };
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
  csrfProtection: boolean;
  encryption: {
    key: string;
  };
  envFile: string | false;
  host: string;
  isDenoDeploy: boolean;
  isProduction: boolean;
  locales: {
    default: string;
    supported: string[];
  };
  logger: {
    enabled: boolean;
    staticFileRequests: boolean;
  };
  port: number;
  seo: {
    robots: boolean;
    sitemap: boolean;
    sitemapExcludeUrls: RoutePath[];
    sitemapUrls: RoutePath[];
  };
  session: {
    clearOnRestart: boolean;
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
  validatorRules: ValidatorRule[];
  webSocket: boolean;
}
