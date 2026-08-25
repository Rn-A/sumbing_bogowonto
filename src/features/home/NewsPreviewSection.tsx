import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Newspaper, ArrowRight, CornerDownRight, Calendar, Clock, Tag } from 'lucide-react';

interface ArticleItem {
  id: string;
  judul: string;
  slug: string;
  ringkasan?: string | null;
  foto_sampul?: string | null;
  tanggal_terbit?: string | Date | null;
  category?: {
    nama_kategori?: string;
  } | null;
}

interface NewsPreviewSectionProps {
  articles?: ArticleItem[];
}

const DEFAULT_ARTICLES: ArticleItem[] = [
  {
    id: 'default-1',
    judul: 'Penyesuaian Tarif SIMAKSI & Sistem Reservasi Online Basecamp Bogowonto',
    slug: 'penyesuaian-tarif-simaksi-2026',
    ringkasan: 'Mulai Agustus 2026, Basecamp Gunung Sumbing memberlakukan sistem reservasi online terintegrasi untuk pendataan tiket digital dan asuransi pendakian resmi.',
    foto_sampul: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80',
    tanggal_terbit: new Date().toISOString(),
    category: { nama_kategori: 'Pengumuman' },
  },
  {
    id: 'default-2',
    judul: 'Panduan Fisik & Perlengkapan Wajib Mendaki Puncak Sumbing Via Pencar',
    slug: 'panduan-fisik-dan-perlengkapan-sumbing',
    ringkasan: 'Tips persiapan stamina, rekomendasi logistik, serta daftar perlengkapan standar keamanan untuk menghadapi jalur sabana dan bebatuan Gunung Sumbing.',
    foto_sampul: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
    tanggal_terbit: new Date(Date.now() - 2 * 86400000).toISOString(),
    category: { nama_kategori: 'Tips Pendakian' },
  },
  {
    id: 'default-3',
    judul: 'Aksi Bersih Jalur & Konservasi Alam Bersama Komunitas Pendaki Kalikajar',
    slug: 'aksi-bersih-jalur-konservasi-sumbing',
    ringkasan: 'Kegiatan gotong royong pembersihan sampah dan penanaman vegetasi pencegah erosi di pos pendakian demi menjaga kelestarian ekosistem alam.',
    foto_sampul: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    tanggal_terbit: new Date(Date.now() - 5 * 86400000).toISOString(),
    category: { nama_kategori: 'Kegiatan' },
  },
];

export default function NewsPreviewSection({ articles = [] }: NewsPreviewSectionProps) {
  // Use real articles, fill with defaults if fewer than 3
  const displayArticles: ArticleItem[] = articles.length >= 3
    ? articles.slice(0, 3)
    : [...articles, ...DEFAULT_ARTICLES.slice(articles.length)].slice(0, 3);

  return (
    <section className="py-16 md:py-24 bg-[#F4F0E8]/60 dark:bg-[#F4F0E8]/60 border-t border-[#e7e5e4] dark:border-[#e7e5e4]">
      <div className="container-app">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D5C3A]/10 text-[#0D5C3A] text-xs font-bold uppercase tracking-widest mb-3">
              <Tag className="w-3.5 h-3.5" />
              <span>Kabar & Informasi</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#050505] dark:text-[#050505] tracking-tight">
              Berita & Pengumuman Terbaru
            </h2>
            <p className="text-xs sm:text-sm text-[#292524] dark:text-[#292524] mt-2 max-w-xl">
              Informasi terkini mengenai kondisi jalur, pengumuman resmi pengelola basecamp, dan tips pendakian Gunung Sumbing.
            </p>
          </div>

          <Link
            to="/berita"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0D5C3A] hover:text-[#064e3b] dark:text-[#0D5C3A] hover:gap-3 transition-all self-start md:self-auto bg-white/70 dark:bg-white/80 px-4 py-2.5 rounded-xl border border-[#e7e5e4] shadow-2xs hover:shadow-xs"
          >
            <span>Lihat Semua Berita</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayArticles.map((art, idx) => {
            const formattedDate = art.tanggal_terbit
              ? new Date(art.tanggal_terbit).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Terbaru';

            const categoryName = art.category?.nama_kategori || 'PENGUMUMAN';

            return (
              <motion.article
                key={art.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group flex flex-col bg-[#FAF8F5] dark:bg-[#FAF8F5] rounded-3xl border border-[#e7e5e4] dark:border-[#e7e5e4] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* Card Image Thumbnail */}
                <Link to={`/berita?slug=${art.slug}`} className="relative h-52 overflow-hidden bg-[#EBE7DF] block">
                  {art.foto_sampul ? (
                    <img
                      src={art.foto_sampul}
                      alt={art.judul}
                      className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-12 h-12 text-[#d4c9a8]" />
                    </div>
                  )}

                  {/* Category Pill Tag Overlay */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-[#0c0a09]/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      {categoryName}
                    </span>
                  </div>

                  {/* Dark gradient shadow bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </Link>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Meta info: Date & Reading time */}
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-[#707070] mb-3">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#0D5C3A]" />
                        {formattedDate}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        3 mnt baca
                      </span>
                    </div>

                    {/* News Title */}
                    <h3 className="font-display font-black text-base text-[#050505] leading-snug mb-3 group-hover:text-[#0D5C3A] transition-colors line-clamp-2">
                      <Link to={`/berita?slug=${art.slug}`}>
                        {art.judul}
                      </Link>
                    </h3>

                    {/* Excerpt / Summary */}
                    <p className="text-xs text-[#475569] leading-relaxed line-clamp-3 mb-4">
                      {art.ringkasan}
                    </p>
                  </div>

                  {/* Card Bottom CTA Link */}
                  <div className="pt-4 border-t border-[#e7e5e4] flex items-center justify-between">
                    <Link
                      to={`/berita?slug=${art.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-[#0D5C3A] group-hover:text-[#064e3b] uppercase tracking-wider transition-colors"
                    >
                      <span>Baca Selengkapnya</span>
                      <CornerDownRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-[#0D5C3A] group-hover:bg-[#0D5C3A] group-hover:text-white transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
