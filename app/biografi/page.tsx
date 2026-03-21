import { Card, CardContent } from "@/components/ui/Card";

export default function BiografiPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="space-y-12">
        <header className="text-center">
          <h1 className="text-4xl font-bold font-heading text-(--color-primary) dark:text-white">Biografi</h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">Menelusuri rekam jejak akademis dan pemikiran</p>
        </header>

        <Card className="overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-gray-100 dark:bg-gray-800 p-8 flex flex-col items-center justify-center border-r border-gray-200 dark:border-gray-700">
               <div className="w-48 h-48 rounded-full bg-gray-300 dark:bg-gray-700 mx-auto mb-4 overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center text-gray-500">
                 {/* Placeholder for Profile Image */}
                 <span className="text-xs">Foto Profil</span>
               </div>
               <h2 className="text-xl font-bold font-heading text-(--color-primary) dark:text-white mt-2">Budi R. Hakim</h2>
               <p className="text-sm text-(--color-accent) font-medium mt-1">Cendekiawan & Penulis</p>
            </div>
            <div className="md:w-2/3 p-8 flex flex-col justify-center">
              <CardContent className="p-0 prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Beliau adalah seorang pemikir, penulis, dan pemerhati kajian tasawuf serta filsafat sains Islami. 
                  Lahir dari dedikasi mendalam terhadap integrasi ilmu pengetahuan modern dengan kearifan masa lalu, 
                  karya-karyanya sering menyoroti aspek epistemologi dan pendidikan moral.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Sebagai pendiri berbagai inisiatif akademis, beliau secara aktif mempublikasikan berbagai buku, 
                  jurnal ilmiah, dan opini yang memantik diskusi intelektual di ruang publik.
                </p>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
