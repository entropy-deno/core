import { Configurator } from '../configurator/configurator.service.ts';
import { Encrypter } from '../encrypter/encrypter.service.ts';
import { HttpRequest } from '../http/http_request.class.ts';
import { inject } from '../injector/functions/inject.function.ts';

export class JwtClient {
  private readonly configurator = inject(Configurator);

  private readonly textEncoder = new TextEncoder();

  private readonly encrypter = inject(Encrypter);

  private createTokenHeader(): string {
    return this.encrypter.encodeBase64(
      JSON.stringify({
        alg: 'HS256',
        typ: 'JWT',
      }),
    );
  }

  public decodeToken<T = unknown>(token: string): Record<string, T> {
    const [header, payload] = token.split('.');

    const error = new Error(`Invalid JWT token: ${token}`);

    if (!header || !payload) {
      throw error;
    }

    try {
      return JSON.parse(this.encrypter.decodeBase64(payload));
    } catch {
      throw error;
    }
  }

  public async generateToken(payload?: unknown): Promise<string> {
    if (!this.configurator.entries.jwt.key) {
      throw new Error('JWT key is not set');
    }

    const header = this.createTokenHeader();

    const payloadData = this.encrypter.encodeBase64(JSON.stringify(payload));

    const key = await crypto.subtle.importKey(
      'raw',
      this.textEncoder.encode(this.configurator.entries.jwt.key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      this.textEncoder.encode(`${header}.${payloadData}`),
    );

    return `${header}.${payloadData}.${
      this.encrypter.encodeBase64(signature).replaceAll(/\+\//g, '-')
        .replaceAll('=', '').replaceAll(/\//g, '_')
    }`;
  }

  public isAuthenticated(request: HttpRequest): boolean {
    const header = request.header('authorization');

    if (!header || Array.isArray(header)) {
      return false;
    }

    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      return false;
    }

    try {
      this.decodeToken(token);
    } catch {
      return false;
    }

    return true;
  }

  public async sendToken(token?: string): Promise<void> {
    if (!token) {
      token = await this.generateToken();
    }
  }
}
