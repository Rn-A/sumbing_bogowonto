import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchAllPublicData, createBooking, getBookingByCode, fetchMidtransClientKey, fetchPaymentStatus, simulatePayment } from '../../services/api';
import { 
  CalendarCheck, Route as RouteIcon, Users, CreditCard, QrCode, 
  ArrowRight, ArrowLeft, Check, Loader2, Sparkles, 
  Calendar, MapPin, Printer, ShieldCheck, Search, Info,
  AlertCircle, Phone, Mail, User, CheckCircle2, ChevronRight,
  Share2, Download, Copy, ExternalLink, HelpCircle, X, Clock,
  Smartphone, Building2
} from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Jalur & Tanggal', desc: 'Rute, tanggal & paket' },
  { num: 2, label: 'Data Pendaki', desc: 'Identitas rombongan' },
  { num: 3, label: 'Pembayaran', desc: 'Pilihan bayar & tiket' },
];

const DEFAULT_ROUTE_NAME = 'Gunung Sumbing Via Pencar';
const DEFAULT_SIMAKSI_PRICE = 35000;

export default function ReservasiPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'check' ? 'check' : 'booking';
  const initialCode = searchParams.get('code') || '';

  const [activeTab, setActiveTab] = useState<'booking' | 'check'>(initialMode);
  const [currentStep, setCurrentStep] = useState(1);

  // Load Midtrans Snap.js script dynamically
  useEffect(() => {
    fetchMidtransClientKey().then((res) => {
      if (res.success && res.data?.client_key) {
        const scriptId = 'midtrans-snap-script';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = res.data.snap_url || 'https://app.sandbox.midtrans.com/snap/snap.js';
          script.setAttribute('data-client-key', res.data.client_key);
          document.body.appendChild(script);
        }
      }
    }).catch(console.error);
  }, []);

  // Form Booking State
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const [tanggalNaik, setTanggalNaik] = useState(todayStr);
  const [tanggalTurun, setTanggalTurun] = useState(tomorrowStr);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [hikerCount, setHikerCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'VA_BCA' | 'VA_BRI' | 'VA_MANDIRI' | 'CASH'>('CASH');
  const [catatan, setCatatan] = useState('');
  const [agreedSOP, setAgreedSOP] = useState(false);

  // Members state (Index 0 is Ketua Rombongan)
  const [members, setMembers] = useState<any[]>([
    { nama_lengkap: '', nik: '', jenis_kelamin: 'L', umur: '22', no_hp: '', email: '', alamat: '' },
  ]);

  // Ticket Checker & Result State
  const [searchCode, setSearchCode] = useState(initialCode);
  const [searchedBooking, setSearchedBooking] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Payment Modal & QRIS / VA State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentBooking, setActivePaymentBooking] = useState<any>(null);
  const [paymentModalTab, setPaymentModalTab] = useState<'qris' | 'va' | 'cash'>('cash');
  const [selectedVaBank, setSelectedVaBank] = useState<'BCA' | 'BRI' | 'MANDIRI'>('BCA');
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [vaCopied, setVaCopied] = useState(false);

  // Load public data
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ['publicAllData'],
    queryFn: fetchAllPublicData,
    retry: 1,
  });

  const routes = apiResponse?.data?.routes || [];
  const bookingPackages = apiResponse?.data?.bookingPackages || [];

  // Set default route & package when loaded
  useEffect(() => {
    if (routes.length > 0 && !selectedRouteId) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  useEffect(() => {
    if (bookingPackages.length > 0 && !selectedPackageId) {
      setSelectedPackageId(bookingPackages[0].id);
    }
  }, [bookingPackages, selectedPackageId]);

  // Auto trigger search if query param provided
  useEffect(() => {
    if (initialCode && initialMode === 'check') {
      lookupBooking(initialCode);
    }
  }, [initialCode]);

  const activeRoute = routes.find((r: any) => r.id === selectedRouteId) || {
    nama_jalur: DEFAULT_ROUTE_NAME,
    total_jarak_km: 7.2,
    estimasi_jam: 7,
    elevasi_start: 1537,
    elevasi_puncak: 3371,
    status: 'Buka',
  };

  const activePackage = bookingPackages.find((p: any) => p.id === selectedPackageId) || {
    id: 'default-simaksi',
    nama_paket: 'Tiket SIMAKSI Standar Via Pencar',
    harga_per_orang: DEFAULT_SIMAKSI_PRICE,
    durasi_hari: 2,
    deskripsi: 'Izin masuk resmi pendakian Sumbing Via Pencar + Asuransi Jasa Raharja + Sampah Bag',
  };

  const unitPrice = activePackage.harga_per_orang || DEFAULT_SIMAKSI_PRICE;
  const simaksiPortion = 25000 * hikerCount;
  const asuransiPortion = 5000 * hikerCount;
  const fasilitasPortion = 5000 * hikerCount;
  const grandTotal = unitPrice * hikerCount;

  // Handle number of hikers change
  const handleHikerCountChange = (count: number) => {
    const validCount = Math.max(1, Math.min(20, count));
    setHikerCount(validCount);
    const newMembers = [...members];
    if (validCount > members.length) {
      for (let i = members.length; i < validCount; i++) {
        newMembers.push({ 
          nama_lengkap: '', 
          nik: '', 
          jenis_kelamin: 'L', 
          umur: '20', 
          no_hp: members[0].no_hp || '', 
          email: '', 
          alamat: '' 
        });
      }
    } else if (validCount < members.length) {
      newMembers.splice(validCount);
    }
    setMembers(newMembers);
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  // Step 1 Validation -> Step 2
  const handleProceedToStep2 = () => {
    if (!tanggalNaik || !tanggalTurun) {
      alert('Silakan pilih tanggal naik dan tanggal turun pendakian!');
      return;
    }
    if (new Date(tanggalTurun) < new Date(tanggalNaik)) {
      alert('Tanggal turun tidak boleh lebih awal dari tanggal naik!');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  // Step 2 Validation -> Step 3
  const handleProceedToStep3 = () => {
    const ketua = members[0];
    if (!ketua.nama_lengkap.trim() || !ketua.nik.trim() || !ketua.no_hp.trim()) {
      alert('Data Ketua Rombongan (Nama Lengkap, NIK, No. WhatsApp) wajib diisi lengkap!');
      return;
    }
    if (ketua.nik.length < 15) {
      alert('NIK Ketua Rombongan harus berupa 16 digit nomor identitas KTP/SIM valid!');
      return;
    }
    for (let i = 1; i < members.length; i++) {
      if (!members[i].nama_lengkap.trim() || !members[i].nik.trim()) {
        alert(`Data Anggota #${i + 1} (${members[i].nama_lengkap || 'Belum diisi'}) belum lengkap!`);
        return;
      }
    }
    if (!agreedSOP) {
      alert('Anda wajib menyetujui SOP dan Peraturan Keselamatan Basecamp Bogowonto!');
      return;
    }
    setCurrentStep(3);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  // Helper to trigger Midtrans Snap popup
  const openMidtransSnap = (snapToken: string, kodeBooking: string) => {
    if (typeof (window as any).snap !== 'undefined') {
      (window as any).snap.pay(snapToken, {
        onSuccess: (_result: any) => {
          lookupBooking(kodeBooking);
          setActiveTab('check');
          window.scrollTo({ top: 150, behavior: 'smooth' });
        },
        onPending: (_result: any) => {
          lookupBooking(kodeBooking);
          setActiveTab('check');
          window.scrollTo({ top: 150, behavior: 'smooth' });
        },
        onError: (_err: any) => {
          alert('Pembayaran gagal atau dibatalkan. Anda dapat mencoba kembali lewat menu Cek E-Tiket.');
          lookupBooking(kodeBooking);
          setActiveTab('check');
        },
        onClose: () => {
          lookupBooking(kodeBooking);
          setActiveTab('check');
        },
      });
    } else {
      lookupBooking(kodeBooking);
      setActiveTab('check');
    }
  };

  const handleOpenPaymentModal = (booking: any) => {
    setActivePaymentBooking(booking);
    const method = booking.payment?.metode || paymentMethod;
    if (method === 'CASH') {
      setPaymentModalTab('cash');
    } else if (method.startsWith('VA')) {
      setPaymentModalTab('va');
      if (method.includes('BRI')) setSelectedVaBank('BRI');
      else if (method.includes('MANDIRI')) setSelectedVaBank('MANDIRI');
      else setSelectedVaBank('BCA');
    } else {
      setPaymentModalTab('qris');
    }
    setPaymentModalOpen(true);
  };

  const handleSimulatePaymentConfirm = async () => {
    if (!activePaymentBooking) return;
    setIsSimulatingPayment(true);
    try {
      const res = await simulatePayment(activePaymentBooking.id);
      if (res.success && res.data) {
        setSearchedBooking(res.data);
        setPaymentModalOpen(false);
        alert('🎉 Pembayaran berhasil dikonfirmasi! E-Tiket SIMAKSI resmi dengan Kode QR telah diterbitkan.');
      }
    } catch (err: any) {
      alert('Gagal mengonfirmasi pembayaran: ' + (err.response?.data?.error || 'Terjadi kesalahan'));
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  // Booking Mutation
  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (res) => {
      const bookingData = res.data;
      setSearchedBooking(bookingData);
      setActiveTab('check');
      window.scrollTo({ top: 150, behavior: 'smooth' });

      if (res.snap_token && !res.snap_token.startsWith('LOCAL-SIM') && typeof (window as any).snap !== 'undefined') {
        openMidtransSnap(res.snap_token, bookingData.kode_booking);
      } else {
        handleOpenPaymentModal(bookingData);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Gagal memproses reservasi. Silakan coba lagi.');
    },
  });

  const handleBookingSubmit = () => {
    bookingMutation.mutate({
      package_id: selectedPackageId || activePackage.id,
      nama_ketua: members[0].nama_lengkap,
      email: members[0].email || `${members[0].no_hp.replace(/\D/g, '')}@pendaki.muncak.id`,
      no_hp: members[0].no_hp,
      alamat: members[0].alamat || 'Indonesia',
      tanggal_naik: tanggalNaik,
      tanggal_turun: tanggalTurun,
      catatan,
      members,
      payment_method: paymentMethod,
      total_harga: grandTotal.toString(),
    });
  };

  // Ticket Search
  const lookupBooking = async (code: string) => {
    if (!code.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchedBooking(null);
    try {
      const res = await getBookingByCode(code.trim());
      if (res.success && res.data) {
        setSearchedBooking(res.data);
      } else {
        setSearchError('Data reservasi tidak ditemukan. Pastikan Kode Booking atau No. WhatsApp sudah benar.');
      }
    } catch (err: any) {
      setSearchError(err.response?.data?.error || 'Data tiket tidak ditemukan.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTicketSearch = (e: React.FormEvent) => {
    e.preventDefault();
    lookupBooking(searchCode);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareWhatsApp = (b: any) => {
    const naikDate = new Date(b.tanggal_naik).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const text = `*E-TIKET PENDAKIAN GUNUNG SUMBING VIA PENCAR*%0A` +
      `Basecamp BOGOWONTO%0A%0A` +
      `*Kode Booking:* ${b.kode_booking}%0A` +
      `*Ketua Rombongan:* ${b.nama_ketua}%0A` +
      `*Jumlah Peserta:* ${b.jumlah_peserta} Orang%0A` +
      `*Tanggal Naik:* ${naikDate}%0A` +
      `*Status:* LUNAS / SIAP CHECK-IN%0A%0A` +
      `Tunjukkan pesan atau QR Code tiket saat tiba di loket registrasi Basecamp Bogowonto.`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen pt-[var(--header-height)] bg-[#FAF8F5] dark:bg-[#FAF8F5]">
      
      {/* Top Banner Hero */}
      <section className="relative py-14 bg-gradient-to-b from-[#181812] via-[#23231a] to-[#181812] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0D5C3A_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="container-app relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-amber-300 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistem Tiket Digital Resmi Basecamp Bogowonto</span>
          </div>

          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 tracking-tight"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            Reservasi SIMAKSI Sumbing Via Pencar
          </h1>
          
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed mb-8">
            Daftarkan rombongan pendakian Anda secara online untuk proses check-in cepat, asuransi keselamatan resmi Jasa Raharja, dan validasi kuota harian.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg">
            <button 
              onClick={() => { setActiveTab('booking'); setSearchedBooking(null); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'booking' 
                  ? 'bg-white text-[#050505] shadow-md' 
                  : 'text-white hover:text-amber-200'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-[#0D5C3A]" />
              <span>Daftar / Booking Tiket</span>
            </button>
            <button 
              onClick={() => setActiveTab('check')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'check' 
                  ? 'bg-white text-[#050505] shadow-md' 
                  : 'text-white hover:text-amber-200'
              }`}
            >
              <Search className="w-4 h-4 text-[#0D5C3A]" />
              <span>Cek & Cetak E-Tiket</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="section-padding">
        <div className="container-app max-w-6xl">

          {/* ============================================================ */}
          {/* TAB 1: BOOKING WIZARD FLOW */}
          {/* ============================================================ */}
          {activeTab === 'booking' && (
            <div>
              {/* Step Progress Tracker */}
              <div className="max-w-3xl mx-auto mb-10">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
                  {STEPS.map((step) => {
                    const isPassed = currentStep > step.num;
                    const isCurrent = currentStep === step.num;
                    return (
                      <div 
                        key={step.num}
                        onClick={() => {
                          if (step.num < currentStep) setCurrentStep(step.num);
                        }}
                        className={`flex flex-col sm:flex-row items-center sm:items-start gap-2.5 p-3 rounded-2xl border transition-all text-center sm:text-left ${
                          isCurrent
                            ? 'bg-white dark:bg-[#F4F0E8] border-[#0D5C3A] shadow-md ring-2 ring-[#0D5C3A]/20'
                            : isPassed
                              ? 'bg-emerald-50/70 border-emerald-200 cursor-pointer'
                              : 'bg-white/40 dark:bg-[#FAF8F5] border-[#e7e5e4] opacity-60'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          isCurrent
                            ? 'bg-[#0D5C3A] text-white shadow-sm'
                            : isPassed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isPassed ? <Check className="w-4 h-4" /> : step.num}
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#050505] leading-tight">{step.label}</p>
                          <p className="text-[10px] text-[#707070] hidden sm:block mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Two Column Form + Sticky Summary Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Active Step Form */}
                <div className="lg:col-span-8 bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] p-6 sm:p-8 shadow-sm">
                  
                  {/* ===== STEP 1: JALUR, TANGGAL & PAKET ===== */}
                  {currentStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div>
                        <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Langkah 1 dari 3</span>
                        <h2 className="text-xl sm:text-2xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                          Pilih Jalur & Jadwal Pendakian
                        </h2>
                        <p className="text-xs text-[#707070] mt-1">
                          Tentukan tanggal pendakian, rute, dan jumlah anggota kelompok Anda.
                        </p>
                      </div>

                      {/* Route Selection Card (Fixed exclusively for Basecamp Bogowonto Sumbing Via Pencar) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#e7e5e4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-[#0D5C3A] text-white flex items-center justify-center font-bold shadow-xs">
                            <RouteIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Basecamp Resmi Terdaftar</span>
                            <h4 className="font-black text-sm sm:text-base text-[#050505]">Basecamp BOGOWONTO — Sumbing Via Pencar</h4>
                            <p className="text-[11px] text-[#707070] mt-0.5">Pencar Atas, Kwadungan, Kalikajar, Wonosobo &bull; 1.537 mdpl - 3.371 mdpl</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="px-3 py-1 bg-emerald-100 text-[#0D5C3A] text-xs font-black rounded-full">
                            ✓ Jalur Buka & Aktif
                          </span>
                        </div>
                      </div>

                      {/* Package Option */}
                      <div>
                        <label className="text-xs font-black text-[#050505] block mb-2">Pilihan Paket Registrasi</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div 
                            onClick={() => setSelectedPackageId(activePackage.id)}
                            className="p-4 rounded-2xl border-2 border-[#0D5C3A] bg-emerald-50/50 cursor-pointer relative shadow-2xs"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-[#0D5C3A]">{activePackage.nama_paket}</span>
                              <CheckCircle2 className="w-4 h-4 text-[#0D5C3A]" />
                            </div>
                            <p className="text-lg font-black text-[#050505]">
                              Rp {unitPrice.toLocaleString('id-ID')}
                              <span className="text-xs font-semibold text-[#707070]"> / orang</span>
                            </p>
                            <p className="text-[11px] text-[#707070] mt-1.5 leading-relaxed">
                              {activePackage.deskripsi}
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl border border-[#e7e5e4] bg-[#FAF8F5] opacity-75">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-[#707070]">Paket Porter & Guide Tambahan</span>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Di Basecamp</span>
                            </div>
                            <p className="text-xs text-[#707070] leading-relaxed">
                              Dapat dipesan langsung saat tiba di Basecamp Bogowonto atau hubungi kontak hotline kami.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Date Pickers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-black text-[#050505] block mb-1.5">Tanggal Naik (Check-In)</label>
                          <div className="relative">
                            <Calendar className="w-4 h-4 text-[#0D5C3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                              type="date" 
                              min={todayStr}
                              value={tanggalNaik}
                              onChange={(e) => {
                                setTanggalNaik(e.target.value);
                                if (e.target.value > tanggalTurun) {
                                  setTanggalTurun(e.target.value);
                                }
                              }}
                              className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-black text-[#050505] block mb-1.5">Tanggal Turun (Check-Out)</label>
                          <div className="relative">
                            <Calendar className="w-4 h-4 text-[#0D5C3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                              type="date" 
                              min={tanggalNaik || todayStr}
                              value={tanggalTurun}
                              onChange={(e) => setTanggalTurun(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Number of Hikers Counter */}
                      <div>
                        <label className="text-xs font-black text-[#050505] block mb-2">Jumlah Peserta Rombongan</label>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#e7e5e4]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleHikerCountChange(hikerCount - 1)}
                              disabled={hikerCount <= 1}
                              className="w-10 h-10 rounded-xl bg-white border border-[#e7e5e4] font-black text-lg text-[#050505] hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-12 text-center text-lg font-black text-[#050505]">
                              {hikerCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleHikerCountChange(hikerCount + 1)}
                              disabled={hikerCount >= 20}
                              className="w-10 h-10 rounded-xl bg-white border border-[#e7e5e4] font-black text-lg text-[#050505] hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-xs text-[#707070]">
                            <p className="font-bold text-[#050505]">{hikerCount} Orang Pendaki</p>
                            <p className="text-[11px]">1 Ketua Rombongan {hikerCount > 1 ? `+ ${hikerCount - 1} Anggota` : ''}</p>
                          </div>
                        </div>
                      </div>

                      {/* Next Button */}
                      <div className="pt-4 border-t border-[#e7e5e4] flex justify-end">
                        <button
                          type="button"
                          onClick={handleProceedToStep2}
                          className="px-6 py-3.5 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
                        >
                          <span>Lanjut: Isi Data Pendaki</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ===== STEP 2: DATA PENDAKI & IDENTITAS ===== */}
                  {currentStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Langkah 2 dari 3</span>
                          <h2 className="text-xl sm:text-2xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                            Data Identitas Rombongan
                          </h2>
                          <p className="text-xs text-[#707070] mt-1">
                            Isi data identitas resmi sesuai KTP/SIM untuk keperluan SIMAKSI dan asuransi.
                          </p>
                        </div>
                      </div>

                      {/* Ketua Rombongan Form */}
                      <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-black text-[#0D5C3A] uppercase tracking-wider">
                          <User className="w-4 h-4" />
                          <span>Ketua Rombongan / Penanggung Jawab</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold text-[#050505] block mb-1">Nama Lengkap Ketua *</label>
                            <input
                              type="text"
                              required
                              placeholder="Nama sesuai KTP"
                              value={members[0].nama_lengkap}
                              onChange={(e) => handleMemberChange(0, 'nama_lengkap', e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#e7e5e4] rounded-xl text-xs font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-[#050505] block mb-1">Nomor NIK / KTP (16 Digit) *</label>
                            <input
                              type="text"
                              required
                              maxLength={16}
                              placeholder="330xxxxxxxxxxxxx"
                              value={members[0].nik}
                              onChange={(e) => handleMemberChange(0, 'nik', e.target.value.replace(/\D/g, ''))}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#e7e5e4] rounded-xl text-xs font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-[#050505] block mb-1">Nomor WhatsApp Aktif *</label>
                            <input
                              type="tel"
                              required
                              placeholder="08xxxxxxxxxx"
                              value={members[0].no_hp}
                              onChange={(e) => handleMemberChange(0, 'no_hp', e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#e7e5e4] rounded-xl text-xs font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-[#050505] block mb-1">Email (Untuk Bukti Tiket)</label>
                            <input
                              type="email"
                              placeholder="email@domain.com"
                              value={members[0].email}
                              onChange={(e) => handleMemberChange(0, 'email', e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#e7e5e4] rounded-xl text-xs font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Anggota Rombongan List (if count > 1) */}
                      {hikerCount > 1 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-[#050505] uppercase tracking-wider">
                            Data Anggota Rombongan ({hikerCount - 1} Orang)
                          </h4>

                          {members.slice(1).map((member, idx) => {
                            const actualIndex = idx + 1;
                            return (
                              <div key={actualIndex} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#e7e5e4] space-y-3">
                                <span className="text-[11px] font-black text-[#707070]">Anggota #{actualIndex}</span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-[10px] font-bold text-[#707070] block mb-1">Nama Lengkap *</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="Nama anggota"
                                      value={member.nama_lengkap}
                                      onChange={(e) => handleMemberChange(actualIndex, 'nama_lengkap', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-[#e7e5e4] rounded-xl text-xs font-bold text-[#050505]"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-[#707070] block mb-1">NIK / KTP *</label>
                                    <input
                                      type="text"
                                      required
                                      maxLength={16}
                                      placeholder="NIK 16 digit"
                                      value={member.nik}
                                      onChange={(e) => handleMemberChange(actualIndex, 'nik', e.target.value.replace(/\D/g, ''))}
                                      className="w-full px-3 py-2 bg-white border border-[#e7e5e4] rounded-xl text-xs font-bold text-[#050505]"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-[#707070] block mb-1">Jenis Kelamin</label>
                                    <select
                                      value={member.jenis_kelamin}
                                      onChange={(e) => handleMemberChange(actualIndex, 'jenis_kelamin', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-[#e7e5e4] rounded-xl text-xs font-bold text-[#050505]"
                                    >
                                      <option value="L">Laki-laki</option>
                                      <option value="P">Perempuan</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Safety & SOP Checkbox */}
                      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={agreedSOP}
                            onChange={(e) => setAgreedSOP(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded text-[#0D5C3A] focus:ring-[#0D5C3A]"
                          />
                          <span className="text-[11px] text-amber-950 font-medium leading-relaxed">
                            Saya menyatakan bahwa seluruh data yang dimasukkan adalah benar, rombongan dalam kondisi fisik sehat, mematuhi prinsip <em>Leave No Trace</em> (membawa turun sampah), dan siap mentaati peraturan SOP Basecamp Bogowonto Sumbing Via Pencar.
                          </span>
                        </label>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-[#e7e5e4] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="px-4 py-3 text-xs font-bold text-[#050505] hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Kembali</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleProceedToStep3}
                          className="px-6 py-3.5 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
                        >
                          <span>Lanjut: Pembayaran</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ===== STEP 3: METODE PEMBAYARAN & KONFIRMASI ===== */}
                  {currentStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div>
                        <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Langkah 3 dari 3</span>
                        <h2 className="text-xl sm:text-2xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                          Pilih Metode Pembayaran & Terbitkan Tiket
                        </h2>
                        <p className="text-xs text-[#707070] mt-1">
                          Pilih cara pembayaran yang paling nyaman untuk rombongan Anda.
                        </p>
                      </div>

                      {/* Payment Options */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-[#050505] block">Metode Pembayaran:</label>
                          <span className="text-[10px] font-bold text-[#0D5C3A] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Bayar di Tempat (Loket)
                          </span>
                        </div>

                        {/* ONLINE PAYMENT METHODS (QRIS & VA) - PRESERVED & TEMPORARILY DISABLED */}
                        {false && (
                          <>
                            {/* QRIS Option */}
                            <div 
                              onClick={() => setPaymentMethod('QRIS')}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                                paymentMethod === 'QRIS'
                                  ? 'border-[#0D5C3A] bg-emerald-50/50 shadow-2xs'
                                  : 'border-[#e7e5e4] bg-[#FAF8F5]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-[#e7e5e4] flex items-center justify-center font-black text-xs text-[#050505]">
                                  QRIS
                                </div>
                                <div>
                                  <p className="text-xs font-black text-[#050505]">QRIS Instan (Semua Bank & E-Wallet)</p>
                                  <p className="text-[10px] text-[#707070]">BCA, BRI, Mandiri, GoPay, OVO, ShopeePay, DANA</p>
                                </div>
                              </div>
                              <input type="radio" checked={paymentMethod === 'QRIS'} readOnly className="text-[#0D5C3A]" />
                            </div>

                            {/* Virtual Account Options */}
                            <div 
                              onClick={() => setPaymentMethod('VA_BCA')}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                                paymentMethod === 'VA_BCA'
                                  ? 'border-[#0D5C3A] bg-emerald-50/50 shadow-2xs'
                                  : 'border-[#e7e5e4] bg-[#FAF8F5]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs">
                                  BCA
                                </div>
                                <div>
                                  <p className="text-xs font-black text-[#050505]">Virtual Account BCA</p>
                                  <p className="text-[10px] text-[#707070]">Verifikasi otomatis 24 jam</p>
                                </div>
                              </div>
                              <input type="radio" checked={paymentMethod === 'VA_BCA'} readOnly className="text-[#0D5C3A]" />
                            </div>
                          </>
                        )}

                        {/* Cash on Basecamp Option (Active On-Site Payment) */}
                        <div 
                          onClick={() => setPaymentMethod('CASH')}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            paymentMethod === 'CASH'
                              ? 'border-[#0D5C3A] bg-emerald-50/50 shadow-2xs ring-1 ring-[#0D5C3A]/20'
                              : 'border-[#e7e5e4] bg-[#FAF8F5]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300/60 flex items-center justify-center font-black text-xs">
                              LOKET
                            </div>
                            <div>
                              <p className="text-xs font-black text-[#050505]">Bayar di Tempat (Tunai / Loket Basecamp)</p>
                              <p className="text-[10px] text-[#707070]">Tunjukkan kode booking saat check-in di pos registrasi Basecamp Bogowonto</p>
                            </div>
                          </div>
                          <input type="radio" checked={paymentMethod === 'CASH'} readOnly className="text-[#0D5C3A] w-4 h-4 accent-[#0D5C3A]" />
                        </div>

                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <span>Saat ini reservasi melayani metode <strong>Bayar di Tempat (Loket Basecamp)</strong> saat pendaki tiba untuk registrasi dan verifikasi identitas.</span>
                        </div>
                      </div>

                      {/* Notes / Catatan Tambahan */}
                      <div>
                        <label className="text-xs font-bold text-[#050505] block mb-1">Catatan Tambahan (Opsional):</label>
                        <textarea
                          rows={2}
                          placeholder="Contoh: Titip logistik di basecamp, estimasi tiba pukul 20.00 WIB, dsb."
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-[#e7e5e4] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          disabled={bookingMutation.isPending}
                          className="px-4 py-3 text-xs font-bold text-[#050505] hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Kembali</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleBookingSubmit}
                          disabled={bookingMutation.isPending}
                          className="px-8 py-4 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                        >
                          {bookingMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Menerbitkan E-Tiket...</span>
                            </>
                          ) : (
                            <>
                              <QrCode className="w-4 h-4" />
                              <span>Konfirmasi & Terbitkan Tiket</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                </div>

                {/* Right Side: Sticky Order Breakdown Summary */}
                <div className="lg:col-span-4 sticky top-28 space-y-4">
                  <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] p-6 shadow-sm">
                    <h3 className="text-sm font-black text-[#050505] uppercase tracking-wider mb-4 pb-3 border-b border-[#e7e5e4]">
                      Ringkasan Reservasi
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#707070]">Jalur Pendakian</span>
                        <span className="font-bold text-[#050505] text-right">Via Pencar</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#707070]">Tanggal Naik</span>
                        <span className="font-bold text-[#050505]">{tanggalNaik || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#707070]">Tanggal Turun</span>
                        <span className="font-bold text-[#050505]">{tanggalTurun || '-'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#707070]">Jumlah Peserta</span>
                        <span className="font-bold text-[#050505]">{hikerCount} Orang</span>
                      </div>

                      {/* Detailed Fee Breakdown */}
                      <div className="pt-3 border-t border-dashed border-[#e7e5e4] space-y-1.5 text-[11px] text-[#707070]">
                        <div className="flex justify-between">
                          <span>SIMAKSI ({hikerCount}x Rp 25.000)</span>
                          <span className="font-semibold text-[#050505]">Rp {simaksiPortion.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Asuransi Jasa Raharja ({hikerCount}x Rp 5.000)</span>
                          <span className="font-semibold text-[#050505]">Rp {asuransiPortion.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fasilitas Basecamp & Trash Bag</span>
                          <span className="font-semibold text-[#050505]">Rp {fasilitasPortion.toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div className="pt-4 border-t border-[#e7e5e4] flex items-baseline justify-between">
                        <span className="font-black text-xs text-[#050505]">Total Pembayaran</span>
                        <span className="font-black text-xl text-[#0D5C3A]">
                          Rp {grandTotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 p-3 rounded-xl bg-emerald-50 text-[#0D5C3A] text-[10px] font-bold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Tiket digital resmi terdaftar di sistem basecamp</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: TICKET CHECKER & DIGITAL E-TICKET RESULT */}
          {/* ============================================================ */}
          {activeTab === 'check' && (
            <div className="max-w-3xl mx-auto space-y-8">
              
              {/* Search Box */}
              <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] p-6 shadow-sm">
                <h3 className="text-base font-black text-[#050505] mb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  Cari & Cetak E-Tiket Pendakian
                </h3>
                <p className="text-xs text-[#707070] mb-4">
                  Masukkan <strong>Kode Booking</strong> (contoh: <code>SMB-849201</code>) atau <strong>Nomor WhatsApp</strong> ketua rombongan.
                </p>

                <form onSubmit={handleTicketSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#707070] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Masukkan kode booking / nomor WA..."
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#e7e5e4] rounded-2xl text-xs sm:text-sm font-bold text-[#050505] uppercase focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-6 py-3 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-2xl uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 shrink-0"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Cari Tiket</span>
                  </button>
                </form>

                {searchError && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{searchError}</span>
                  </div>
                )}
              </div>

              {/* Searched Booking Digital Boarding Pass Ticket View */}
              {searchedBooking && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Pending Payment Alert Banner */}
                  {searchedBooking.status !== 'Paid' && (
                    <div className="no-print p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#050505]">Menunggu Pembayaran di Loket ({searchedBooking.status})</p>
                          <p className="text-[11px] text-[#707070]">Silakan selesaikan pembayaran tunai di loket registrasi Basecamp Bogowonto saat tiba.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenPaymentModal(searchedBooking)}
                        className="px-5 py-2.5 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Petunjuk Pembayaran Loket</span>
                      </button>
                    </div>
                  )}

                  {/* Action Bar (Print, Share, Copy) - Hidden on Print */}
                  <div className="no-print flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#F4F0E8] border border-[#e7e5e4] shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-black text-[#0D5C3A] uppercase tracking-wide">Karcis & E-Tiket Siap Digunakan</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(searchedBooking.kode_booking)}
                        className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#e7e5e4] text-xs font-bold text-[#050505] hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Disalin' : 'Salin Kode'}</span>
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(searchedBooking)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0D5C3A] hover:bg-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="px-5 py-2.5 rounded-xl bg-[#050505] text-white text-xs font-black hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Cetak Struk / Karcis</span>
                      </button>
                    </div>
                  </div>

                  {/* ===== 1. ON-SCREEN MODERN DIGITAL TICKET CARD (HIDDEN ON PRINT) ===== */}
                  <div className="no-print bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] overflow-hidden shadow-md">
                    
                    {/* Header Card */}
                    <div className="p-6 sm:p-8 bg-gradient-to-br from-[#0c0a09] via-[#1c1917] to-[#0c0a09] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block mb-1">
                          BASECAMP BOGOWONTO &bull; VIA PENCAR
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                          E-Tiket SIMAKSI Gunung Sumbing
                        </h2>
                        <p className="text-xs text-slate-300 mt-0.5">Izin Masuk Resmi & Asuransi Pendakian</p>
                      </div>

                      <div className="text-left sm:text-right bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15">
                        <span className="text-[10px] font-bold text-slate-300 uppercase block">Kode Booking</span>
                        <span className="text-lg font-black text-amber-300 font-mono tracking-wider">{searchedBooking.kode_booking}</span>
                      </div>
                    </div>

                    {/* Details & QR Code Grid */}
                    <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                      
                      {/* Left: Hiker and Date Details */}
                      <div className="md:col-span-8 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 border-b border-[#e7e5e4] text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-[#707070] uppercase block mb-0.5">Ketua Rombongan</span>
                            <span className="font-black text-[#050505]">{searchedBooking.nama_ketua}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#707070] uppercase block mb-0.5">No. WhatsApp</span>
                            <span className="font-bold text-[#050505]">{searchedBooking.no_hp}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#707070] uppercase block mb-0.5">Jumlah Peserta</span>
                            <span className="font-black text-[#0D5C3A]">{searchedBooking.jumlah_peserta} Orang</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-[#e7e5e4] text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-[#707070] uppercase block mb-0.5">Tanggal Naik</span>
                            <span className="font-bold text-[#050505]">
                              {new Date(searchedBooking.tanggal_naik).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#707070] uppercase block mb-0.5">Tanggal Turun</span>
                            <span className="font-bold text-[#050505]">
                              {new Date(searchedBooking.tanggal_turun).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#707070] uppercase block mb-0.5">Waktu Check-In</span>
                            <span className="font-bold text-blue-700">
                              {searchedBooking.ticket?.checked_in_at 
                                ? new Date(searchedBooking.ticket.checked_in_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
                                : <span className="text-slate-400 font-normal italic">Belum Check-In</span>}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#707070] uppercase block mb-0.5">Waktu Check-Out</span>
                            <span className="font-bold text-slate-700">
                              {searchedBooking.ticket?.checked_out_at 
                                ? new Date(searchedBooking.ticket.checked_out_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
                                : <span className="text-slate-400 font-normal italic">Belum Check-Out</span>}
                            </span>
                          </div>
                        </div>

                        {/* Members List */}
                        <div>
                          <span className="text-[10px] font-black text-[#707070] uppercase tracking-wider block mb-2">
                            Daftar Anggota Rombongan:
                          </span>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {searchedBooking.members?.map((m: any, idx: number) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#e7e5e4] text-xs flex justify-between items-center">
                                <span className="font-bold text-[#050505]">{idx + 1}. {m.nama_lengkap} {m.is_ketua ? '(Ketua)' : ''}</span>
                                <span className="text-[11px] text-[#707070] font-mono">NIK: {m.nik || '-'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: QR Code */}
                      <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#e7e5e4] text-center">
                        <div className="w-40 h-40 bg-white p-2.5 rounded-2xl shadow-sm border border-[#e7e5e4] mb-3 flex items-center justify-center">
                          <img
                            src={searchedBooking.ticket?.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${searchedBooking.kode_booking}`}
                            alt={`QR Code Tiket ${searchedBooking.kode_booking}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Scan di Loket Basecamp</span>
                        <p className="text-[10px] text-[#707070] mt-0.5">Tunjukkan QR ini saat verifikasi fisik</p>
                      </div>

                    </div>

                    {/* Footer Card */}
                    <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#e7e5e4] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#707070]">
                      <span>Basecamp Bogowonto Sumbing Via Pencar &bull; Kwadungan, Kalikajar, Wonosobo</span>
                      <span className="font-semibold text-[#050505]">Hotline / WA Basecamp: 0852-2821-6677</span>
                    </div>

                  </div>

                  {/* ===== 2. PRINT-ONLY AUTHENTIC THERMAL RECEIPT / KARCIS FISIK ===== */}
                  <div className="print-only">
                    <div 
                      id="printable-receipt"
                      className="w-[380px] bg-white text-black p-6 font-mono border border-dashed border-black"
                    >
                      {/* Header Basecamp */}
                      <div className="text-center pb-3 border-b border-dashed border-black">
                        <h3 className="font-black text-sm uppercase tracking-tight text-black">
                          BASECAMP BOGOWONTO
                        </h3>
                        <p className="text-xs font-bold text-black">
                          GUNUNG SUMBING VIA PENCAR
                        </p>
                        <p className="text-[10px] text-black">
                          Pencar Atas, Kwadungan, Kalikajar, Wonosobo
                        </p>
                        <p className="text-[10px] font-bold text-black">
                          Hotline WA: 0852-2821-6677
                        </p>
                      </div>

                      {/* Title & Status */}
                      <div className="py-2.5 text-center border-b border-dashed border-black space-y-1">
                        <span className="text-[11px] font-black tracking-wider uppercase text-black block">
                          BUKTI REGISTRASI & KARCIS RESMI
                        </span>
                        <span className="text-[10px] font-black text-black block">
                          [ STATUS: LUNAS / SIAP NAIK ]
                        </span>
                      </div>

                      {/* Meta Information */}
                      <div className="py-2.5 text-[10px] space-y-1 border-b border-dashed border-black">
                        <div className="flex justify-between">
                          <span>No. Karcis</span>
                          <span className="font-bold">{searchedBooking.ticket?.kode_tiket || `TKT-${searchedBooking.kode_booking}`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kode Booking</span>
                          <span className="font-black tracking-wider">{searchedBooking.kode_booking}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tgl Registrasi</span>
                          <span>
                            {new Date(searchedBooking.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Schedule & Leader Info */}
                      <div className="py-2.5 text-[10px] space-y-1 border-b border-dashed border-black">
                        <div className="flex justify-between">
                          <span>Rute Jalur</span>
                          <span className="font-bold">Via Pencar (1.537 - 3.371 m)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tgl Naik</span>
                          <span className="font-bold">
                            {new Date(searchedBooking.tanggal_naik).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tgl Turun</span>
                          <span className="font-bold">
                            {new Date(searchedBooking.tanggal_turun).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {searchedBooking.ticket?.checked_in_at && (
                          <div className="flex justify-between text-[#000]">
                            <span>Waktu Check-In</span>
                            <span className="font-bold">
                              {new Date(searchedBooking.ticket.checked_in_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          </div>
                        )}
                        {searchedBooking.ticket?.checked_out_at && (
                          <div className="flex justify-between text-[#000]">
                            <span>Waktu Check-Out</span>
                            <span className="font-bold">
                              {new Date(searchedBooking.ticket.checked_out_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Ketua Rombongan</span>
                          <span className="font-black uppercase">{searchedBooking.nama_ketua}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>No. WhatsApp</span>
                          <span>{searchedBooking.no_hp}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Peserta</span>
                          <span className="font-black">{searchedBooking.jumlah_peserta} Orang</span>
                        </div>
                      </div>

                      {/* Member List */}
                      <div className="py-2.5 text-[10px] border-b border-dashed border-black space-y-1">
                        <span className="font-black block uppercase">
                          DAFTAR ANGGOTA:
                        </span>
                        {searchedBooking.members?.map((m: any, idx: number) => (
                          <div key={idx} className="flex justify-between py-0.5">
                            <span className="font-bold">
                              {idx + 1}. {m.nama_lengkap} {m.is_ketua ? '(K)' : ''}
                            </span>
                            <span className="font-mono">
                              {m.nik || '-'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Fee Breakdown Receipt */}
                      <div className="py-2.5 text-[10px] space-y-1 border-b border-dashed border-black">
                        <span className="font-black block uppercase">
                          RINCIAN PEMBAYARAN:
                        </span>
                        <div className="flex justify-between">
                          <span>- SIMAKSI ({searchedBooking.jumlah_peserta}x @25rb)</span>
                          <span>Rp {(25000 * (searchedBooking.jumlah_peserta || 1)).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>- Asuransi ({searchedBooking.jumlah_peserta}x @5rb)</span>
                          <span>Rp {(5000 * (searchedBooking.jumlah_peserta || 1)).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>- Fasilitas & Sampah Bag</span>
                          <span>Rp {(5000 * (searchedBooking.jumlah_peserta || 1)).toLocaleString('id-ID')}</span>
                        </div>
                        
                        <div className="pt-1.5 border-t border-dashed border-black flex justify-between font-black text-xs">
                          <span>TOTAL BAYAR</span>
                          <span>Rp {(searchedBooking.total_harga || (35000 * (searchedBooking.jumlah_peserta || 1))).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span>Metode Bayar</span>
                          <span className="font-bold">{searchedBooking.payment?.metode || 'QRIS'} (LUNAS)</span>
                        </div>
                      </div>

                      {/* QR Code Section */}
                      <div className="py-3 text-center border-b border-dashed border-black flex flex-col items-center">
                        <div className="w-32 h-32 bg-white p-1 border border-black mb-1 flex items-center justify-center">
                          <img
                            src={searchedBooking.ticket?.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${searchedBooking.kode_booking}`}
                            alt={`QR Code Karcis ${searchedBooking.kode_booking}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-[9px] font-black tracking-widest uppercase">
                          [ SCAN DI POS BASECAMP ]
                        </span>
                        <span className="text-[8px] font-mono">
                          {searchedBooking.kode_booking}
                        </span>
                      </div>

                      {/* SOP Instructions */}
                      <div className="pt-2.5 text-[8.5px] leading-tight space-y-0.5">
                        <p className="font-black uppercase">KETENTUAN WAJIB:</p>
                        <p>1. Tunjukkan struk ini di Loket Basecamp Bogowonto.</p>
                        <p>2. Wajib membawa turun kembali seluruh sampah logistik.</p>
                        <p>3. Wajib lapor check-out di pos saat selesai turun.</p>
                      </div>

                      {/* Footer Receipt */}
                      <div className="pt-3 text-center">
                        <p className="text-[9px] font-black tracking-widest">
                          *** TERIMA KASIH & SALAM LESTARI ***
                        </p>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          )}

        </div>
      </section>

      {/* ============================================================ */}
      {/* MODAL PEMBAYARAN INTERAKTIF: QRIS & VIRTUAL ACCOUNT */}
      {/* ============================================================ */}
      <AnimatePresence>
        {paymentModalOpen && activePaymentBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] max-w-lg w-full overflow-hidden shadow-2xl my-8"
            >
              {/* Header Modal */}
              <div className="p-5 bg-gradient-to-r from-[#0c0a09] via-[#1c1917] to-[#0c0a09] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                      Pembayaran Tiket SIMAKSI
                    </h3>
                    <p className="text-[10px] text-slate-300">Basecamp Bogowonto &bull; Via Pencar</p>
                  </div>
                </div>

                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Amount & Order Bar */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-amber-800 uppercase block">Total Tagihan</span>
                  <span className="text-lg font-black text-[#0D5C3A]">
                    Rp {(activePaymentBooking.total_harga || 35000).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#707070] uppercase block">Kode Booking</span>
                  <span className="text-xs font-black font-mono text-[#050505]">{activePaymentBooking.kode_booking}</span>
                </div>
              </div>

              {/* Tab Switcher: QRIS vs VA vs Cash (QRIS & VA temporarily commented out) */}
              <div className="p-3 bg-[#FAF8F5] border-b border-[#e7e5e4]">
                {/* 
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  <button
                    onClick={() => setPaymentModalTab('qris')}
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentModalTab === 'qris'
                        ? 'bg-[#0D5C3A] text-white shadow-xs'
                        : 'bg-white text-[#707070] hover:text-[#050505]'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan QRIS</span>
                  </button>

                  <button
                    onClick={() => setPaymentModalTab('va')}
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentModalTab === 'va'
                        ? 'bg-[#0D5C3A] text-white shadow-xs'
                        : 'bg-white text-[#707070] hover:text-[#050505]'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Virtual Account</span>
                  </button>

                  <button
                    onClick={() => setPaymentModalTab('cash')}
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentModalTab === 'cash'
                        ? 'bg-[#0D5C3A] text-white shadow-xs'
                        : 'bg-white text-[#707070] hover:text-[#050505]'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Tunai (Loket)</span>
                  </button>
                </div>
                */}
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#0D5C3A]" />
                    <span className="text-xs font-black text-[#050505]">Metode Pembayaran: Bayar di Tempat (Loket Basecamp)</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Aktif
                  </span>
                </div>
              </div>

              {/* Tab Body */}
              <div className="p-6 space-y-6">
                
                {/* ONLINE TABS (QRIS & VA) - PRESERVED & TEMPORARILY DISABLED */}
                {false && (
                  <>
                    {/* 1. QRIS TAB */}
                    {paymentModalTab === 'qris' && (
                      <div className="space-y-4 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-[10px] font-black uppercase">
                          <span>QRIS RESMI &bull; Bebas Biaya Admin</span>
                        </div>

                        {/* QR Code Container */}
                        <div className="w-56 h-56 mx-auto bg-white p-3 rounded-2xl border-2 border-[#0D5C3A] shadow-md flex flex-col items-center justify-center relative">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226580016ID.CO.QRIS.WWW01189360091430000000000215000350005802ID5917BASECAMP BOGOWONTO6008WONOSOBO6304${activePaymentBooking.kode_booking}`}
                            alt="QRIS Code"
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="text-[#707070] text-xs">
                          <p className="font-bold text-[#050505]">Mendukung Semua m-Banking & E-Wallet:</p>
                          <p className="text-[11px] mt-1">BCA Mobile, BRImo, Livin' Mandiri, BNI, GoPay, OVO, DANA, ShopeePay, LinkAja</p>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-semibold flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Batas Waktu Bayar: <strong>14:59 WIB</strong></span>
                        </div>

                        <button
                          onClick={handleSimulatePaymentConfirm}
                          disabled={isSimulatingPayment}
                          className="w-full py-3 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                        >
                          {isSimulatingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          <span>Konfirmasi / Simulasikan Pembayaran QRIS</span>
                        </button>
                      </div>
                    )}

                    {/* 2. VIRTUAL ACCOUNT TAB */}
                    {paymentModalTab === 'va' && (
                      <div className="space-y-4">
                        <label className="text-xs font-black text-[#050505] block">Pilih Bank Virtual Account:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'BCA', label: 'BCA VA' },
                            { id: 'BRI', label: 'BRI VA' },
                            { id: 'MANDIRI', label: 'Mandiri VA' },
                          ].map((bank) => (
                            <button
                              key={bank.id}
                              onClick={() => setSelectedVaBank(bank.id as any)}
                              className={`p-3 rounded-xl border-2 text-xs font-black transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                selectedVaBank === bank.id
                                  ? 'border-[#0D5C3A] bg-emerald-50 text-[#0D5C3A]'
                                  : 'border-[#e7e5e4] bg-[#FAF8F5] text-[#707070]'
                              }`}
                            >
                              <span>{bank.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* VA Number Display */}
                        <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#e7e5e4] space-y-2">
                          <span className="text-[10px] font-bold text-[#707070] uppercase block">Nomor Virtual Account {selectedVaBank}</span>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-black font-mono text-[#050505] tracking-wider">
                              {selectedVaBank === 'BCA' && `88001${activePaymentBooking.kode_booking.replace(/\D/g, '')}`}
                              {selectedVaBank === 'BRI' && `12800${activePaymentBooking.kode_booking.replace(/\D/g, '')}`}
                              {selectedVaBank === 'MANDIRI' && `89008${activePaymentBooking.kode_booking.replace(/\D/g, '')}`}
                            </span>

                            <button
                              onClick={() => {
                                const num = selectedVaBank === 'BCA' ? `88001${activePaymentBooking.kode_booking.replace(/\D/g, '')}` : selectedVaBank === 'BRI' ? `12800${activePaymentBooking.kode_booking.replace(/\D/g, '')}` : `89008${activePaymentBooking.kode_booking.replace(/\D/g, '')}`;
                                navigator.clipboard.writeText(num);
                                setVaCopied(true);
                                setTimeout(() => setVaCopied(false), 2000);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#0D5C3A] text-white text-xs font-bold hover:bg-[#064e3b] transition-all flex items-center gap-1 cursor-pointer"
                            >
                              {vaCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{vaCopied ? 'Tersalin' : 'Salin'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Step-by-step instructions */}
                        <div className="text-xs text-[#707070] space-y-1 bg-[#FAF8F5] p-3 rounded-xl border border-[#e7e5e4]">
                          <p className="font-bold text-[#050505]">Cara Bayar via m-Banking:</p>
                          <p>1. Buka m-Banking {selectedVaBank} ➔ Pilih Transfer ➔ Virtual Account.</p>
                          <p>2. Tempelkan nomor VA di atas ➔ Tekan Lanjut.</p>
                          <p>3. Konfirmasi nominal <strong>Rp {(activePaymentBooking.total_harga || 35000).toLocaleString('id-ID')}</strong> ➔ Masukkan PIN.</p>
                        </div>

                        <button
                          onClick={handleSimulatePaymentConfirm}
                          disabled={isSimulatingPayment}
                          className="w-full py-3 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                        >
                          {isSimulatingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          <span>Konfirmasi / Simulasikan Transfer VA</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* 3. CASH TAB (ACTIVE ON-SITE PAYMENT) */}
                <div className="space-y-4 text-center">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-2.5">
                    <p className="font-black text-sm text-[#050505]">Petunjuk Pembayaran di Loket Basecamp:</p>
                    <p>1. Tunjukkan Kode Booking <strong className="font-mono text-emerald-800 font-black">{activePaymentBooking.kode_booking}</strong> saat tiba di Pos Registrasi Basecamp Bogowonto Pencar.</p>
                    <p>2. Lakukan pembayaran tunai sebesar <strong className="text-[#0D5C3A] font-black text-sm">Rp {(activePaymentBooking.total_harga || 35000).toLocaleString('id-ID')}</strong> kepada petugas loket.</p>
                    <p>3. Petugas loket akan melakukan scan/verifikasi kode booking untuk mengaktifkan status E-Tiket SIMAKSI Anda.</p>
                  </div>

                  <button
                    onClick={() => setPaymentModalOpen(false)}
                    className="w-full py-3 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    Tutup & Lihat Tiket
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
