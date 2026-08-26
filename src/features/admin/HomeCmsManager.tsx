import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, updateSettings, uploadFile } from '../../services/api';
import { 
  Sparkles, Image as ImageIcon, Plus, Trash2, Edit3, Save, 
  Loader2, CheckCircle2, ArrowUpRight, Layout, CalendarCheck,
  Compass, Tent, Shield, Trees, MapPin, Layers, Upload
} from 'lucide-react';

const DEFAULT_HERO_SLIDES = [
  {
    id: 'slide-1',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80',
    badge: 'Portal Digital Resmi Basecamp Bogowonto',
    title: 'Jelajahi Puncak Sumbing Via Pencar',
    desc: 'Selamat datang di Basecamp Bogowonto — pintu gerbang pendakian Gunung Sumbing (3.371 mdpl) melalui jalur Via Pencar, Pencar Atas, Kalikajar, Wonosobo.',
    ctaText: 'Booking Sekarang',
    ctaLink: '/reservasi',
    secCtaText: 'Lihat Jalur',
    secCtaLink: '/profil'
  },
  {
    id: 'slide-2',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
    badge: 'Jalur Pendakian Via Pencar',
    title: 'Rute Panorama Terbaik ke Puncak',
    desc: 'Nikmati pemandangan kebun penduduk dan lereng sabana terbuka menawan sepanjang jalur Via Pencar. Unduh berkas GPX peta untuk navigasi GPS aman.',
    ctaText: 'Pelajari Rute',
    ctaLink: '/profil',
    secCtaText: 'Sewa Porter',
    secCtaLink: '/katalog?tab=porter'
  }
];

const DEFAULT_ABOUT = {
  badge: 'TENTANG BASECAMP BOGOWONTO',
  title: 'Portal Pendakian Gunung Sumbing Via Pencar.',
  paragraph1: 'Basecamp Bogowonto merupakan portal pelayanan dan informasi resmi pendakian Gunung Sumbing (3.371 mdpl) via jalur Pencar, Wonosobo. Kami menyediakan panduan pendakian yang komprehensif, aman, dan terstruktur untuk setiap pendaki.',
  paragraph2: 'Melalui platform ini, Anda dapat mengakses informasi rute interaktif, registrasi SIMAKSI online, pemesanan homestay & perlengkapan, hingga pengunduhan file GPX demi kelancaran dan keselamatan petualangan Anda.',
  devLabel: 'PENGEMBANG',
  devDesc: 'Mahasiswa KKN UMP 2026 (Universitas Muhammadiyah Purwokerto)',
  contactLabel: 'KONTAK',
  contactValue: 'basecampbogowonto@gmail.com',
  imgLeft: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
  imgTopRight: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  imgBottomRight: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
};

const DEFAULT_SERVICES = {
  title: 'Layanan Basecamp Bogowonto',
  subtitle: 'Akses Layanan Cepat',
  desc: 'Silakan pilih salah satu tautan cepat layanan resmi di bawah untuk memulai.',
  items: [
    { id: 'srv-1', icon: 'CalendarCheck', title: 'Reservasi Online', desc: 'Booking pendakian cepat & mudah dengan sistem tiket QR digital.', path: '/reservasi' },
    { id: 'srv-2', icon: 'Compass', title: 'Peta & Rute GPX', desc: 'Preview jalur interaktif Via Pencar, download file GPX untuk GPS.', path: '/profil' },
    { id: 'srv-3', icon: 'Tent', title: 'Sewa Peralatan', desc: 'Perlengkapan camping & pendakian lengkap tersedia di basecamp.', path: '/katalog?tab=sewa' },
    { id: 'srv-4', icon: 'Shield', title: 'Porter & Guide', desc: 'Tim berpengalaman siap menemani perjalanan Anda ke puncak.', path: '/katalog?tab=porter' },
    { id: 'srv-5', icon: 'Trees', title: 'Homestay', desc: 'Penginapan nyaman di sekitar basecamp dengan harga terjangkau.', path: '/katalog?tab=homestay' },
    { id: 'srv-6', icon: 'MapPin', title: 'UMKM Lokal', desc: 'Dukung ekonomi lokal dengan belanja produk khas daerah.', path: '/katalog?tab=umkm' }
  ]
};

const DEFAULT_CTA = {
  title: 'Siap Mendaki Via Pencar?',
  desc: 'Lakukan reservasi sekarang dan dapatkan pengalaman mendaki Gunung Sumbing melalui jalur Pencar yang aman dan terorganisir.',
  bgImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
  primaryCtaText: 'Mulai Booking',
  primaryCtaLink: '/reservasi',
  secondaryCtaText: 'Hubungi Kami',
  secondaryCtaLink: '/kontak'
};

export default function HomeCmsManager() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'hero' | 'about' | 'services' | 'cta'>('hero');
  const [, setIsUploading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // States for CRUD
  const [heroSlides, setHeroSlides] = useState<any[]>(DEFAULT_HERO_SLIDES);
  const [aboutSection, setAboutSection] = useState<any>(DEFAULT_ABOUT);
  const [servicesSection, setServicesSection] = useState<any>(DEFAULT_SERVICES);
  const [ctaSection, setCtaSection] = useState<any>(DEFAULT_CTA);

  // Modal State for Hero Slide editing
  const [editingSlide, setEditingSlide] = useState<any | null>(null);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);

  // Modal State for Service item editing
  const [editingService, setEditingService] = useState<any | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (settingsResponse?.data) {
      const s = settingsResponse.data;
      if (s.home_hero_slides && Array.isArray(s.home_hero_slides)) {
        setHeroSlides(s.home_hero_slides);
      }
      if (s.home_about_section) {
        setAboutSection({ ...DEFAULT_ABOUT, ...s.home_about_section });
      }
      if (s.home_services) {
        setServicesSection({ ...DEFAULT_SERVICES, ...s.home_services });
      }
      if (s.home_cta_banner) {
        setCtaSection({ ...DEFAULT_CTA, ...s.home_cta_banner });
      }
    }
  }, [settingsResponse]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      setSaveSuccessMsg('Pengaturan Menu Home berhasil disimpan!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    },
  });

  const handleGlobalSave = (updatedData?: Partial<{ heroSlides: any[]; aboutSection: any; servicesSection: any; ctaSection: any }>) => {
    const payload = {
      home_hero_slides: updatedData?.heroSlides || heroSlides,
      home_about_section: updatedData?.aboutSection || aboutSection,
      home_services: updatedData?.servicesSection || servicesSection,
      home_cta_banner: updatedData?.ctaSection || ctaSection,
    };
    saveMutation.mutate(payload);
  };

  // Image File Upload Helper
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await uploadFile({ fileName: file.name, fileData: base64Data });
          if (res.success && res.url) {
            onSuccess(res.url);
          } else {
            onSuccess(base64Data);
          }
        } catch {
          onSuccess(base64Data);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload failed:', err);
      setIsUploading(false);
    }
  };

  // ===================================
  // 1. HERO BANNER SLIDES CRUD
  // ===================================
  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    let updatedSlides = [...heroSlides];
    if (editingSlide.id) {
      updatedSlides = updatedSlides.map(s => s.id === editingSlide.id ? editingSlide : s);
    } else {
      const newSlide = { ...editingSlide, id: `slide-${Date.now()}` };
      updatedSlides.push(newSlide);
    }

    setHeroSlides(updatedSlides);
    setIsSlideModalOpen(false);
    setEditingSlide(null);
    handleGlobalSave({ heroSlides: updatedSlides });
  };

  const handleDeleteSlide = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus banner slide ini?')) {
      const updatedSlides = heroSlides.filter(s => s.id !== id);
      setHeroSlides(updatedSlides);
      handleGlobalSave({ heroSlides: updatedSlides });
    }
  };

  // ===================================
  // 2. QUICK SERVICES CRUD
  // ===================================
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    let updatedItems = [...(servicesSection.items || [])];
    if (editingService.id) {
      updatedItems = updatedItems.map(item => item.id === editingService.id ? editingService : item);
    } else {
      const newItem = { ...editingService, id: `srv-${Date.now()}` };
      updatedItems.push(newItem);
    }

    const updatedServices = { ...servicesSection, items: updatedItems };
    setServicesSection(updatedServices);
    setIsServiceModalOpen(false);
    setEditingService(null);
    handleGlobalSave({ servicesSection: updatedServices });
  };

  const handleDeleteService = (id: string) => {
    if (confirm('Hapus item layanan ini?')) {
      const updatedItems = (servicesSection.items || []).filter((item: any) => item.id !== id);
      const updatedServices = { ...servicesSection, items: updatedItems };
      setServicesSection(updatedServices);
      handleGlobalSave({ servicesSection: updatedServices });
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D5C3A] mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider">Memuat Konfigurasi Home CMS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* CMS Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#0D5C3A] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Management Content System (CMS)</span>
          </div>
          <h1 className="text-2xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Editor Konten Menu Home
          </h1>
          <p className="text-xs text-[#707070] mt-1">
            Kelola gambar banner, judul hero, deskripsi, seksi Riset Publik (gambar di atas), layanan cepat, dan banner penutup.
          </p>
        </div>

        <button
          onClick={() => handleGlobalSave()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-[#0D5C3A] hover:bg-[#0a472d] text-white text-xs font-extrabold rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Simpan Perubahan CMS</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700">
        {[
          { id: 'hero', label: '1. Gambar & Judul Banner (Hero)', icon: ImageIcon },
          { id: 'about', label: '2. Riset Publik (Gambar Diatas)', icon: Layout },
          { id: 'services', label: '3. Akses Layanan Cepat', icon: Layers },
          { id: 'cta', label: '4. Section (Siap Mendaki Via Pencar)', icon: ArrowUpRight },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#0D5C3A] text-[#050505] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: BANNER SLIDES (HERO CAROUSEL) */}
      {/* ============================================================ */}
      {subTab === 'hero' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#050505]">Hero Banner Slides</h3>
              <p className="text-xs text-[#707070]">Kelola slide gambar banner, badge, judul utama, dan tombol aksi di bagian paling atas Home.</p>
            </div>
            <button
              onClick={() => {
                setEditingSlide({
                  image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80',
                  badge: 'Portal Digital Resmi Basecamp Bogowonto',
                  title: '',
                  desc: '',
                  ctaText: 'Booking Sekarang',
                  ctaLink: '/reservasi',
                  secCtaText: 'Lihat Jalur',
                  secCtaLink: '/profil'
                });
                setIsSlideModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#050505] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-black transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Banner Slide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {heroSlides.map((slide, i) => (
              <div key={slide.id || i} className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900">
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Slide #{i + 1}
                    </div>
                  </div>

                  {slide.badge && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      {slide.badge}
                    </span>
                  )}

                  <h4 className="font-display font-black text-lg text-[#050505] leading-snug">{slide.title || 'Tanpa Judul'}</h4>
                  <p className="text-xs text-[#707070] line-clamp-2 leading-relaxed">{slide.desc}</p>
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 text-[10px] font-bold text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded">CTA 1: {slide.ctaText || '-'} ({slide.ctaLink})</span>
                    <span className="bg-slate-100 px-2 py-1 rounded">CTA 2: {slide.secCtaText || '-'} ({slide.secCtaLink})</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e7e5e4]">
                  <button
                    onClick={() => {
                      setEditingSlide(slide);
                      setIsSlideModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Slide</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: RISET PUBLIK (GAMBAR DIATAS) */}
      {/* ============================================================ */}
      {subTab === 'about' && (
        <div className="bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-[#050505]">Kelola Seksi Riset Publik (Gambar Diatas)</h3>
            <p className="text-xs text-[#707070]">Seksi "TENTANG MUNCAK.ID / Riset publik, untuk pendaki publik." lengkap dengan 3 foto mosaik.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Teks & Informasi */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Teks (Atas Judul)</label>
                <input
                  type="text"
                  value={aboutSection.badge || ''}
                  onChange={(e) => setAboutSection({ ...aboutSection, badge: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  placeholder="Contoh: TENTANG MUNCAK.ID"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Utama Seksi</label>
                <input
                  type="text"
                  value={aboutSection.title || ''}
                  onChange={(e) => setAboutSection({ ...aboutSection, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  placeholder="Contoh: Riset publik, untuk pendaki publik."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Paragraf Keterangan 1</label>
                <textarea
                  rows={3}
                  value={aboutSection.paragraph1 || ''}
                  onChange={(e) => setAboutSection({ ...aboutSection, paragraph1: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  placeholder="Deskripsi paragraf pertama..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Paragraf Keterangan 2</label>
                <textarea
                  rows={3}
                  value={aboutSection.paragraph2 || ''}
                  onChange={(e) => setAboutSection({ ...aboutSection, paragraph2: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  placeholder="Deskripsi paragraf kedua..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Pengembang (Deskripsi)</label>
                  <textarea
                    rows={3}
                    value={aboutSection.devDesc || ''}
                    onChange={(e) => setAboutSection({ ...aboutSection, devDesc: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Kontak (Email/Teks)</label>
                  <input
                    type="text"
                    value={aboutSection.contactValue || ''}
                    onChange={(e) => setAboutSection({ ...aboutSection, contactValue: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: 3 Foto Mosaik Local Upload */}
            <div className="space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#0D5C3A]" />
                <span>Upload 3 Foto Mosaik (Local Storage)</span>
              </h4>

              {/* Foto 1: Kiri Tinggi */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">1. Foto Kiri (Tinggi / Tall Image)</label>
                <div className="flex items-center gap-3">
                  <img src={aboutSection.imgLeft} alt="Kiri" className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-xs" />
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, (url) => setAboutSection({ ...aboutSection, imgLeft: url }))}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0D5C3A] file:text-white hover:file:bg-[#0a472d]"
                    />
                    <input
                      type="text"
                      value={aboutSection.imgLeft || ''}
                      onChange={(e) => setAboutSection({ ...aboutSection, imgLeft: e.target.value })}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-300"
                      placeholder="atau tempel URL foto..."
                    />
                  </div>
                </div>
              </div>

              {/* Foto 2: Kanan Atas */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">2. Foto Kanan Atas (Top Right Square)</label>
                <div className="flex items-center gap-3">
                  <img src={aboutSection.imgTopRight} alt="Kanan Atas" className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-xs" />
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, (url) => setAboutSection({ ...aboutSection, imgTopRight: url }))}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0D5C3A] file:text-white hover:file:bg-[#0a472d]"
                    />
                    <input
                      type="text"
                      value={aboutSection.imgTopRight || ''}
                      onChange={(e) => setAboutSection({ ...aboutSection, imgTopRight: e.target.value })}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-300"
                      placeholder="atau tempel URL foto..."
                    />
                  </div>
                </div>
              </div>

              {/* Foto 3: Kanan Bawah */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">3. Foto Kanan Bawah (Bottom Right Square)</label>
                <div className="flex items-center gap-3">
                  <img src={aboutSection.imgBottomRight} alt="Kanan Bawah" className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-xs" />
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, (url) => setAboutSection({ ...aboutSection, imgBottomRight: url }))}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0D5C3A] file:text-white hover:file:bg-[#0a472d]"
                    />
                    <input
                      type="text"
                      value={aboutSection.imgBottomRight || ''}
                      onChange={(e) => setAboutSection({ ...aboutSection, imgBottomRight: e.target.value })}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-300"
                      placeholder="atau tempel URL foto..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => handleGlobalSave()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0D5C3A] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0a472d] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Seksi Riset Publik</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: AKSES LAYANAN CEPAT */}
      {/* ============================================================ */}
      {subTab === 'services' && (
        <div className="bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#050505]">Akses Layanan Cepat</h3>
              <p className="text-xs text-[#707070]">Kelola daftar item tautan layanan cepat di bagian tengah Home Page.</p>
            </div>
            <button
              onClick={() => {
                setEditingService({
                  icon: 'CalendarCheck',
                  title: '',
                  desc: '',
                  path: '/reservasi'
                });
                setIsServiceModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#050505] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-black transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Layanan Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Seksi Layanan</label>
              <input
                type="text"
                value={servicesSection.title || ''}
                onChange={(e) => setServicesSection({ ...servicesSection, title: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle Seksi</label>
              <input
                type="text"
                value={servicesSection.subtitle || ''}
                onChange={(e) => setServicesSection({ ...servicesSection, subtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {(servicesSection.items || []).map((item: any, i: number) => (
              <div key={item.id || i} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#0D5C3A] bg-emerald-100 px-2 py-0.5 rounded">Icon: {item.icon}</span>
                  <h4 className="font-bold text-xs text-[#050505] mt-1.5">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{item.desc || item.path}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingService(item);
                      setIsServiceModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(item.id)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => handleGlobalSave()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0D5C3A] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0a472d] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Seksi Layanan Cepat</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 4: BANNER CTA (SIAP MENDAKI VIA PENCAR) */}
      {/* ============================================================ */}
      {subTab === 'cta' && (
        <div className="bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-[#050505]">Seksi Banner Penutup (Siap Mendaki Via Pencar)</h3>
            <p className="text-xs text-[#707070]">Kelola judul, deskripsi, dan tombol ajakan bertindak (CTA) di bagian penutup halaman utama.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Banner CTA</label>
                <input
                  type="text"
                  value={ctaSection.title || ''}
                  onChange={(e) => setCtaSection({ ...ctaSection, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D5C3A]"
                  placeholder="Contoh: Siap Mendaki Via Pencar?"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Keterangan</label>
                <textarea
                  rows={3}
                  value={ctaSection.desc || ''}
                  onChange={(e) => setCtaSection({ ...ctaSection, desc: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D5C3A]"
                  placeholder="Deskripsi singkat..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tombol Utama (Teks)</label>
                  <input
                    type="text"
                    value={ctaSection.primaryCtaText || ''}
                    onChange={(e) => setCtaSection({ ...ctaSection, primaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tombol Utama (Link Path)</label>
                  <input
                    type="text"
                    value={ctaSection.primaryCtaLink || ''}
                    onChange={(e) => setCtaSection({ ...ctaSection, primaryCtaLink: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tombol Sekunder (Teks)</label>
                  <input
                    type="text"
                    value={ctaSection.secondaryCtaText || ''}
                    onChange={(e) => setCtaSection({ ...ctaSection, secondaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tombol Sekunder (Link Path)</label>
                  <input
                    type="text"
                    value={ctaSection.secondaryCtaLink || ''}
                    onChange={(e) => setCtaSection({ ...ctaSection, secondaryCtaLink: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Background Image Upload */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                  Gambar Background Banner CTA (Optional Upload)
                </label>
                {ctaSection.bgImage && (
                  <div className="h-40 rounded-xl overflow-hidden bg-slate-900 mb-3 border border-slate-300">
                    <img src={ctaSection.bgImage} alt="Background" className="w-full h-full object-cover" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, (url) => setCtaSection({ ...ctaSection, bgImage: url }))}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0D5C3A] file:text-white hover:file:bg-[#0a472d]"
                />
              </div>

              <button
                onClick={() => handleGlobalSave()}
                disabled={saveMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0D5C3A] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#0a472d] transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan CTA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: HERO SLIDE EDIT/ADD MODAL */}
      {/* ============================================================ */}
      {isSlideModalOpen && editingSlide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#F4F0E8] w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#050505]">
                {editingSlide.id ? 'Edit Slide Banner' : 'Tambah Slide Banner Baru'}
              </h3>
              <button onClick={() => setIsSlideModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveSlide} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gambar Banner (Upload Local Storage)</label>
                {editingSlide.image && (
                  <div className="h-32 rounded-xl overflow-hidden mb-2 bg-slate-900 border border-slate-200">
                    <img src={editingSlide.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, (url) => setEditingSlide({ ...editingSlide, image: url }))}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0D5C3A] file:text-white"
                />
                <input
                  type="text"
                  value={editingSlide.image || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, image: e.target.value })}
                  className="w-full mt-1.5 px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                  placeholder="atau URL gambar..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Teks</label>
                <input
                  type="text"
                  value={editingSlide.badge || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  placeholder="Contoh: Portal Digital Resmi Basecamp Bogowonto"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Banner</label>
                <input
                  type="text"
                  required
                  value={editingSlide.title || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300"
                  placeholder="Contoh: Jelajahi Puncak Sumbing Via Pencar"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Banner</label>
                <textarea
                  rows={3}
                  value={editingSlide.desc || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, desc: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tombol 1 (Teks)</label>
                  <input
                    type="text"
                    value={editingSlide.ctaText || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, ctaText: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tombol 1 (Link)</label>
                  <input
                    type="text"
                    value={editingSlide.ctaLink || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, ctaLink: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tombol 2 (Teks)</label>
                  <input
                    type="text"
                    value={editingSlide.secCtaText || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, secCtaText: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tombol 2 (Link)</label>
                  <input
                    type="text"
                    value={editingSlide.secCtaLink || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, secCtaLink: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsSlideModalOpen(false)} className="px-4 py-2 text-xs text-slate-600">Batal</button>
                <button type="submit" className="px-5 py-2 bg-[#0D5C3A] text-white text-xs font-bold rounded-xl shadow-xs">Simpan Slide</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: SERVICE ITEM EDIT/ADD MODAL */}
      {/* ============================================================ */}
      {isServiceModalOpen && editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#F4F0E8] w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#050505]">
                {editingService.id ? 'Edit Item Layanan' : 'Tambah Item Layanan Baru'}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Icon Name (Lucide Icon)</label>
                <select
                  value={editingService.icon || 'CalendarCheck'}
                  onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                >
                  <option value="CalendarCheck">CalendarCheck (Reservasi)</option>
                  <option value="Compass">Compass (Peta & Rute)</option>
                  <option value="Tent">Tent (Sewa Peralatan)</option>
                  <option value="Shield">Shield (Porter & Guide)</option>
                  <option value="Trees">Trees (Homestay)</option>
                  <option value="MapPin">MapPin (UMKM)</option>
                  <option value="Users">Users (Komunitas)</option>
                  <option value="Mountain">Mountain (Gunung)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Layanan</label>
                <input
                  type="text"
                  required
                  value={editingService.title || ''}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300"
                  placeholder="Contoh: Reservasi Online"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={editingService.desc || ''}
                  onChange={(e) => setEditingService({ ...editingService, desc: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Link Path</label>
                <input
                  type="text"
                  required
                  value={editingService.path || ''}
                  onChange={(e) => setEditingService({ ...editingService, path: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  placeholder="Contoh: /reservasi"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 text-xs text-slate-600">Batal</button>
                <button type="submit" className="px-5 py-2 bg-[#0D5C3A] text-white text-xs font-bold rounded-xl shadow-xs">Simpan Layanan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
