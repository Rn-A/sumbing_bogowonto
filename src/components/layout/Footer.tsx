import { Link, useLocation } from 'react-router-dom';
import { 
  Mountain, MapPin, Phone, Mail, Clock,
  Facebook, Instagram, Youtube, Twitter,
  ChevronRight, Heart
} from 'lucide-react';

const QUICK_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/profil', label: 'Profile Basecamp' },
  { path: '/katalog', label: 'Katalog & Paket' },
  { path: '/berita', label: 'Berita Terbaru' },
  { path: '/reservasi', label: 'Reservasi Online' },
  { path: '/galeri', label: 'Galeri Foto' },
];

const SERVICES = [
  { label: 'Paket Pendakian', path: '/katalog?tab=paket' },
  { label: 'Sewa Peralatan', path: '/katalog?tab=sewa' },
  { label: 'Homestay', path: '/katalog?tab=homestay' },
  { label: 'Porter & Guide', path: '/katalog?tab=porter' },
  { label: 'UMKM Lokal', path: '/katalog?tab=umkm' },
  { label: 'Merchandise', path: '/katalog?tab=merchandise' },
];

const SOCIAL_LINKS = [
  { icon: Instagram, href: 'https://www.instagram.com/sumbing_viapencar', label: 'Instagram' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Youtube, href: '#', label: 'Youtube' },
  { icon: Twitter, href: '#', label: 'Twitter' },
];

export default function Footer() {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-[#0c0a09] dark:bg-[#0c0a09] text-slate-300 border-t border-[#262626] relative overflow-hidden">
      {/* Mountain silhouette decoration */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0D5C3A] via-emerald-500 to-[#0D5C3A]" />
      
      {/* Main Footer Content */}
      <div className="container-app section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          
          {/* Column 1: Brand & Description */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D5C3A] to-emerald-700 flex items-center justify-center shadow-lg group-hover:shadow-emerald-900/50 transition-shadow">
                <Mountain className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display font-extrabold text-white text-sm">
                  Bogowonto
                </span>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-emerald-400">
                  Sumbing Via Pencar
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 mb-6">
              Portal digital resmi Basecamp Bogowonto — Pendakian Gunung Sumbing Via Pencar. 
              Informasi jalur, registrasi, galeri, dan layanan pendukung pendakian Anda.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-[#0D5C3A] hover:border-transparent flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200"
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-display font-bold text-white text-sm mb-5 flex items-center gap-2">
              <div className="w-1 h-5 bg-[#0D5C3A] rounded-full" />
              Menu Navigasi
            </h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Layanan */}
          <div>
            <h4 className="font-display font-bold text-white text-sm mb-5 flex items-center gap-2">
              <div className="w-1 h-5 bg-[#0D5C3A] rounded-full" />
              Layanan Kami
            </h4>
            <ul className="space-y-2.5">
              {SERVICES.map((service) => (
                <li key={service.label}>
                  <Link
                    to={service.path}
                    className="text-sm text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Kontak */}
          <div>
            <h4 className="font-display font-bold text-white text-sm mb-5 flex items-center gap-2">
              <div className="w-1 h-5 bg-[#0D5C3A] rounded-full" />
              Hubungi Kami
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                </div>
                <a 
                  href="https://maps.app.goo.gl/6LkFqT31VEttVeym6" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-slate-300 hover:text-emerald-400 transition-colors leading-relaxed"
                >
                  Pencar Atas, Kwadungan, Kec. Kalikajar, Kab. Wonosobo, Jawa Tengah 56372
                </a>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Instagram className="w-4 h-4 text-emerald-400" />
                </div>
                <a href="https://www.instagram.com/sumbing_viapencar" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-300 hover:text-emerald-400 transition-colors">
                  @sumbing_viapencar
                </a>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-emerald-400" />
                </div>
                <a href="mailto:basecampbogowonto@gmail.com" className="text-sm text-slate-300 hover:text-emerald-400 transition-colors">
                  basecampbogowonto@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-sm text-slate-300">
                  Registrasi: 08:00 – 04:00 WIB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#1f1f1f] bg-[#050505] dark:bg-[#050505]">
        <div className="container-app py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            © {currentYear} Basecamp Bogowonto — Sumbing Via Pencar. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for Indonesian Hikers
          </p>
        </div>
      </div>
    </footer>
  );
}
