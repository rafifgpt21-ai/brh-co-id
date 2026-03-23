import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚮 Deleting all posts...')

  const result = await prisma.post.deleteMany({})

  console.log(`✅ Successfully deleted ${result.count} posts!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
