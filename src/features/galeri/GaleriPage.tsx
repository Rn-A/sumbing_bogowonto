import { useState } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Film, Grid3X3, LayoutList, X } from 'lucide-react';

const CATEGORIES = ['Semua', 'Pendakian', 'Basecamp', 'Sunrise', 'Event', 'Alam'];

const DUMMY_PHOTOS = Array.from({ length: 12 }, (_, i) => ({
  id: `photo-${i + 1}`,
  judul: `Foto Sumbing Via Pencar #${i + 1}`,
  kategori: CATEGORIES[Math.floor(Math.random() * (CATEGORIES.length - 1)) + 1],
}));

export default function GaleriPage() {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const filtered = activeCategory === 'Semua' ? DUMMY_PHOTOS : DUMMY_PHOTOS.filter(p => p.kategori === activeCategory);

  return (
    <div className="min-h-screen pt-[var(--header-height)] bg-[#FAF8F5] dark:bg-[#FAF8F5]">
      <section className="relative py-16 bg-sky-gradient overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container-app relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[#0D5C3A] text-xs font-bold uppercase tracking-widest mb-3">Dokumentasi Bogowonto</p>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-white mb-4">Galeri Foto & Video</h1>
            <p className="text-slate-300 text-base max-w-xl mx-auto">
              Koleksi foto dan video keindahan Gunung Sumbing Via Pencar dari berbagai sudut dan momen.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-app">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#0D5C3A] text-white shadow-md'
                    : 'bg-[#FAF8F5] dark:bg-[#F4F0E8] text-[#292524] dark:text-[#292524] border border-[#e7e5e4] dark:border-[#e7e5e4] hover:border-[#0D5C3A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedPhoto(photo.id)}
                className="group relative aspect-square bg-gradient-to-br from-[#F4F0E8] to-[#EBE7DF] dark:from-[#2d2d22] dark:to-[#232318] rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[#d4c9a8] dark:text-[#4a4635]" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-xs font-semibold truncate">{photo.judul}</p>
                    <p className="text-white/60 text-[10px]">{photo.kategori}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="w-full max-w-3xl aspect-video bg-[#2d2d22] rounded-2xl flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-[#4a4635]" />
          </div>
        </div>
      )}
    </div>
  );
}
