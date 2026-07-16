import "client-only";

export type ImageCompressionProfile = "thumbnail" | "quickPost" | "content";

export type ImageCompressionResult = {
  file: File;
  originalBytes: number;
  finalBytes: number;
  width: number;
  height: number;
  format: string;
  savedPercent: number;
};

type ProfileConfig = {
  maxLongestEdge: number;
  minLongestEdge: number;
  targetBytes: number;
  initialQuality: number;
  minQuality: number;
};

const MIB = 1024 * 1024;
const MAX_SOURCE_BYTES = 20 * MIB;
const MAX_PIXELS = 40_000_000;
const MAX_UPLOAD_BYTES = MIB;
const QUALITY_STEP = 0.06;
const DIMENSION_STEP = 0.85;

const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const PROFILES: Record<ImageCompressionProfile, ProfileConfig> = {
  thumbnail: {
    maxLongestEdge: 1200,
    minLongestEdge: 640,
    targetBytes: 180 * 1024,
    initialQuality: 0.76,
    minQuality: 0.55,
  },
  quickPost: {
    maxLongestEdge: 1600,
    minLongestEdge: 960,
    targetBytes: 300 * 1024,
    initialQuality: 0.74,
    minQuality: 0.55,
  },
  content: {
    maxLongestEdge: 1920,
    minLongestEdge: 1200,
    targetBytes: 450 * 1024,
    initialQuality: 0.78,
    minQuality: 0.6,
  },
};

function bytesContain(bytes: Uint8Array, marker: string) {
  const markerBytes = new TextEncoder().encode(marker);
  outer: for (let i = 0; i <= bytes.length - markerBytes.length; i += 1) {
    for (let j = 0; j < markerBytes.length; j += 1) {
      if (bytes[i + j] !== markerBytes[j]) continue outer;
    }
    return true;
  }
  return false;
}

async function assertStaticImage(file: File) {
  if (!SUPPORTED_TYPES.has(file.type)) {
    throw new Error("Gunakan gambar statis JPEG, PNG, WebP, atau AVIF");
  }

  const header = new Uint8Array(await file.slice(0, 1024 * 1024).arrayBuffer());
  if (file.type === "image/webp" && (bytesContain(header, "ANIM") || bytesContain(header, "ANMF"))) {
    throw new Error("WebP animasi tidak didukung");
  }
  if (file.type === "image/avif" && bytesContain(header.slice(0, 128), "avis")) {
    throw new Error("AVIF animasi tidak didukung");
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== "image/webp") {
          reject(new Error("Browser ini tidak mendukung encoding WebP"));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

function outputName(name: string) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]+/g, "-") || "image";
  return `${base}.webp`;
}

function scaledDimensions(width: number, height: number, longestEdge: number) {
  const currentLongest = Math.max(width, height);
  if (currentLongest <= longestEdge) return { width, height };
  const scale = longestEdge / currentLongest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MIB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MIB).toFixed(2)} MB`;
}

export async function compressImage(
  source: File,
  profileName: ImageCompressionProfile,
): Promise<ImageCompressionResult> {
  if (source.size > MAX_SOURCE_BYTES) {
    throw new Error("Ukuran gambar sumber maksimal 20 MB");
  }
  await assertStaticImage(source);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Gambar tidak dapat dibaca oleh browser");
  }

  try {
    if (bitmap.width * bitmap.height > MAX_PIXELS) {
      throw new Error("Resolusi gambar maksimal 40 megapiksel");
    }

    const profile = PROFILES[profileName];
    const originalLongest = Math.max(bitmap.width, bitmap.height);
    if (
      source.size <= profile.targetBytes
      && originalLongest <= profile.maxLongestEdge
      && source.size <= MAX_UPLOAD_BYTES
    ) {
      return {
        file: source,
        originalBytes: source.size,
        finalBytes: source.size,
        width: bitmap.width,
        height: bitmap.height,
        format: source.type,
        savedPercent: 0,
      };
    }

    let longestEdge = Math.min(originalLongest, profile.maxLongestEdge);
    let bestBlob: Blob | null = null;
    let bestWidth = bitmap.width;
    let bestHeight = bitmap.height;

    while (true) {
      const dimensions = scaledDimensions(bitmap.width, bitmap.height, longestEdge);
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new Error("Canvas browser tidak tersedia");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);

      let quality = profile.initialQuality;
      while (quality >= profile.minQuality - 0.001) {
        const blob = await canvasToBlob(canvas, Math.max(profile.minQuality, quality));
        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
          bestWidth = dimensions.width;
          bestHeight = dimensions.height;
        }
        if (blob.size <= profile.targetBytes) break;
        quality -= QUALITY_STEP;
      }

      canvas.width = 0;
      canvas.height = 0;

      if (bestBlob && bestBlob.size <= profile.targetBytes) break;
      if (longestEdge <= profile.minLongestEdge) break;
      longestEdge = Math.max(profile.minLongestEdge, Math.round(longestEdge * DIMENSION_STEP));
    }

    if (!bestBlob || bestBlob.size > MAX_UPLOAD_BYTES) {
      throw new Error("Gambar tidak dapat dikompresi hingga di bawah 1 MB");
    }

    if (
      source.size < bestBlob.size
      && originalLongest <= profile.maxLongestEdge
      && source.size <= MAX_UPLOAD_BYTES
    ) {
      return {
        file: source,
        originalBytes: source.size,
        finalBytes: source.size,
        width: bitmap.width,
        height: bitmap.height,
        format: source.type,
        savedPercent: 0,
      };
    }

    const file = new File([bestBlob], outputName(source.name), {
      type: "image/webp",
      lastModified: Date.now(),
    });

    return {
      file,
      originalBytes: source.size,
      finalBytes: file.size,
      width: bestWidth,
      height: bestHeight,
      format: file.type,
      savedPercent: Math.max(0, Math.round((1 - file.size / source.size) * 100)),
    };
  } finally {
    bitmap.close();
  }
}
