export const PUBLIC_SITE_URL = "https://www.brh.co.id";

export function getPublicBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");

  if (configuredUrl && !isLocalNetworkUrl(configuredUrl)) {
    return configuredUrl;
  }

  return PUBLIC_SITE_URL;
}

export function buildAbsoluteUrl(path: string) {
  const baseUrl = getPublicBaseUrl();

  try {
    return new URL(path, `${baseUrl}/`).toString();
  } catch {
    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  }
}

function isLocalNetworkUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("10.") || hostname.startsWith("192.168.");
  } catch {
    return false;
  }
}
