export interface TokenPayload {
  user_id: number;
  email: string;
  expiresIn?: string;
  issuer?: string;
}
