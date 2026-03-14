export interface TokenPayload {
  sub: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface TokenPort {
  sign(
    payload: object,
    expiresIn?: string | number,
    tokenType?: 'access' | 'refresh',
  ): Promise<string>;
  verify<T extends TokenPayload = TokenPayload>(
    token: string,
    tokenType?: 'access' | 'refresh',
  ): Promise<T>;
}
