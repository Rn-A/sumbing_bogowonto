import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAllPublicData, fetchWeather } from '../../services/api';
import AboutMuncakSection from './AboutMuncakSection';
import NewsPreviewSection from './NewsPreviewSection';
import { 
  Mountain, CloudSun, Users, Route, ArrowRight,
  CalendarCheck, Compass, Star, Newspaper, Image as ImageIcon,
  Shield, Trees, Tent, MapPin, Loader2, Sparkles, Quote,
  ChevronLeft, ChevronRight, Check, CornerDownRight
} from 'lucide-react';

const FEATURES = [
  { icon: CalendarCheck, title: 'Reservasi Online', desc: 'Booking pendakian cepat & mudah dengan sistem tiket QR digital.', path: '/reservasi' },
  { icon: Compass, title: 'Peta & Rute GPX', desc: 'Preview jalur interaktif Via Pencar, download file GPX untuk GPS.', path: '/profil' },
  { icon: Tent, title: 'Sewa Peralatan', desc: 'Perlengkapan camping & pendakian lengkap tersedia di basecamp.', path: '/katalog?tab=sewa' },
  { icon: Shield, title: 'Porter & Guide', desc: 'Tim berpengalaman siap menemani perjalanan Anda ke puncak.', path: '/katalog?tab=porter' },
  { icon: Trees, title: 'Homestay', desc: 'Penginapan nyaman di sekitar basecamp dengan harga terjangkau.', path: '/katalog?tab=homestay' },
  { icon: MapPin, title: 'UMKM Lokal', desc: 'Dukung ekonomi lokal dengan belanja produk khas daerah.', path: '/katalog?tab=umkm' },
];

const CAROUSEL_SLIDES = [
  {
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
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
    badge: 'Jalur Pendakian Via Pencar',
    title: 'Rute Panorama Terbaik ke Puncak',
    desc: 'Nikmati pemandangan kebun penduduk dan lereng sabana terbuka menawan sepanjang jalur Via Pencar. Unduh berkas GPX peta untuk navigasi GPS aman.',
    ctaText: 'Pelajari Rute',
    ctaLink: '/profil',
    secCtaText: 'Sewa Porter',
    secCtaLink: '/katalog?tab=porter'
  },
  {
    image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1920&q=80',
    badge: 'Peralatan & Akomodasi Bogowonto',
    title: 'Perlengkapan Lengkap & Homestay',
    desc: 'Basecamp Bogowonto menyediakan penyewaan tenda, sleeping bag, perlengkapan memasak portable, hingga penginapan homestay nyaman bagi pendaki.',
    ctaText: 'Katalog Penyewaan',
    ctaLink: '/katalog?tab=sewa',
    secCtaText: 'Cari Penginapan',
    secCtaLink: '/katalog?tab=homestay'
  }
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ['publicAllData'],
    queryFn: fetchAllPublicData,
  });

  const { data: weatherRes } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    refetchInterval: 300000,
  });

  const weatherData = weatherRes?.data || {
    display_text: '16°C Cerah Berawan',
    google_maps_url: 'https://maps.app.goo.gl/2Vi5RfHmJoBk1Uf26'
  };

  // Carousel auto-rotate effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const publicData = apiResponse?.data || {};
  const {
    articles = [],
    routes = [],
    reviews = [],
    bookingPackages = [],
    galleries = [],
    activeHikersCount = 0,
    settings = {}
  } = publicData;

  const openRoutesCount = routes.filter((r: any) => r.status === 'Buka').length;
  const isMountainOpen = openRoutesCount > 0;

  // 1. Hero Carousel Slides
  const heroSlides = (settings.home_hero_slides && Array.isArray(settings.home_hero_slides) && settings.home_hero_slides.length > 0)
    ? settings.home_hero_slides
    : CAROUSEL_SLIDES;

  const currentHero = heroSlides[currentSlide % heroSlides.length] || heroSlides[0];

  // 2. About Section
  const aboutData = settings.home_about_section || {
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

  // 3. Services / Layanan Cepat
  const servicesData = settings.home_services || {
    title: 'Layanan Basecamp Bogowonto',
    subtitle: 'Akses Layanan Cepat',
    desc: 'Silakan pilih salah satu tautan cepat layanan resmi di bawah untuk memulai.',
    items: FEATURES
  };

  // 4. CTA Banner
  const ctaBanner = settings.home_cta_banner || {
    title: 'Siap Mendaki Via Pencar?',
    desc: 'Lakukan reservasi sekarang dan dapatkan pengalaman mendaki Gunung Sumbing melalui jalur Pencar yang aman dan terorganisir.',
    bgImage: '',
    primaryCtaText: 'Mulai Booking',
    primaryCtaLink: '/reservasi',
    secondaryCtaText: 'Hubungi Kami',
    secondaryCtaLink: '/kontak'
  };

  const getServiceIcon = (iconName: any) => {
    if (typeof iconName === 'function') return iconName;
    const ICON_MAP: Record<string, any> = {
      CalendarCheck, Compass, Tent, Shield, Trees, MapPin, Sparkles, Mountain, Route, CloudSun, Users
    };
    return ICON_MAP[iconName] || CalendarCheck;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#FAF8F5] font-sans">
        <Loader2 className="w-10 h-10 text-[#0D5C3A] animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#707070] dark:text-[#707070] tracking-wider animate-pulse uppercase">
          Menyiapkan Portal Bogowonto...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#FAF8F5]">
      
      {/* ===== HERO SLIDER SECTION ===== */}
      <section className="relative h-screen w-full overflow-hidden bg-[#1a1a14]">
        
        {/* Background Images */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full"
            >
              <img 
                src={currentHero.image} 
                alt={currentHero.title || 'Gunung Sumbing Via Pencar'} 
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a14] via-[#1a1a14]/40 to-transparent" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content Slides */}
        <div className="container-app relative h-full z-10 flex items-center">
          <div className="max-w-3xl text-left text-white px-4 md:px-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.5 }}
              >
                {/* Badge */}
                {currentHero.badge && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-amber-300 text-xs font-bold mb-6">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentHero.badge}</span>
                  </div>
                )}

                {/* Heading */}
                <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white leading-tight mb-6">
                  {currentHero.title}
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-slate-350 max-w-2xl mb-10 leading-relaxed">
                  {currentHero.desc}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-4">
                  {currentHero.ctaText && (
                    <Link
                      to={currentHero.ctaLink || '/reservasi'}
                      className="group flex items-center gap-2 px-7 py-3.5 bg-[#0c0a09] hover:bg-[#0c0a09] text-[#2d3a2e] font-extrabold text-xs rounded-xl shadow-lg shadow-[#0c0a09]/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-wider"
                    >
                      <CalendarCheck className="w-4.5 h-4.5" />
                      {currentHero.ctaText}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                  {currentHero.secCtaText && (
                    <Link
                      to={currentHero.secCtaLink || '/profil'}
                      className="flex items-center gap-2 px-7 py-3.5 bg-transparent border border-white hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      <Compass className="w-4.5 h-4.5" />
                      {currentHero.secCtaText}
                    </Link>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Carousel controls (Arrows) */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 hover:bg-[#0D5C3A] text-white flex items-center justify-center border border-white/10 hover:border-transparent transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 hover:bg-[#0D5C3A] text-white flex items-center justify-center border border-white/10 hover:border-transparent transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
          {heroSlides.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentSlide % heroSlides.length === idx ? 'w-8 bg-[#0c0a09]' : 'w-2.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ===== STATUS WIDGET BAR ===== */}
      <section className="relative -mt-6 z-20">
        <div className="container-app">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FAF8F5] dark:bg-[#F4F0E8] rounded-2xl p-4 shadow-lg border border-[#e7e5e4] dark:border-[#e7e5e4] flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${isMountainOpen ? 'bg-[#0D5C3A]/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                <Mountain className={`w-5 h-5 ${isMountainOpen ? 'text-[#0D5C3A]' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#707070] dark:text-[#707070]">Status Gunung</p>
                <p className="text-sm font-bold text-[#050505] dark:text-[#050505]">{isMountainOpen ? 'BUKA' : 'TUTUP'}</p>
              </div>
            </motion.div>

            <motion.a
              href={weatherData.google_maps_url || "https://maps.app.goo.gl/2Vi5RfHmJoBk1Uf26"}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#FAF8F5] dark:bg-[#F4F0E8] rounded-2xl p-4 shadow-lg border border-[#e7e5e4] dark:border-[#e7e5e4] flex items-center gap-3 hover:scale-[1.02] transition-transform cursor-pointer group"
              title="Lihat cuaca lokasi Gunung Sumbing di Google Maps"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0c0a09]/10 flex items-center justify-center group-hover:bg-[#0D5C3A] transition-colors">
                <CloudSun className="w-5 h-5 text-[#0c0a09] group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#707070] dark:text-[#707070]">Cuaca Puncak</p>
                <p className="text-sm font-bold text-[#050505] dark:text-[#050505]">{weatherData.display_text || '16°C Cerah'}</p>
              </div>
            </motion.a>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#FAF8F5] dark:bg-[#F4F0E8] rounded-2xl p-4 shadow-lg border border-[#e7e5e4] dark:border-[#e7e5e4] flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#707070] dark:text-[#707070]">Pendaki Aktif</p>
                <p className="text-sm font-bold text-[#050505] dark:text-[#050505]">{activeHikersCount} Orang</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== TENTANG / RISET PUBLIK (MUNCAK SECTION) ===== */}
      <AboutMuncakSection 
        badge={aboutData.badge}
        title={aboutData.title}
        desc1={aboutData.paragraph1}
        desc2={aboutData.paragraph2}
        developerText={aboutData.devDesc}
        contactEmail={aboutData.contactValue}
        images={{
          tall: aboutData.imgLeft || 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
          topRight: aboutData.imgTopRight || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
          bottomRight: aboutData.imgBottomRight || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
        }}
      />

      {/* ===== FEATURES / LAYANAN ===== */}
      <section className="section-padding">
        <div className="container-app">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-[#0D5C3A] dark:text-[#0D5C3A] text-xs font-bold uppercase tracking-widest mb-2">{servicesData.subtitle || 'Akses Layanan Cepat'}</p>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-[#050505] dark:text-[#050505] mb-4">
                {servicesData.title || 'Layanan Basecamp Bogowonto'}
              </h2>
              <p className="text-[#292524] dark:text-[#292524] text-sm max-w-xl mx-auto">
                {servicesData.desc || 'Silakan pilih salah satu tautan cepat layanan resmi di bawah untuk memulai.'}
              </p>
            </motion.div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {(servicesData.items || FEATURES).map((feature: any, i: number) => {
              const Icon = getServiceIcon(feature.icon);
              return (
                <motion.div
                  key={feature.title || i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="w-[calc(50%-8px)] sm:w-44 lg:w-48"
                >
                  <Link
                    to={feature.path || '#'}
                    className="group block p-5 bg-[#FAF8F5] dark:bg-[#F4F0E8] rounded-2xl border border-[#e7e5e4] dark:border-[#e7e5e4] text-center shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-center items-center"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#0D5C3A]/40 flex items-center justify-center mb-3.5 mx-auto group-hover:bg-[#0D5C3A] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5 text-emerald-750 dark:text-[#0D5C3A] group-hover:text-white" />
                    </div>
                    <h3 className="font-display font-bold text-xs text-[#050505] dark:text-[#050505] leading-tight">
                      {feature.title}
                    </h3>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== POPULAR PACKAGES ===== */}
      {bookingPackages.length > 0 && (
        <section className="section-padding bg-[#F4F0E8]/50 dark:bg-[#F4F0E8]/50">
          <div className="container-app">
            <div className="text-center mb-12">
              <p className="text-[#0D5C3A] dark:text-[#0D5C3A] text-xs font-bold uppercase tracking-widest mb-2">Pilihan Paket</p>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-[#050505] dark:text-[#050505] mb-4">
                Paket Pendakian Populer
              </h2>
              <p className="text-[#292524] dark:text-[#292524] text-sm max-w-xl mx-auto">
                Pilih paket pendakian sesuai kebutuhan petualangan Anda di Gunung Sumbing Via Pencar.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bookingPackages.map((pkg: any, idx: number) => {
                const includes = typeof pkg.include === 'string' ? JSON.parse(pkg.include) : (pkg.include || []);
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-[#FAF8F5] dark:bg-[#F4F0E8] rounded-2xl border border-[#e7e5e4] dark:border-[#e7e5e4] overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex flex-col"
                  >
                    <div className="h-48 relative overflow-hidden bg-[#F4F0E8] dark:bg-[#EBE7DF] flex items-center justify-center">
                      {pkg.foto ? (
                        <img src={pkg.foto} alt={pkg.nama_paket} className="w-full h-full object-cover" />
                      ) : (
                        <Mountain className="w-12 h-12 text-[#d4c9a8] dark:text-[#4a4635]" />
                      )}
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#0D5C3A] text-white text-[9px] font-bold tracking-wider uppercase">
                        Via Pencar
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-display font-black text-sm text-[#050505] dark:text-[#050505] mb-2">{pkg.nama_paket}</h3>
                      <p className="text-xs text-[#292524] dark:text-[#292524] mb-4 line-clamp-3 leading-relaxed">{pkg.deskripsi}</p>
                      
                      <div className="space-y-1.5 mb-6 flex-1">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-[#707070]">Rincian Paket:</p>
                        {includes.slice(0, 3).map((inc: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-[#292524] dark:text-[#292524]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0D5C3A]" />
                            <span>{inc}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t border-[#e7e5e4] dark:border-[#e7e5e4] flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-[#707070] font-semibold uppercase">Tarif</p>
                          <p className="font-display font-black text-emerald-750 dark:text-[#0D5C3A] text-base">Rp {pkg.harga_per_orang.toLocaleString()}</p>
                        </div>
                        <Link to="/reservasi" className="px-4 py-2 bg-[#0c0a09] hover:bg-[#0c0a09] text-[#2d3a2e] text-xs font-black rounded-lg shadow-sm hover:scale-102 transition-all">
                          Daftar Sekarang
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}


      {/* ===== TESTIMONIAL / REVIEWS ===== */}
      {reviews.length > 0 && (
        <section className="section-padding bg-[#F4F0E8]/50 dark:bg-[#F4F0E8]/50">
          <div className="container-app">
            <div className="text-center mb-12">
              <p className="text-[#0D5C3A] dark:text-[#0D5C3A] text-xs font-bold uppercase tracking-widest mb-2">Inspirasi Pendaki</p>
              <h2 className="font-display font-black text-3xl text-[#050505] dark:text-[#050505]">
                Kisah & Cerita Pendaki
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {reviews.map((rev: any, idx: number) => (
                <motion.div
                  key={rev.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-[#FAF8F5] dark:bg-[#F4F0E8] border border-[#e7e5e4] dark:border-[#e7e5e4] rounded-2xl p-6 shadow-sm relative"
                >
                  <Quote className="absolute top-6 right-6 w-8 h-8 text-[#0D5C3A]/10" />
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#0c0a09] text-[#0c0a09]" />
                    ))}
                  </div>
                  <p className="text-xs text-[#292524] dark:text-[#292524] leading-relaxed mb-6 italic">
                    "{rev.komentar}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D5C3A] to-[#0c0a09] flex items-center justify-center text-white font-black text-xs">
                      {rev.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#050505] dark:text-[#050505]">{rev.nama}</p>
                      <p className="text-[10px] text-[#707070]">Pendaki Bogowonto • {new Date().getFullYear()}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== GALLERY HIGHLIGHT ===== */}
      {galleries.length > 0 && (
        <section className="section-padding">
          <div className="container-app">
            <div className="text-center mb-12">
              <p className="text-[#0D5C3A] dark:text-[#0D5C3A] text-xs font-bold uppercase tracking-widest mb-2">Lensa Bogowonto</p>
              <h2 className="font-display font-black text-3xl text-[#050505] dark:text-[#050505] mb-4">
                Dokumentasi Kegiatan Basecamp
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleries.slice(0, 4).map((gal: any, idx: number) => (
                <motion.div
                  key={gal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="group relative aspect-square bg-[#F4F0E8] dark:bg-[#EBE7DF] rounded-2xl overflow-hidden shadow-sm border border-[#e7e5e4] dark:border-[#e7e5e4]"
                >
                  <img src={gal.url_media} alt={gal.judul} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div>
                      <p className="text-white text-xs font-bold">{gal.judul}</p>
                      <p className="text-white/70 text-[9px] mt-0.5">{gal.deskripsi}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA SECTION ===== */}
      <section className="section-padding bg-[#FAF8F5] dark:bg-[#FAF8F5] border-t border-[#e7e5e4] dark:border-[#e7e5e4] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#0D5C3A]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#0c0a09]/10 rounded-full blur-3xl" />
        
        <div className="container-app relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#050505] dark:text-[#050505] mb-4">
              {ctaBanner.title || 'Siap Mendaki Via Pencar?'}
            </h2>
            <p className="text-[#292524] dark:text-[#292524] text-sm max-w-lg mx-auto mb-8">
              {ctaBanner.desc || 'Lakukan reservasi sekarang dan dapatkan pengalaman mendaki Gunung Sumbing melalui jalur Pencar yang aman dan terorganisir.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to={ctaBanner.primaryCtaLink || '/reservasi'}
                className="group flex items-center gap-2 px-7 py-3.5 bg-[#0c0a09] hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#0c0a09]/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-wider"
              >
                <CalendarCheck className="w-4.5 h-4.5" />
                {ctaBanner.primaryCtaText || 'Mulai Booking'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              {ctaBanner.secondaryCtaText && (
                <Link
                  to={ctaBanner.secondaryCtaLink || '/kontak'}
                  className="flex items-center gap-2 px-7 py-3.5 bg-transparent border border-[#050505] dark:border-[#f5f0e0] text-[#050505] dark:text-[#050505] hover:bg-[#050505] hover:text-white dark:hover:bg-[#f5f0e0] dark:hover:text-[#1a1a14] font-bold text-xs rounded-xl transition-all"
                >
                  {ctaBanner.secondaryCtaText}
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== BERITA & PENGUMUMAN (NEWS PREVIEW SECTION BELOW CTA) ===== */}
      <NewsPreviewSection articles={articles} />
    </div>
  );
}
