export interface JwtPayload {
  email: string;
  sub: string;
  role: string;
  organizationId?: string | null;
}
