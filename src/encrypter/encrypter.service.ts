import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

export class Encrypter {
  private readonly configurator = inject(Configurator);

  private readonly encoder = new TextEncoder();

  public async compareHash(plainText: string, hash: string): Promise<boolean> {
    return await this.hash(plainText) === hash;
  }

  public async hash(plainText: string): Promise<string> {
    const keyBuffer = this.encoder.encode(this.configurator.entries.encryption.key);
    const dataBuffer = this.encoder.encode(plainText);

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', hmacKey, dataBuffer);

    return [...new Uint8Array(signature)].map((byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
  }

  public uuid(): string {
    return crypto.randomUUID();
  }
}
