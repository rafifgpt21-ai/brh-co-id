import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminIdentifier = 'admin@brh.co.id'
  const adminUsername = 'admin'
  const password = 'admin2138'
  
  const hashedPassword = await bcrypt.hash(password, 10)

  // Upsert command avoids failing if the user already exists
  const admin = await prisma.user.upsert({
    where: { email: adminIdentifier },
    update: {
      password: hashedPassword,
      username: adminUsername,
      name: 'admin',
      role: 'ADMIN',
    },
    create: {
      email: adminIdentifier,
      name: 'admin',
      username: adminUsername,
      password: hashedPassword,
      role: 'ADMIN', // using 'ADMIN' for Role enum
    },
  })

  console.log(`✅ Admin user seeded successfully!`)
  console.log(`Email: ${admin.email}`)
  console.log(`Username: ${admin.username}`)
  console.log(`Password: ${password}`)
  console.log(`Role: ${admin.role}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
