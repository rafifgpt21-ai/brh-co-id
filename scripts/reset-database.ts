import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const CONFIRM_FLAG = '--confirm'
const CONFIRM_VALUE = 'reset-brh-content'

function hasConfirmation() {
  const confirmFlagIndex = process.argv.indexOf(CONFIRM_FLAG)
  return process.argv[confirmFlagIndex + 1] === CONFIRM_VALUE
}

async function main() {
  const confirmed = hasConfirmation()
  const [postCount, postKnowledgeChunkCount] = await Promise.all([
    prisma.post.count(),
    prisma.knowledgeChunk.count({
      where: {
        sourceType: 'post',
      },
    }),
  ])

  console.log('BRH content database reset')
  console.log(`Posts to delete: ${postCount}`)
  console.log(`Post knowledge chunks to delete: ${postKnowledgeChunkCount}`)
  console.log('Preserved data: users, accounts, sessions, verification tokens, rate limits, and static knowledge chunks.')

  if (!confirmed) {
    console.log('')
    console.log('No data was deleted.')
    console.log(`Run with ${CONFIRM_FLAG} ${CONFIRM_VALUE} to delete content data.`)
    return
  }

  console.log('')
  console.log('Confirmation accepted. Deleting post knowledge chunks and posts...')

  const knowledgeChunks = await prisma.knowledgeChunk.deleteMany({
    where: {
      sourceType: 'post',
    },
  })
  const posts = await prisma.post.deleteMany({})

  console.log(`Deleted post knowledge chunks: ${knowledgeChunks.count}`)
  console.log(`Deleted posts: ${posts.count}`)
  console.log('')
  console.log('Content reset complete.')
  console.log('Run npm run index:chatbot if static chatbot knowledge should be re-indexed.')
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
