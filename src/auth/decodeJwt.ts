export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  exp: number;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Hermes has no built-in atob/Buffer, so base64 is decoded by hand here. */
function base64Decode(input: string): string {
  const clean = input.replace(/=+$/, '');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

/** Decodes the JWT payload for display/role-gating only — never trust this for security, the server always re-validates. */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payloadB64] = token.split('.');
    const normalized = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = base64Decode(normalized);
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isExpired(payload: JwtPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}
