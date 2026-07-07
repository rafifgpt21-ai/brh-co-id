export function getPublicBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function buildAbsoluteUrl(path: string) {
  const baseUrl = getPublicBaseUrl();

  try {
    return new URL(path, `${baseUrl}/`).toString();
  } catch {
    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  }
}
