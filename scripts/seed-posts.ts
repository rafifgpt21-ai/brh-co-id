import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const categories = ['Buku', 'Jurnal', 'Artikel', 'Opini']
const statuses = ['Published', 'Draft']

const themes = [
  'Teknologi Masa Depan', 'Keadilan Sosial', 'Ekonomi Syariah', 'Filsafat Modern', 
  'Seni Kontemporer', 'Psikologi Anak', 'Hukum Lingkungan', 'Budaya Populer',
  'Pendidikan Digital', 'Sosiologi Urban', 'Kesehatan Masyarakat', 'Arsitektur Hijau',
  'Analisis Kebijakan', 'Tradisi Lokal', 'Inovasi Pendidikan', 'Manajemen Bisnis',
  'Politik Global', 'Etika Media', 'Sains Populer', 'Sejarah Peradaban'
]

const adjectives = [
  'Peluang', 'Tantangan', 'Paradigma', 'Perspektif', 'Transformasi', 'Dinamika',
  'Revolusi', 'Esensi', 'Manifestasi', 'Utopis', 'Kritis', 'Inovatif', 'Pragmatis'
]

const subjects = [
  'di Era 4.0', 'Menuju Indonesia Emas', 'di Masa Pandemi', 'dan Keberlanjutan',
  'bagi Generasi Muda', 'dalam Tatanan Global', 'untuk Masa Depan', 'di Tengah Perubahan'
]

function generateRandomTitle(index: number) {
  const theme = themes[index % themes.length]
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const subject = subjects[Math.floor(Math.random() * subjects.length)]
  return `${adjective} ${theme} ${subject} #${index + 1}`
}

const unsplashImages = [
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
  'https://images.unsplash.com/photo-1454165833221-d7d176b7c20',
  'https://images.unsplash.com/photo-1432821596592-e2c18b78144f',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
  'https://images.unsplash.com/photo-1518770660439-4636190af475',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
  'https://images.unsplash.com/photo-1507413245164-6160d8298b31'
]

function getRandomImage() {
  const base = unsplashImages[Math.floor(Math.random() * unsplashImages.length)]
  return `${base}?w=1200&auto=format&fit=crop`
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

function createTextBlocks(theme: string): any[] {
  return [
    {
      id: randomUUID(),
      type: 'text',
      content: `<h2>Pengantar: ${theme}</h2><p>Pembahasan mengenai <strong>${theme}</strong> menjadi krusial di era saat ini. Kita seringkali melupakan bahwa esensi dari perubahan terletak pada pemahaman yang mendalam terhadap struktur yang ada di bawahnya.</p><p>Sebagai sebuah paradigma baru, hal ini menuntut kita untuk bersikap lebih adaptif dan kritis terhadap segala bentuk informasi yang masuk.</p>`,
    },
    {
      id: randomUUID(),
      type: 'text',
      content: '<h3>Poin-Poin Utama</h3><ul><li>Analisis data secara real-time</li><li>Kolaborasi lintas sektoral yang efektif</li><li>Penerapan nilai-nilai etis dalam setiap kebijakan</li><li>Evaluasi berkelanjutan untuk hasil yang optimal</li></ul>',
    }
  ]
}

function getRandomBlock(theme: string): any {
  const types = ['image', 'video', 'pdf', 'link', 'text']
  const type = types[Math.floor(Math.random() * types.length)]

  switch (type) {
    case 'image':
      return {
        id: randomUUID(),
        type: 'image',
        content: `Visualisasi dari ${theme}`,
        url: getRandomImage(),
        caption: `Dokumentasi terkait ${theme}`,
      }
    case 'video':
      return {
        id: randomUUID(),
        type: 'video',
        content: 'Materi Penjelasan Visual',
        url: Math.random() > 0.5 ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : 'https://vimeo.com/channels/staffpicks/93951774',
        caption: 'Video referensi untuk pendalaman materi',
      }
    case 'pdf':
      return {
        id: randomUUID(),
        type: 'pdf',
        content: 'Dokumen Teknis dan Referensi',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        title: `Laporan-${theme.replace(/\s+/g, '-')}.pdf`,
      }
    case 'link':
      return {
        id: randomUUID(),
        type: 'link',
        content: `Kunjungi sumber asli ${theme}`,
        url: 'https://google.com',
        title: 'Lihat Referensi Eksternal',
      }
    default:
      return {
        id: randomUUID(),
        type: 'text',
        content: `<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. <em>Excepteur sint occaecat cupidatat non proident</em>, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>`,
      }
  }
}

async function main() {
  console.log('🚀 Starting deep seeding for stress test (100 posts)...')

  // Clear existing posts if needed? User didn't ask but usually better for stress test.
  // We'll skip clearing unless asked, but we'll add a lot of data.

  for (let i = 0; i < 100; i++) {
    const title = generateRandomTitle(i)
    const category = categories[Math.floor(Math.random() * categories.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const slug = `${slugify(title)}-${Math.random().toString(36).substring(2, 7)}`
    const theme = themes[i % themes.length]

    // Generate varied blocks
    const blocksCount = Math.floor(Math.random() * 5) + 3 // 3 to 8 blocks per post
    const postBlocks = [...createTextBlocks(theme)]
    
    for (let j = 0; j < blocksCount; j++) {
      postBlocks.push(getRandomBlock(theme))
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        category,
        status,
        thumbnail: getRandomImage(),
        blocks: postBlocks
      }
    })

    if (i % 10 === 0) {
      console.log(`📦 Generated ${i} posts...`)
    }
  }

  console.log('✨ Success! 100 posts created with varied blocks.')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed!')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

