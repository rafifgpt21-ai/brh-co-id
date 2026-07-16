export type UploadReceipt = {
  key: string;
  url: string;
  type: "image" | "pdf";
  size: number;
};

type UploadedFileLike = {
  key?: string | null;
  url?: string;
  ufsUrl?: string;
  size?: number;
};

export function createUploadReceipt(
  file: UploadedFileLike,
  type: UploadReceipt["type"],
): UploadReceipt {
  const url = file.ufsUrl || file.url;
  if (!file.key || !url) {
    throw new Error("UploadThing tidak mengembalikan key atau URL file");
  }

  return {
    key: file.key,
    url,
    type,
    size: file.size ?? 0,
  };
}
