import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const CONFIRM_FLAG = '--confirm'
const CONFIRM_VALUE = 'reset-brh-content'
const CONTENT_SOURCE_TYPES = ['post', 'quick_post']

function hasConfirmation() {
  const confirmFlagIndex = process.argv.indexOf(CONFIRM_FLAG)
  return process.argv[confirmFlagIndex + 1] === CONFIRM_VALUE
}

async function main() {
  const confirmed = hasConfirmation()
  const [postCount, quickPostCount, contentKnowledgeChunkCount] = await Promise.all([
    prisma.post.count(),
    prisma.quickPost.count(),
    prisma.knowledgeChunk.count({
      where: {
        sourceType: {
          in: CONTENT_SOURCE_TYPES,
        },
      },
    }),
  ])

  console.log('BRH content database reset')
  console.log(`Posts to delete: ${postCount}`)
  console.log(`Quick posts to delete: ${quickPostCount}`)
  console.log(`Content knowledge chunks to delete: ${contentKnowledgeChunkCount}`)
  console.log('Preserved data: users, accounts, sessions, verification tokens, rate limits, and static knowledge chunks.')

  if (!confirmed) {
    console.log('')
    console.log('No data was deleted.')
    console.log(`Run with ${CONFIRM_FLAG} ${CONFIRM_VALUE} to delete content data.`)
    return
  }

  console.log('')
  console.log('Confirmation accepted. Deleting content knowledge chunks, posts, and quick posts...')

  const knowledgeChunks = await prisma.knowledgeChunk.deleteMany({
    where: {
      sourceType: {
        in: CONTENT_SOURCE_TYPES,
      },
    },
  })
  const [posts, quickPosts] = await Promise.all([
    prisma.post.deleteMany({}),
    prisma.quickPost.deleteMany({}),
  ])

  console.log(`Deleted content knowledge chunks: ${knowledgeChunks.count}`)
  console.log(`Deleted posts: ${posts.count}`)
  console.log(`Deleted quick posts: ${quickPosts.count}`)
  console.log('')
  console.log('Content reset complete.')
  console.log('Run npm run seed:quick-posts if default quick posts should be restored.')
  console.log('Run npm run index:chatbot if chatbot knowledge should be re-indexed.')
}

main()
  .catch((e) => {
    console.error('Content reset failed.')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
