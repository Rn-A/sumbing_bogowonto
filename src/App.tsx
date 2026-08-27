import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

// Layout
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './features/home/HomePage';
import ProfilePage from './features/profile/ProfilePage';
import HikingTrailMapApp from './components/trail/HikingTrailMapApp';
import KatalogPage from './features/katalog/KatalogPage';
import BeritaPage from './features/berita/BeritaPage';
import ReservasiPage from './features/reservasi/ReservasiPage';
import GaleriPage from './features/galeri/GaleriPage';
import KontakPage from './features/kontak/KontakPage';
import AdminDashboard from './features/admin/AdminDashboard';
import ErrorBoundary from './components/common/ErrorBoundary';
import { loginAdmin } from './services/api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const location = useLocation();

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('bc_admin_session') === 'true';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check for admin login URL trigger
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('portal') === 'admin') {
      setIsLoginModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Listen for global admin logout event from API interceptor
  useEffect(() => {
    const handleAuthError = () => {
      setIsAdminLoggedIn(false);
    };
    window.addEventListener('bc_admin_logout', handleAuthError);
    return () => window.removeEventListener('bc_admin_logout', handleAuthError);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const handleLoginSuccess = (token: string) => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('bc_admin_session', 'true');
    sessionStorage.setItem('bc_admin_token', token);
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('bc_admin_session');
    sessionStorage.removeItem('bc_admin_token');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError('Username dan password wajib diisi.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await loginAdmin({ username, password });
      if (res.success && res.token) {
        handleLoginSuccess(res.token);
        setIsLoginModalOpen(false);
        setUsername('');
        setPassword('');
      } else {
        setLoginError(res.error || 'Login gagal.');
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.error || 'Username atau Password salah!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#FAF8F5] font-sans selection:bg-[#0D5C3A] selection:text-white"
      id="basecamp-bogowonto-app"
    >
      {/* Global Navigation Header */}
      <Header
        isAdminLoggedIn={isAdminLoggedIn}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Content with Route Transitions */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/peta-jalur" element={<HikingTrailMapApp />} />
              <Route path="/katalog" element={<KatalogPage />} />
              <Route path="/berita" element={<BeritaPage />} />
              <Route path="/reservasi" element={<ReservasiPage />} />
              <Route path="/galeri" element={<GaleriPage />} />
              <Route path="/kontak" element={<KontakPage />} />

              {/* Admin route */}
              <Route
                path="/admin"
                element={
                  isAdminLoggedIn ? (
                    <ErrorBoundary fallbackTitle="Gagal Memuat Panel Admin">
                      <AdminDashboard />
                    </ErrorBoundary>
                  ) : (
                    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4 bg-[#FAF8F5]">
                      <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl p-8 sm:p-10 max-w-md w-full border border-[#e7e5e4] shadow-xl">
                        <div className="text-center mb-8">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0D5C3A] text-white flex items-center justify-center text-xl font-black mb-3 shadow-md">
                            ▲
                          </div>
                          <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-widest block mb-1">
                            BASECAMP BOGOWONTO
                          </span>
                          <h2 className="text-2xl font-black text-[#050505]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                            Console Admin Login
                          </h2>
                          <p className="text-xs text-[#707070] mt-1">
                            Masuk untuk mengelola tiket, konten berita, galeri, dan operasional jalur Sumbing Via Pencar.
                          </p>
                        </div>

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                          <div>
                            <label className="text-xs font-black text-[#050505] block mb-1.5">Username Admin</label>
                            <input 
                              type="text" 
                              required
                              placeholder="Masukkan username..." 
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#e7e5e4] rounded-2xl text-xs font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]" 
                            />
                          </div>

                          <div>
                            <label className="text-xs font-black text-[#050505] block mb-1.5">Password</label>
                            <input 
                              type="password" 
                              required
                              placeholder="••••••••" 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#e7e5e4] rounded-2xl text-xs font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]" 
                            />
                          </div>

                          {loginError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold text-center">
                              {loginError}
                            </div>
                          )}

                          <button 
                            type="submit" 
                            disabled={isLoggingIn}
                            className="w-full py-3.5 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            <span>Masuk ke Console Admin</span>
                          </button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-[#e7e5e4] text-center">
                          <p className="text-[11px] text-[#707070]">
                            Akun default: <code className="font-bold text-[#050505]">admin</code> / password: <code className="font-bold text-[#050505]">admin123</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
              />

              {/* 404 Fallback */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen pt-[var(--header-height)] flex items-center justify-center">
                    <div className="text-center">
                      <p className="font-display font-black text-6xl text-slate-200 dark:text-slate-800">404</p>
                      <p className="font-display font-bold text-lg text-slate-500 mt-2">Halaman Tidak Ditemukan</p>
                      <p className="text-sm text-slate-400 mt-1">Halaman yang Anda cari tidak tersedia.</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsLoginModalOpen(false)}>
          <div className="bg-[#FAF8F5] dark:bg-[#F4F0E8] rounded-3xl p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-xl text-[#050505] dark:text-[#050505] mb-2">Admin Login</h2>
            <p className="text-xs text-[#707070] mb-6">Masukkan kredensial admin untuk mengakses dashboard.</p>
            <form onSubmit={handleLoginSubmit}>
              <div className="space-y-3 mb-4">
                <input 
                  type="text" 
                  required
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F4F0E8] dark:bg-[#EBE7DF] border border-[#e7e5e4] dark:border-[#e7e5e4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/30" 
                />
                <input 
                  type="password" 
                  required
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F4F0E8] dark:bg-[#EBE7DF] border border-[#e7e5e4] dark:border-[#e7e5e4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/30" 
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-500 font-semibold mb-4 text-center">{loginError}</p>
              )}

              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full py-3 bg-[#0D5C3A] text-white text-xs font-bold rounded-xl hover:bg-[#0D5C3A] shadow-lg shadow-[#0D5C3A]/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isLoggingIn && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                Masuk
              </button>
            </form>
            <button onClick={() => setIsLoginModalOpen(false)} className="w-full py-2 text-xs text-slate-400 mt-3 hover:text-slate-650 text-center transition-colors">
              Batal
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
