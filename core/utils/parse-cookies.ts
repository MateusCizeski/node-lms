export function parseCookies(cookieHeader: string | undefined) {
  const cookies: Record<string, string | undefined> = {};

  if (!cookieHeader) return cookies;

  const cookiesPairs = cookieHeader.split(";");

  for (const seg of cookiesPairs) {
    const pair = seg.trim();

    if (!pair) continue;

    const i = pair.indexOf("=");
    const key = i === -1 ? pair : pair.slice(0, i).trim();

    if (!key) continue;

    const value = pair.slice(i + 1).trim();

    cookies[key] = value;
  }

  return cookies;
}
