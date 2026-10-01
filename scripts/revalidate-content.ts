import { getPublicBaseUrl } from "../lib/share-url";

export async function revalidateImportedContent() {
  const secret = process.env.CONTENT_REVALIDATION_SECRET;
  if (!secret) {
    console.warn("Content changed without immediate cache invalidation: configure CONTENT_REVALIDATION_SECRET or wait for the cache TTL.");
    return;
  }
  const response = await fetch(`${getPublicBaseUrl()}/api/revalidate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Content was saved, but cache invalidation failed (${response.status}). Retry the revalidation command.`);
  console.log("Public content cache invalidated.");
}

if (process.argv.includes("--revalidate")) {
  void import("dotenv/config").then(revalidateImportedContent).catch((error) => {
    console.error(error instanceof Error ? error.message : "Cache invalidation failed.");
    process.exitCode = 1;
  });
}
