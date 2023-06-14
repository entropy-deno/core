export class Encrypter {
  public async hash(plainText: string): Promise<string> {
    const data = new TextEncoder().encode(plainText);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    const hash = [...new Uint8Array(hashBuffer)].map((b) =>
      b.toString(16).padStart(2, '0')
    ).join('');

    return hash;
  }
}
