import {
  compare as compareHash,
  hash,
} from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import {
  decodeBase64,
  encodeBase64,
} from 'https://deno.land/std@0.218.0/encoding/base64.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

interface UuidOptions {
  clean?: boolean;
}

export class Encrypter {
  private readonly configurator = inject(Configurator);

  private readonly decoder = new TextDecoder();

  private readonly encoder = new TextEncoder();

  public async compareHash(plainText: string, hash: string): Promise<boolean> {
    return await compareHash(plainText, hash);
  }

  public decodeBase64(encoded: string): string {
    return this.decoder.decode(decodeBase64(encoded));
  }

  public encodeBase64(plainText: string | ArrayBuffer): string {
    return encodeBase64(plainText);
  }

  public generateRandomString(length = 32): string {
    if (length % 2 !== 0) {
      throw new Error('Provided random string length is not even');
    }

    const buffer = new Uint8Array(length / 2);

    crypto.getRandomValues(buffer);

    let result = '';

    for (const char of buffer) {
      result += (`0${char.toString(16)}`).slice(-2);
    }

    return result;
  }

  public generateUuid({ clean = false }: UuidOptions = {}): string {
    const uuid = crypto.randomUUID();

    return clean ? uuid.replaceAll('-', '') : uuid;
  }

  public async hash(plainText: string): Promise<string> {
    return await hash(plainText);
  }
}
