import { SecurePDFViewer } from "@/components/pdf/SecurePDFViewer";

const getPost = (id: string) => {
  return {
    id,
    title: "Filsafat Sains Islami",
    category: "Buku",
    date: "21 Maret 2026",
    blocks: [
      { id: "b1", type: "text", content: "<p>Dalam buku ini, kita akan mengeksplorasi hubungan unik antara sains alam kontemporer dengan kerangka filosofis Islam. Pertanyaan mengenai validitas empiris sering kali membentur tembok nilai-nilai spiritual masa lampau.</p><p>Apakah keduanya bisa disatukan? Jawabannya terletak pada epistemologi yang kita gunakan sebagai landasan berpikir.</p>" },
      { id: "b2", type: "pdf", url: "/sample.pdf" },
      { id: "b3", type: "text", content: "<p>Diskusi lanjutan akan diulas secara mendalam pada video dokumenter berikut yang merangkum hasil penelitian lapangan.</p>" },
      { id: "b4", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
    ]
  };
};

export default function SinglePostPage({ params }: { params: { id: string } }) {
  const post = getPost(params.id);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <header className="mb-12 text-center">
        <span className="inline-block rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-4 py-1.5 text-sm font-semibold mb-6 tracking-wide">
          {post.category}
        </span>
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-(--color-primary) dark:text-white leading-tight">
          {post.title}
        </h1>
        <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium font-mono text-sm uppercase tracking-widest">{post.date}</p>
      </header>
      
      <div className="space-y-12 bg-white dark:bg-[#0p0a0a] rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-800">
        {post.blocks.map(block => {
          if (block.type === 'text') {
             return (
               <div key={block.id} className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-loose" dangerouslySetInnerHTML={{ __html: block.content }} />
             );
          }
          if (block.type === 'pdf') {
             return (
               <div key={block.id} className="my-14">
                 <h3 className="text-2xl font-bold mb-6 font-heading text-(--color-primary) dark:text-white border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center gap-2">
                   <span className="w-1.5 h-6 bg-(--color-accent) inline-block rounded-sm"></span>
                   Dokumen Pratinjau
                 </h3>
                 <SecurePDFViewer url={block.url} />
               </div>
             );
          }
          if (block.type === 'video') {
             return (
               <div key={block.id} className="my-14">
                 <h3 className="text-2xl font-bold mb-6 font-heading text-(--color-primary) dark:text-white border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center gap-2">
                   <span className="w-1.5 h-6 bg-red-500 inline-block rounded-sm"></span>
                   Video Terkait
                 </h3>
                 <div className="aspect-video rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-gray-900">
                   <iframe 
                     src={block.url} 
                     className="w-full h-full"
                     allowFullScreen
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   ></iframe>
                 </div>
               </div>
             );
          }
          return null;
        })}
      </div>
    </div>
  );
}
