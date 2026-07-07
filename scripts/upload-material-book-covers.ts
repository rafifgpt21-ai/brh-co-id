import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { UTApi, UTFile } from "uploadthing/server";

type CoverMapping = Record<string, string>;

const coverFiles: Record<string, string> = {
  "actualization-of-neo-sufism": "actualization-of-neo-sufism.jpeg",
  "akhlaq-tasawuf": "akhlaq-tasawuf.jpeg",
  "pengantar-ilmu-tasawuf": "pengantar-ilmu-tasawuf.jpeg",
  "resurgensi-islam-sufi": "resurgensi-islam-sufi.jpeg",
  "selayang-pandang-tasawuf-tarekat-sufi": "selayang-pandang-tasawuf-tarekat-sufi.jpeg",
  sufinomic: "sufinomic.jpeg",
};

const mappingPath = path.join(process.cwd(), "lib", "material-book-cover-urls.json");

function getUploadThingAppId() {
  const token = process.env.UPLOADTHING_TOKEN?.replace(/^['"]|['"]$/g, "");
  if (!token) throw new Error("UPLOADTHING_TOKEN is missing.");

  const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf8")) as {
    appId?: string;
  };
  if (!decoded.appId) throw new Error("UPLOADTHING_TOKEN does not include appId.");

  return decoded.appId;
}

function publicUfsUrl(fileKey: string) {
  return `https://${getUploadThingAppId()}.ufs.sh/f/${fileKey}`;
}

async function readMapping(): Promise<CoverMapping> {
  try {
    const raw = await readFile(mappingPath, "utf8");
    return JSON.parse(raw) as CoverMapping;
  } catch {
    return {};
  }
}

async function main() {
  const utapi = new UTApi();
  const mapping = await readMapping();
  const existingFiles = await utapi.listFiles({ limit: 500 });
  const existingByCustomId = new Map(
    existingFiles.files
      .filter((file) => file.customId?.startsWith("material-book-cover-"))
      .map((file) => [file.customId, file]),
  );

  for (const [slug, fileName] of Object.entries(coverFiles)) {
    if (mapping[slug]) {
      console.log(`Using existing UploadThing URL for ${slug}`);
      continue;
    }

    const customId = `material-book-cover-${slug}`;
    const existing = existingByCustomId.get(customId);
    if (existing) {
      mapping[slug] = publicUfsUrl(existing.key);
      console.log(`Using uploaded file for ${slug}: ${mapping[slug]}`);
      continue;
    }

    const filePath = path.join(process.cwd(), "public", "book-cover", fileName);
    const bytes = await readFile(filePath);
    const file = new UTFile([bytes], fileName, {
      customId,
      type: "image/jpeg",
    });
    const result = await utapi.uploadFiles(file, {
      acl: "public-read",
      contentDisposition: "inline",
    });

    if (result.error) {
      throw new Error(`Upload failed for ${slug}: ${result.error.message}`);
    }

    mapping[slug] = result.data.ufsUrl || result.data.url;
    console.log(`Uploaded ${slug}: ${mapping[slug]}`);
  }

  await writeFile(mappingPath, `${JSON.stringify(mapping, null, 2)}\n`);
  console.log(`Saved cover URL mapping to ${mappingPath}`);
}

main().catch((error) => {
  console.error("Material cover upload failed.");
  console.error(error);
  process.exit(1);
});
