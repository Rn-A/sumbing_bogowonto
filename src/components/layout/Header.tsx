import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mountain, Menu, X, Sun, Moon, ChevronDown,
  Home, User, ShoppingBag, Newspaper, CalendarCheck, 
  Image, Phone, Mail, LayoutDashboard, LogOut
} from 'lucide-react';
import logoBc from '../../assets/logo_bc.png';

interface HeaderProps {
  isAdminLoggedIn: boolean;
  onLogout: () => void;
  onOpenLogin: () => void;
}

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/profil', label: 'Profile', icon: User },
  { path: '/katalog', label: 'Katalog', icon: ShoppingBag },
  { path: '/berita', label: 'Berita', icon: Newspaper },
  { path: '/reservasi', label: 'Reservasi', icon: CalendarCheck },
  { path: '/galeri', label: 'Galeri', icon: Image },
  { path: '/kontak', label: 'Kontak', icon: Phone },
];

export default function Header({ isAdminLoggedIn, onLogout, onOpenLogin }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bc_theme') === 'dark';
    }
    return false;
  });
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle scroll state for transparent -> solid header
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('bc_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const isHomePage = location.pathname === '/';
  const headerBg = isScrolled || !isHomePage
    ? 'bg-[#FAF8F5]/95 dark:bg-[#FAF8F5]/95 backdrop-blur-xl shadow-md border-b border-[#e7e5e4]/50 dark:border-[#e7e5e4]/50'
    : 'bg-transparent';

  const textColor = isScrolled || !isHomePage
    ? 'text-[#050505] dark:text-[#050505]'
    : 'text-white';

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        {/* Top Contact Bar */}
        <div className="bg-[#FAF8F5] text-[#292524] text-[11px] py-2 border-b border-[#e7e5e4] hidden md:block">
          <div className="container-app flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#0c0a09]" />
                basecampbogowonto@gmail.com
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#0c0a09]" />
                @sumbing_viapencar
              </span>
            </div>
            <div className="font-display font-black tracking-widest uppercase text-[9px] bg-[#0c0a09] text-[#FAF8F5] px-2.5 py-0.5 rounded">
              Basecamp Resmi Bogowonto
            </div>
          </div>
        </div>

        <header
          className={`w-full transition-all duration-300 ${headerBg}`}
          style={{ height: 'var(--header-height)' }}
        >
          <div className="container-app h-full flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] p-1 flex items-center justify-center shadow-md border border-[#e7e5e4] group-hover:shadow-lg transition-all overflow-hidden">
                <img src={logoBc} alt="Logo Basecamp Bogowonto" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className={`font-display font-extrabold text-sm tracking-tight ${textColor} transition-colors`}>
                  Bogowonto
                </span>
                <span className={`text-[10px] font-semibold tracking-widest uppercase ${isScrolled || !isHomePage ? 'text-[#0D5C3A] dark:text-[#0D5C3A]' : 'text-[#0D5C3A]'} transition-colors`}>
                  Sumbing Via Pencar
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center h-full gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `px-3 h-full flex items-center text-[13px] font-bold border-b-2 transition-all duration-200 ${
                      isActive
                        ? 'border-[#0c0a09] text-[#0D5C3A] dark:text-[#0D5C3A]'
                        : `border-transparent ${textColor} hover:text-[#0D5C3A] dark:hover:text-[#0D5C3A]`
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {/* Admin link */}
              {isAdminLoggedIn && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-3 h-full flex items-center text-[13px] font-bold border-b-2 transition-all duration-200 ${
                      isActive
                        ? 'border-[#0c0a09] text-amber-600 dark:text-[#0c0a09]'
                        : `border-transparent ${textColor} hover:text-[#0c0a09]`
                    }`
                  }
                >
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Admin
                  </span>
                </NavLink>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                isScrolled || !isHomePage 
                  ? 'hover:bg-[#F4F0E8] dark:hover:bg-[#EBE7DF] text-[#292524] dark:text-[#292524]' 
                  : 'hover:bg-white/10 text-white/80'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* CTA Booking */}
            <Link
              to="/reservasi"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0D5C3A] to-[#0D5C3A] text-white text-[13px] font-bold rounded-lg shadow-lg shadow-[#0D5C3A]/25 hover:shadow-[#0D5C3A]/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <CalendarCheck className="w-4 h-4" />
              Booking
            </Link>

            {/* Admin logout */}
            {isAdminLoggedIn && (
              <button
                onClick={onLogout}
                className="hidden lg:flex w-9 h-9 rounded-lg items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Logout Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                isScrolled || !isHomePage 
                  ? 'hover:bg-[#F4F0E8] dark:hover:bg-[#EBE7DF] text-[#050505] dark:text-[#050505]' 
                  : 'hover:bg-white/10 text-white'
              }`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-[#FAF8F5] dark:bg-[#FAF8F5] z-50 lg:hidden shadow-2xl flex flex-col"
            >
              {/* Mobile header */}
              <div className="flex items-center justify-between p-4 border-b border-[#e7e5e4] dark:border-[#e7e5e4]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-sm border border-[#e7e5e4] overflow-hidden">
                    <img src={logoBc} alt="Logo Basecamp Bogowonto" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-display font-extrabold text-sm text-[#050505] dark:text-[#050505]">
                    Bogowonto
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F4F0E8] dark:hover:bg-[#EBE7DF] text-[#292524] transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Mobile nav links */}
              <div className="flex-1 overflow-y-auto p-3">
                {NAV_ITEMS.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-[#0D5C3A]/50 text-[#0D5C3A] dark:text-[#0D5C3A]'
                              : 'text-[#292524] dark:text-[#292524] hover:bg-[#F4F0E8] dark:hover:bg-[#EBE7DF] hover:text-[#050505] dark:hover:text-[#f5f0e0]'
                          }`
                        }
                      >
                        <Icon className="w-4.5 h-4.5" />
                        {item.label}
                      </NavLink>
                    </motion.div>
                  );
                })}

                {isAdminLoggedIn && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: NAV_ITEMS.length * 0.05 }}
                  >
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${
                          isActive
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-[#0c0a09]'
                            : 'text-[#292524] dark:text-[#292524] hover:bg-[#F4F0E8] dark:hover:bg-[#EBE7DF]'
                        }`
                      }
                    >
                      <LayoutDashboard className="w-4.5 h-4.5" />
                      Dashboard Admin
                    </NavLink>
                  </motion.div>
                )}
              </div>

              {/* Mobile CTA */}
              <div className="p-4 border-t border-[#e7e5e4] dark:border-[#e7e5e4]">
                <Link
                  to="/reservasi"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#0D5C3A] to-[#0D5C3A] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#0D5C3A]/25 hover:shadow-[#0D5C3A]/40 transition-all"
                >
                  <CalendarCheck className="w-4 h-4" />
                  Booking Sekarang
                </Link>
                {isAdminLoggedIn && (
                  <button
                    onClick={onLogout}
                    className="flex items-center justify-center gap-2 w-full py-3 mt-2 text-red-500 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout Admin
                  </button>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
