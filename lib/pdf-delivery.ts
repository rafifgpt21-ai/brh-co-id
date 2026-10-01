export function isUploadThingFileUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443")
      && ["utfs.io", "ufs.sh"].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export function pdfProxyUrl(url: string) {
  return `/api/proxy-pdf?url=${encodeURIComponent(url)}`;
}
