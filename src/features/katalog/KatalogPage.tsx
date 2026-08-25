import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchAllPublicData } from '../../services/api';
import { 
  ShoppingBag, Tent, Home as HomeIcon, Users, Award,
  Store, Coffee, Search, Loader2, MessageSquare, Phone
} from 'lucide-react';

const TAB_CONFIGS: Record<string, { label: string; icon: any; placeholderDesc: string }> = {
  paket: { label: 'Paket Pendakian', icon: ShoppingBag, placeholderDesc: 'Daftar paket pendakian resmi Sumbing Via Pencar.' },
  sewa: { label: 'Sewa Alat', icon: Tent, placeholderDesc: 'Peralatan camping outdoor berkualitas.' },
  homestay: { label: 'Homestay', icon: HomeIcon, placeholderDesc: 'Penginapan nyaman & hangat di area Basecamp Bogowonto.' },
  porter: { label: 'Porter & Guide', icon: Users, placeholderDesc: 'Pemandu dan porter lokal berlisensi.' },
  merchandise: { label: 'Merchandise', icon: Award, placeholderDesc: 'Kaos, gantungan kunci, dan kenang-kenangan khas Bogowonto.' },
  warung: { label: 'Warung', icon: Coffee, placeholderDesc: 'Makanan khas dan minuman hangat di Basecamp Bogowonto.' },
  umkm: { label: 'UMKM Lokal', icon: Store, placeholderDesc: 'Kerajinan, olahan makanan warga lereng gunung.' },
};

export default function KatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'paket';
  const [searchQuery, setSearchQuery] = useState('');

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ['publicAllData'],
    queryFn: fetchAllPublicData,
  });

  const publicData = apiResponse?.data || {};
  const products = publicData.products || [];
  const categories = publicData.productCategories || [];
  const bookingPackages = publicData.bookingPackages || [];

  // Filter categories by type
  const activeCategory = categories.find((c: any) => c.tipe === activeTab);

  // Filtered Products
  let itemsToDisplay: any[] = [];

  if (activeTab === 'paket') {
    // Packages are stored in bookingPackages table, formatted to match catalog product structure
    itemsToDisplay = bookingPackages.map((p: any) => ({
      id: p.id,
      nama_produk: p.nama_paket,
      deskripsi: p.deskripsi,
      harga: p.harga_per_orang,
      satuan: '/orang',
      foto: p.foto,
      is_available: p.is_available,
      is_featured: p.is_featured,
      kontak_wa: '+6281234567890', // Default basecamp WA
      fasilitas: typeof p.include === 'string' ? JSON.parse(p.include) : (p.include || []),
    }));
  } else {
    // Normal catalog products filtered by category type
    itemsToDisplay = products.filter((p: any) => p.category?.tipe === activeTab);
  }

  // Apply search query filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    itemsToDisplay = itemsToDisplay.filter(
      (item) =>
        item.nama_produk.toLowerCase().includes(q) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(q))
    );
  }

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#FAF8F5] font-sans">
        <Loader2 className="w-10 h-10 text-[#0D5C3A] animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500 dark:text-[#707070] tracking-wider animate-pulse uppercase">
          Memuat Katalog Bogowonto...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[var(--header-height)] bg-[#FAF8F5] dark:bg-[#FAF8F5]">
      {/* Hero */}
      <section className="relative py-16 bg-sky-gradient overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container-app relative z-10 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[#0D5C3A] text-xs font-bold uppercase tracking-widest mb-3">Marketplace Bogowonto</p>
            <h1 className="font-display font-black text-4xl sm:text-5xl mb-4">Katalog Layanan & Produk</h1>
            <p className="text-slate-200 text-sm max-w-xl mx-auto leading-relaxed">
              Temukan paket pendakian resmi, penyewaan alat outdoor, akomodasi homestay, dan dukung usaha warga lokal.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container-app">
          
          {/* Search bar */}
          <div className="mb-8 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Cari di ${TAB_CONFIGS[activeTab]?.label || 'katalog'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#F4F0E8] dark:bg-[#EBE7DF] border border-[#e7e5e4] dark:border-[#e7e5e4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/30 focus:border-[#0D5C3A]"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-100 dark:border-[#e7e5e4] pb-4">
            {Object.entries(TAB_CONFIGS).map(([tabId, cfg]) => {
              const Icon = cfg.icon;
              const isSelected = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  onClick={() => handleTabChange(tabId)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                      : 'bg-slate-50 dark:bg-[#F4F0E8] text-slate-600 dark:text-[#707070] hover:bg-slate-105'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {itemsToDisplay.length > 0 ? (
                itemsToDisplay.map((item: any, i: number) => {
                  const whatsappUrl = `https://wa.me/${(item.kontak_wa || '+6281234567890').replace(/[^0-9]/g, '')}?text=Halo%20Admin%20Basecamp%20Bogowonto,%20saya%20tertarik%20pesan%20${encodeURIComponent(item.nama_produk)}`;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                      className="bg-[#FAF8F5] dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] dark:border-[#e7e5e4] overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col"
                    >
                      {/* Product Image */}
                      <div className="h-48 relative overflow-hidden bg-[#F4F0E8] dark:bg-[#EBE7DF] flex items-center justify-center border-b border-[#e7e5e4] dark:border-[#e7e5e4]">
                        {item.foto ? (
                          <img src={item.foto} alt={item.nama_produk} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                        )}
                        {!item.is_available && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-full bg-red-650 text-white font-extrabold text-[10px] uppercase tracking-wider">
                              Habis / Penuh
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-display font-black text-base text-slate-800 dark:text-[#050505] mb-2 leading-tight">
                          {item.nama_produk}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-[#707070] mb-4 line-clamp-3 leading-relaxed">
                          {item.deskripsi || TAB_CONFIGS[activeTab]?.placeholderDesc}
                        </p>

                        {/* Additional facilities/specs if available */}
                        {item.fasilitas && item.fasilitas.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-6 flex-1">
                            {item.fasilitas.map((f: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-slate-50 dark:bg-[#EBE7DF] text-[9px] text-slate-500 dark:text-slate-450 border border-slate-100 dark:border-[#e7e5e4]">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price & Booking Button */}
                        <div className="pt-4 border-t border-slate-100 dark:border-[#e7e5e4] flex items-center justify-between mt-auto">
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Tarif</p>
                            <p className="font-display font-black text-[#0D5C3A] dark:text-[#0D5C3A] text-base">
                              Rp {item.harga.toLocaleString()}
                              <span className="text-[10px] font-normal text-slate-400"> {item.satuan || ''}</span>
                            </p>
                          </div>
                          
                          {activeTab === 'paket' ? (
                            <Link 
                              to="/reservasi"
                              className="px-4 py-2.5 bg-[#0D5C3A] hover:bg-[#0D5C3A] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0D5C3A]/10 transition-colors"
                            >
                              Booking
                            </Link>
                          ) : (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-4 py-2.5 bg-emerald-50 dark:bg-[#0D5C3A]/30 text-[#0D5C3A] dark:text-[#0D5C3A] hover:bg-[#0D5C3A] hover:text-white text-xs font-bold rounded-xl transition-all"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              Pesan WA
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center text-slate-400">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-350 dark:text-slate-650 mb-3" />
                  <p className="text-sm font-semibold">Tidak ada produk ditemukan</p>
                  <p className="text-xs mt-1">Coba gunakan kata kunci pencarian yang berbeda.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}
