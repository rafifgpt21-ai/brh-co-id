import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const dummyPosts = [
  { id: "1", title: "Filsafat Sains Islami", category: "Buku", excerpt: "Eksplorasi hubungan antara pengetahuan modern dan kebijaksanaan klasik." },
  { id: "2", title: "Epistemologi Tasawuf Nusantara", category: "Jurnal", excerpt: "Mengkaji akar sejarah dan perkembangan metode tasawuf di Indonesia." },
  { id: "3", title: "Pendidikan Berkarakter di Era Digital", category: "Opini", excerpt: "Tantangan guru masa kini dalam mendidik generasi alfa dengan nilai moral." },
  { id: "4", title: "Studi Kritis Naskah Klasik", category: "Artikel", excerpt: "Membaca ulang teks-teks kuno dengan pendekatan hermeneutik kontemporer." },
];

const categories = ["Semua", "Buku", "Jurnal", "Artikel", "Opini"];

export default function KaryaPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <header className="mb-12 border-l-4 border-(--color-accent) pl-6">
         <h1 className="text-4xl font-bold font-heading text-(--color-primary) dark:text-white">Katalog Karya</h1>
         <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">Kumpulan pemikiran, riset, dan opini</p>
      </header>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-12">
        {categories.map((c, i) => (
          <Button key={c} variant={i === 0 ? "primary" : "outline"} size="sm" className="rounded-full px-5">
            {c}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dummyPosts.map(post => (
           <Card key={post.id} className="group overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
             <CardHeader className="pb-4">
               <span className={`inline-block rounded px-2 py-1 text-xs font-semibold w-fit mb-3 ${
                 post.category === 'Buku' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                 post.category === 'Jurnal' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                 post.category === 'Opini' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
               }`}>
                 {post.category}
               </span>
               <Link href={`/post/${post.id}`}>
                 <CardTitle className="text-xl group-hover:text-(--color-accent) transition-colors leading-tight">{post.title}</CardTitle>
               </Link>
             </CardHeader>
             <CardContent>
               <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{post.excerpt}</p>
             </CardContent>
           </Card>
        ))}
      </div>
    </div>
  );
}
