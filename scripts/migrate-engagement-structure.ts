import "dotenv/config";
import { AgendaCategory, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [agendaResult, normalPosts, homeSetting] = await Promise.all([
    prisma.quickPost.updateMany({
      where: {
        type: "AGENDA",
        agendaCategory: null,
      },
      data: {
        agendaCategory: AgendaCategory.ENGAGEMENT,
      },
    }),
    prisma.quickPost.findMany({
      where: { type: "NORMAL" },
      select: { id: true },
    }),
    prisma.siteSetting.findUnique({
      where: { key: "home" },
      select: { homeFeaturedPostIds: true },
    }),
  ]);

  const normalPostIds = normalPosts.map((post) => post.id);
  const removedKnowledge = normalPostIds.length > 0
    ? await prisma.knowledgeChunk.deleteMany({
        where: {
          sourceType: "quick_post",
          sourceId: { in: normalPostIds },
        },
      })
    : { count: 0 };

  const currentFeatured = Array.from(new Set(homeSetting?.homeFeaturedPostIds || []));
  const nextFeatured = currentFeatured.slice(0, 3);
  if (homeSetting && currentFeatured.join("|") !== nextFeatured.join("|")) {
    await prisma.siteSetting.update({
      where: { key: "home" },
      data: { homeFeaturedPostIds: nextFeatured },
    });
  }

  console.log(JSON.stringify({
    agendasBackfilled: agendaResult.count,
    perspectiveRecordsPreserved: normalPostIds.length,
    perspectiveKnowledgeChunksRemoved: removedKnowledge.count,
    featuredPostsBefore: currentFeatured.length,
    featuredPostsAfter: nextFeatured.length,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
