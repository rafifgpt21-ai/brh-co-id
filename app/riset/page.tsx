export default function RisetPlaceholder() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-6">
        <span className="material-symbols-outlined text-4xl">science</span>
      </div>
      <h1 className="text-3xl font-headline font-bold text-primary mb-4">Riset</h1>
      <p className="text-on-surface-variant max-w-md text-center">
        Halaman riset sedang dalam pengembangan. Temukan berbagai publikasi penelitian segera.
      </p>
    </div>
  );
}
