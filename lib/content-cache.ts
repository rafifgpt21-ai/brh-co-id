import { normalizePostCategory } from "@/lib/post-categories";

export const POST_LISTS_TAG = "post-lists";
export const HOME_FEATURED_TAG = "home-featured";
export const POST_FILES_TAG = "post-files";
export const POST_CONTENT_TAG = "post-content"; // Reserved for explicit bulk/script invalidation.
export const RELATED_POSTS_TAG = "post-related";

export function relatedPostsTag(category: string) {
  return `post-related-${normalizePostCategory(category)}`;
}

export type PostCacheIdentity = {
  id: string;
  slug: string;
  slugEn?: string | null;
  category: string;
};

export function postMutationTags(post: PostCacheIdentity, previous?: PostCacheIdentity) {
  return [...new Set([
    POST_LISTS_TAG,
    POST_FILES_TAG,
    "posts", // Admin lists and legacy data consumers.
    ...[post, previous].filter((item): item is PostCacheIdentity => Boolean(item)).flatMap((item) => [
      `post-${item.id}`,
      `post-slug-${item.slug}`,
      ...(item.slugEn ? [`post-slug-${item.slugEn}`] : []),
      relatedPostsTag(item.category),
    ]),
  ])];
}
