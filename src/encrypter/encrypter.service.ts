import { env } from '../utils/functions/env.function.ts';

export class Encrypter {
  private readonly secretKey = env<string>('CRYPTO_KEY');

  public async compareHash(plainText: string, hash: string): Promise<boolean> {
    return await this.hash(plainText) === hash;
  }

  public async hash(plainText: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(this.secretKey);
    const dataBuffer = encoder.encode(plainText);

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
