import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { UTApi, UTFile } from "uploadthing/server";

type CoverMapping = Record<string, string>;

const coverFiles: Record<string, string> = {
  "actualization-of-neo-sufism": "neo sufism.jpeg",
  "akhlaq-tasawuf": "akhlaq tasawuf (2).jpeg",
  "kenapa-ber-thoriqoh": "Kenapa ber toriqoh.png",
  "pengantar-ilmu-tasawuf": "Pengantar Ilmu Tasawuf (2).jpeg",
  "resurgensi-islam-sufi": "RESURGENSI ISLAM SUFI Spiritualitas, Modernitas, dan Masa Depan Peradaban.jpeg",
  "rethinking-social-work-indonesia": "rethink social work.jpg",
  "selayang-pandang-tasawuf-tarekat-sufi": "Selayang Pandang Sejarah Tasawuf & Tarekat Sufi (2).jpeg",
  sufinomic: "sufinomics (2).jpeg",
};

const mappingPath = path.join(process.cwd(), "lib", "material-book-cover-urls.json");

function keyFromUfsUrl(url?: string) {
  return url?.match(/\/f\/([^/?#]+)/)?.[1];
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
  const shouldReplace = process.env.REPLACE_MATERIAL_BOOK_COVERS === "1";
  const uploadVersion = Date.now();
  const existingFiles = await utapi.listFiles({ limit: 500 });

  for (const [slug, fileName] of Object.entries(coverFiles)) {
    const customIdPrefix = `material-book-cover-${slug}`;
    const customId = `${customIdPrefix}-${uploadVersion}`;
    const mappedKey = keyFromUfsUrl(mapping[slug]);
    const existingKeys = existingFiles.files
      .filter((file) => file.customId?.startsWith(customIdPrefix))
      .map((file) => file.key);

    if (mapping[slug] && !shouldReplace) {
      console.log(`Using existing UploadThing URL for ${slug}`);
      continue;
    }

    if (shouldReplace) {
      try {
        const keysToDelete = [...new Set([...existingKeys, ...(mappedKey ? [mappedKey] : [])])];
        const deleteByKey = keysToDelete.length > 0 ? await utapi.deleteFiles(keysToDelete) : { deletedCount: 0 };
        const deletedCount = deleteByKey.deletedCount;

        console.log(`Deleted old UploadThing cover for ${slug}: ${deletedCount}`);
      } catch (error) {
        console.warn(`Could not delete previous UploadThing cover for ${slug}; continuing with upload.`);
        console.warn(error);
      }
    }

    const filePath = path.join(process.cwd(), "material", "book-cover", fileName);
    const bytes = await readFile(filePath);
    const fileType = fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    const file = new UTFile([bytes], fileName, {
      customId,
      type: fileType,
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
