import { SignJWT, jwtVerify } from 'jose';
import { config } from './config';

const COOKIE = 'tb_admin';
const secret = new TextEncoder().encode(config.authSecret);

export const SESSION_COOKIE = COOKIE;

export async function createSession(username: string): Promise<string> {
  return new SignJWT({ sub: username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
}

export async function verifySession(
  token: string | undefined,
): Promise<{ username: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin' || !payload.sub) return null;
    return { username: String(payload.sub) };
  } catch {
    return null;
  }
}

/** Constant-time-ish credential check. Uses env-configured credentials. */
export function checkCredentials(username: string, password: string): boolean {
  const u = username.trim();
  return u === config.adminUsername && password === config.adminPassword;
}
