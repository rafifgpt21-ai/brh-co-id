import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const quoteContents = [
  'Penghancur kehidupanmu itu seringkali bukan orang lain, tetapi dirimu sendiri, karena pikiranmu sendiri.',
  'Transformasi sejati dimulai bukan ketika kita membentuk ulang arsitektur global di luar sana, melainkan ketika kita mampu menata lanskap batin dan pikiran kita sendiri.',
  'Kita sering menyalahkan kekuatan dari luar atas pertumbuhan yang mandek, padahal jangkar terberat yang menahan kita lahir dari asumsi-asumsi yang tidak pernah kita periksa.',
  'Kedaulatan diri yang paling tinggi adalah kesadaran bahwa dunia merespons siapa diri kita, bukan hanya apa yang kita inginkan.',
  'Mengintegrasikan hikmah tasawuf ke dalam peradaban modern bukan berarti kembali ke masa lalu, melainkan menambatkan laju masa depan pada kebenaran yang abadi.',
  'Spiritualitas tanpa ketelitian intelektual mudah jatuh menjadi dogma buta. Intelektualitas tanpa pijakan spiritual dapat berubah menjadi kecerdasan yang merusak.',
  'Dunia modern mencari kemajuan melalui percepatan, sementara jiwa menemukan keluhurannya melalui keheningan dan zikir kepada Tuhan.',
  'Kebijaksanaan sejati tidak memisahkan yang sakral dari yang sekuler. Setiap kebijakan yang kita analisis dan setiap struktur yang kita bangun dapat menjadi bentuk pengabdian.',
  'Pendidikan bukan sekadar transfer pengetahuan secara mekanis, melainkan kebangkitan jiwa untuk menyadari tanggung jawab ilahinya di tengah masyarakat modern.',
  'Boarding school peradaban tidak cukup hanya menjaga hati dari kekacauan modernitas, tetapi juga harus membekali pikiran untuk membentuk arah masa depannya.',
  'Kita tidak membangun institusi hanya untuk bertahan menghadapi zaman. Kita membangunnya untuk menanam gagasan dasar yang menggerakkan generasi menuju perubahan positif.',
  'Tujuan tertinggi keilmuan adalah melayani peradaban: mengubah teori akademik yang abstrak menjadi tindakan nyata yang penuh kasih.',
  'Arsitektur hijau lebih dari rekayasa keberlanjutan; ia adalah manifestasi fisik dari harmoni spiritual antara manusia dan ciptaan.',
  'Sistem ekonomi yang etis tidak hanya mengukur akumulasi modal, tetapi juga pemerataan martabat dan kesejahteraan manusia.',
  'Filsafat modern perlu melampaui dekonstruksi yang sinis dan mulai membangun pilar-pilar etis bagi masa depan yang gemilang.',
  'Analisis kebijakan global menjadi hampa bila tidak berpusat pada inti perubahan yang paling dalam: peningkatan kesadaran manusia.',
  'Menanam gagasan membutuhkan keberanian; menggerakkan perubahan membutuhkan konsistensi. Jembatan di antara keduanya adalah niat yang kokoh.',
  'Jangan mencari jalan yang lebih sedikit tantangannya. Carilah hati yang cukup lapang untuk merangkul semua tantangan dengan syukur dan kebijaksanaan.',
  'Ekspresi intelektual adalah suara jiwa yang menolak diam di hadapan stagnasi.',
  'Hidupmu adalah manuskrip yang terus ditulis. Pastikan setiap bab yang kau susun ikut menyumbang pada narasi besar peningkatan martabat manusia.',
]

const normalQuickPosts = [
  {
    content:
      'Catatan sementara: BRH Intellectual Platform sedang menyiapkan ruang belajar yang menghubungkan tasawuf, pendidikan, kebijakan publik, dan gagasan peradaban. Konten ini masih dummy untuk kebutuhan pengembangan.',
    imageUrl: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=1200&auto=format&fit=crop',
  },
  {
    content:
      'Agenda dummy: diskusi tematik tentang pendidikan berasrama, pembentukan karakter, dan kesiapan generasi muda menghadapi perubahan sosial modern.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop',
  },
  {
    content:
      'Pengingat dummy: gagasan besar perlu diturunkan menjadi praktik kecil yang konsisten, dari cara membaca, berdialog, menulis, hingga melayani masyarakat.',
    imageUrl: null,
  },
  {
    content:
      'Catatan riset dummy: arsitektur hijau, ekonomi etis, dan analisis kebijakan dapat bertemu dalam satu orientasi yang sama, yaitu menjaga martabat manusia dan keseimbangan ciptaan.',
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&auto=format&fit=crop',
  },
]

const seededContents = [...quoteContents, ...normalQuickPosts.map((post) => post.content)]

async function main() {
  console.log('Seeding BRH quick posts...')

  const removed = await prisma.quickPost.deleteMany({
    where: {
      content: {
        in: seededContents,
      },
    },
  })

  const created = await prisma.quickPost.createMany({
    data: [
      ...quoteContents.map((content, index) => ({
        type: 'QUOTE',
        content,
        imageUrl: null,
        status: 'Published',
        createdAt: new Date(Date.now() - (quoteContents.length - index) * 60 * 60 * 1000),
      })),
      ...normalQuickPosts.map((post, index) => ({
        type: 'NORMAL',
        content: post.content,
        imageUrl: post.imageUrl,
        status: 'Published',
        createdAt: new Date(Date.now() - (quoteContents.length + normalQuickPosts.length - index) * 60 * 60 * 1000),
      })),
    ],
  })

  console.log(`Removed existing seeded quick posts: ${removed.count}`)
  console.log(`Created quick posts: ${created.count}`)
}

main()
  .catch((error) => {
    console.error('Quick post seeding failed.')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
