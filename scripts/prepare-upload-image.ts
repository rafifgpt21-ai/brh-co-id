import sharp from "sharp";

// Runs locally before upload, never on a Vercel request. Keep source resolution
// and transparency; source/master files remain unchanged on disk.
export async function prepareUploadImage(source: Buffer, sourceName: string) {
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height || (metadata.pages || 1) > 1) {
    throw new Error(`${sourceName} must be a readable static image.`);
  }
  const webp = await sharp(source).webp({ quality: 90, effort: 6 }).toBuffer();
  const useWebp = webp.byteLength < source.byteLength;
  return {
    bytes: useWebp ? webp : source,
    fileName: useWebp ? sourceName.replace(/\.[^.]+$/, ".webp") : sourceName,
    contentType: useWebp ? "image/webp" : "image/png",
    originalBytes: source.byteLength,
    width: metadata.width,
    height: metadata.height,
  };
}
