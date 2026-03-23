import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const categories = ['Buku', 'Jurnal', 'Artikel', 'Opini']
const statuses = ['Published', 'Draft']

const titles = [
  'Membangun Masa Depan Digital',
  'Keadilan dalam Perspektif Hukum Modern',
  'Inovasi Teknologi di Abad 21',
  'Pendidikan Karakter bagi Generasi Z',
  'Ekonomi Kreatif: Peluang dan Tantangan',
  'Sosiologi Masyarakat Urban',
  'Kesehatan Mental di Era Media Sosial',
  'Perubahan Iklim dan Adaptasi Global',
  'Budaya Literasi di Indonesia',
  'Politik Identitas dan Demokrasi',
  'Seni Kontemporer dalam Arus Globalisasi',
  'Manajemen Konflik di Lingkungan Kerja',
  'Etika Bisnis dalam Dunia Digital',
  'Filosofi Kebahagiaan di Zaman Modern',
  'Pembangunan Berkelanjutan di Desa',
  'Transformasi Layanan Publik',
  'Keamanan Siber dan Privasi Data',
  'Psikologi Belajar Anak di Era Digital',
  'Arsitektur Ramah Lingkungan',
  'Sejarah Pemikiran Ekonomi'
]

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

async function main() {
  console.log('🌱 Seeding 20 posts...')

  for (let i = 0; i < 20; i++) {
    const title = titles[i] || `Post Default Title ${i + 1}`
    const category = categories[Math.floor(Math.random() * categories.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const slug = `${slugify(title)}-${Math.random().toString(36).substring(2, 7)}`

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        category,
        status,
        thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop',
        blocks: [
          {
            id: randomUUID(),
            type: 'text',
            content: `<p>Ini adalah paragraf pembuka untuk post berjudul <strong>${title}</strong>. Post ini membahas tentang berbagai aspek menarik dalam kategori <em>${category}</em>.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>`,
          },
          {
            id: randomUUID(),
            type: 'image',
            content: 'Pemandangan alam yang indah',
            url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
            caption: 'Foto oleh Unsplash',
          },
          {
            id: randomUUID(),
            type: 'text',
            content: '<h2>Bagian Utama</h2><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><ul><li>Poin pertama yang sangat penting</li><li>Poin kedua untuk detail lebih lanjut</li><li>Poin ketiga sebagai kesimpulan bagian</li></ul>',
          },
          {
            id: randomUUID(),
            type: 'video',
            content: 'Video Penjelasan',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            caption: 'Video tutorial singkat',
          },
          {
            id: randomUUID(),
            type: 'pdf',
            content: 'Dokumen Referensi',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            title: 'Laporan-Analisis.pdf',
          },
          {
            id: randomUUID(),
            type: 'text',
            content: '<p>Demikian pembahasan singkat mengenai topik ini. Semoga memberikan wawasan baru bagi pembaca sekalian.</p>',
          }
        ]
      }
    })

    console.log(`Created post: ${post.title} (${post.slug})`)
  }

  console.log('✅ Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
