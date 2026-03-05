import { randomBytes } from "node:crypto";

export class ExpiringTokenVO {
  private constructor(
    public readonly value: string,
    public readonly expiresAt: Date,
  ) {}

  public static generate(expiresInMinutes: number): ExpiringTokenVO {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    return new ExpiringTokenVO(token, expiresAt);
  }

  public static fromPersistence(value: string, expiresAt: Date): ExpiringTokenVO {
    return new ExpiringTokenVO(value, expiresAt);
  }

  public isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  public matches(token: string): boolean {
    return this.value === token;
  }
}