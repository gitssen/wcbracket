import { createClient } from '@libsql/client';

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export function logGeo(
  userId: string,
  username: string,
  action: string,
  headerSource: Headers
) {
  const ip =
    headerSource.get('x-forwarded-for')?.split(',')[0].trim() ??
    headerSource.get('x-real-ip') ??
    null;
  const country = headerSource.get('x-vercel-ip-country') ?? null;
  const city = headerSource.get('x-vercel-ip-city') ?? null;
  const region = headerSource.get('x-vercel-ip-country-region') ?? null;

  turso
    .execute({
      sql: 'INSERT INTO GeoLog (userId, username, action, ip, country, city, region) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [userId, username, action, ip, country, city, region],
    })
    .catch(() => {});
}
