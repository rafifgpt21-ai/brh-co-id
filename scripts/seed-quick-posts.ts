import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { deleteIfUnreferenced } from '@/lib/uploadthing-server'

const prisma = new PrismaClient()

const quoteContents = [
  'Kita mungkin lupa sudah berapa banyak ujian-cobaan hidup datang menghampiri. Dan juga mungkin sudah lupa bagaimana cara kita akhirnya bisa melewati-mengatasi semua. Tapi SATU HAL PASTI, semua ujian-cobaan itu telah menjadikan kita seorang yang BERBEDA dari sebelum ujian-cobaan itu datang. Kita bisa lebih baik mengenali diri kita & siapa saja orang-orang yang slalu ada untuk kita melalui semua.',
  'Kalau kita yakin BISA, kita pasti BISA. Kelilingi diri kita dengan orang-orang yang hanya menguatkan keyakinan kita bahwa kita BISA.',
  'Terwujudnya cita-cita hidup dimulai dari kemampuan kita membayangkannya. Kalau kita bisa membayangkannya kita pasti bisa mewujudkannya. Kalau membayangkannya saja kita tidak bisa, apalagi mewujudkannya. Bayangkan masa depan kita sekarang, visualisasikan, rasakan sensasi kehidupan yang kita bayangkan itu mewujud nyata dalam hidup kita maka akan merealita pada waktunya.',
  'Kamu tidak perlu memutuskan seperti apa masa depanmu. Putuskan saja apa yang akan menjadi kebiasaaanmu setiap hari. Kebiasaan setiap harimu itulah yang akan memutuskan seperti apa masa depanmu.',
  'Kamu tak punya alasan untuk terus memperdalam penyesalan: keputusan sudah diambil, kesalahan telah terjadi. Pilihan bijaknya: kamu memetik pelajaran dari keputusan & kesalahanmu itu agar ke depan lebih baik & terhindar dari kesalahan yang serupa.',
  'Perlakukan orang lain sebagaimana kamu sendiri ingin diperlakukan. Jika ingin dicintai, mencintalah. JIka ingin kejujuran, berlaku jujurlah. Jika ingin penghormatan, berperilaku terhormatlah. Ketahuilah, perlakuanmu kepada orang lain akan slalu kembali padamu.',
  'Pada akhirnya, apa yang kamu posting di media sosial akan menjadi kumpulan cerita. Oleh karenanya rangkailah cerita hidup yang menginspirasi, yang memberi manfaat, yang good vibe & happy ending.',
  'Kalau hidupmu ingin bertabur kenangan indah maka buatlah sejak sekarang. Sebab apapun yang kamu lakukan sekarang pada akhirnya kelak akan menjadi file kenangan hidupmu.',
  'Jika kamu tak punya kuasa mengubah dunia, kamu masih punya kuasa mengubah dunia kecilmu, dirimu, ke versi yang lebih baik. Ketahuilah, saat kamu mengubah dunia kecilmu maka dunia sekitarmu juga ikut berubah.',
  'Keputusan keliru & tindakan salah adalah mata kuliah-mata kuliah penting dari universitas kehidupan. Seringkali kamu tidak akan tahu keputusan tepat & tindakan benar, bila kamu tak pernah belajar dari pengalaman membuat keputusan keliru & tindakan salah.',
  'Jalanan lurus, datar & beraspal tidak akan bisa mencetak supir terampil. Jalanan yang bisa mencetak supir mahir hanya jalanan berlubang, berlumpur, penuh kelokan tajam & turunan-tanjakan curam.',
  'Kaya itu soal sikap hati. Terlalu banyak orang yang kaya materi tapi miskin hati: mereka slalu berat untuk berbagi. Tapi tidak sedikit orang yang miskin materi tapi kaya hati: mereka slalu ringan untuk berbagi.',
  'Kesuksesan adalah kumpulan kegagalan yang slalu disikapi positif sebagai rute perjalanan terjal & berliku yang, tidak bisa tidak, mesti dilalui.',
  'Kematangan berpikir & kedewasaan sikapmu tidak dibentuk oleh pelajaran di bangku sekolah, tapi, dibentuk melalui pengalamanmu melalui masa-masa sulit yang kadang pahit & menyakitkan di sekolah kehidupan nyata.',
  'Yang membuat berat bukan perjalananmu itu sendiri, melainkan harapanmu yang sering kelewat tinggi bahwa semua mesti berjalan sesuai keinginanmu.',
  'Hati-hati saat kamu mencintai & berekspektasi. Sebab akar sakit hati itu karena terlalu dalam mencintai dan akar kekecewaan hati itu karena terlalu tinggi ekspektasi.',
  'Jejaring pertemananmu itu aset kehidupanmu. Besar tidaknya nilai aset pertemananmu tidak diukur dari kuantitas tapi dari kualitas mereka. Dan kualitas mereka diukur dari besaran energi & vibrasi positif yang mereka sering tularkan kepadamu.',
]

async function main() {
  console.log('Seeding BRH quote posts...')

  const existing = await prisma.quickPost.findMany({
    where: { content: { in: quoteContents } },
    select: { imageUrl: true },
  })

  const removed = await prisma.quickPost.deleteMany({
    where: {
      content: {
        in: quoteContents,
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
    ],
  })

  const previousImages = existing.flatMap((post) => post.imageUrl ? [post.imageUrl] : [])
  if (previousImages.length > 0) {
    try {
      await deleteIfUnreferenced(previousImages, 'quick-post-seed-replacement')
    } catch (error) {
      console.warn('Seed selesai, tetapi cleanup gambar lama gagal. Jalankan npm run storage:audit.')
      console.warn(error)
    }
  }

  console.log(`Removed existing quote posts: ${removed.count}`)
  console.log(`Created quote posts: ${created.count}`)
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
