import assert from "node:assert/strict";

import {
  classifyTrafficSource,
  isBotUserAgent,
  parseReferrer,
  parseUserAgent,
  resolveTrackedPageCandidate,
  sanitizeAnalyticsText,
} from "@/lib/analytics/shared";

const idPost = resolveTrackedPageCandidate("/post/contoh-artikel?share=facebook");
assert.equal(idPost?.kind, "post");
assert.equal(idPost?.locale, "id");

const enPost = resolveTrackedPageCandidate("/en/post/example-article");
assert.equal(enPost?.kind, "post");
assert.equal(enPost?.locale, "en");

const idAbout = resolveTrackedPageCandidate("/tentang");
const enAbout = resolveTrackedPageCandidate("/en/about");
assert.equal(idAbout?.kind === "static" ? idAbout.pageKey : null, "page:about");
assert.equal(enAbout?.kind === "static" ? enAbout.pageKey : null, "page:about");
assert.equal(resolveTrackedPageCandidate("/admin"), null);
assert.equal(resolveTrackedPageCandidate("/api/chat"), null);
assert.equal(resolveTrackedPageCandidate("/catatan/kutipan/not-an-object-id"), null);

assert.equal(sanitizeAnalyticsText("  campaign\u0000name  "), "campaignname");
assert.equal(isBotUserAgent("Googlebot/2.1"), true);
assert.equal(isBotUserAgent("Mozilla/5.0 Chrome/140.0 Safari/537.36"), false);
assert.deepEqual(parseUserAgent("Mozilla/5.0 (iPhone) AppleWebKit Safari/605.1"), {
  deviceType: "mobile",
  browser: "Safari",
  os: "iOS",
});

const hosts = new Set(["www.brh.co.id"]);
assert.deepEqual(parseReferrer("https://www.brh.co.id/post/example?secret=yes", hosts), {
  referrerHost: "www.brh.co.id",
  referrerPath: "/post/example",
});
assert.deepEqual(parseReferrer("https://example.com/path?secret=yes", hosts), {
  referrerHost: "example.com",
  referrerPath: null,
});
assert.equal(classifyTrafficSource("www.google.com", null, hosts), "search");
assert.equal(classifyTrafficSource("example.com", "newsletter", hosts), "campaign");
assert.equal(classifyTrafficSource(null, null, hosts), "direct");

console.log("Analytics utility tests passed.");
