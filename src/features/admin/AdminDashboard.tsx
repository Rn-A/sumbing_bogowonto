import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  fetchAdminStats, fetchAdminBookings, updateBookingStatus, 
  fetchAdminReviews, approveReview, deleteReview, 
  fetchAllPublicData, updateRouteStatus, updateRouteDetails,
  fetchAdminArticles, createArticle, updateArticle, deleteArticle,
  fetchAdminGalleries, createGallery, deleteGallery,
  updateBookingPackage,
  createSegment, updateSegment, deleteSegment,
  createPost, updatePost, deletePost,
  createGpx, updateGpx, deleteGpx,
  uploadFile, getBookingByCode
} from '../../services/api';
import { 
  LayoutDashboard, CalendarCheck, Star, Route, Mountain, 
  TrendingUp, Users, DollarSign, Loader2, Check, X, CheckCircle, 
  AlertTriangle, Settings, RefreshCw, Trash2, ShieldAlert,
  FileText, Image as ImageIcon, Plus, Edit3, Eye, Search,
  ExternalLink, LogOut, CheckCircle2, QrCode, Printer,
  Sparkles, Clock, MapPin, ChevronRight, ShieldCheck,
  Compass, Navigation, Download, Layers, Flag, ShoppingBag,
  Camera, Video, Smartphone
} from 'lucide-react';

import HomeCmsManager from './HomeCmsManager';
import CatalogCmsManager from './CatalogCmsManager';
import logoBc from '../../assets/logo_bc.png';

function CameraScannerView({ 
  onScanSuccess, 
  onScanError 
}: { 
  onScanSuccess: (decodedText: string) => void;
  onScanError: (err: string) => void;
}) {
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCam, setSelectedCam] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Discover Cameras once mounted
  useEffect(() => {
    let isMounted = true;
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (isMounted && devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((d) => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCam(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('getCameras error:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Start Camera
  const startCamera = async (camId?: string) => {
    const targetId = camId || selectedCam;
    setCameraError('');
    setIsStarting(true);

    try {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
        } catch (_) {}
      }

      const element = document.getElementById('qr-camera-viewport-div');
      if (!element) return;
      element.innerHTML = '';

      const scanner = new Html5Qrcode('qr-camera-viewport-div');
      html5QrCodeRef.current = scanner;

      const scanConfig = { fps: 15, qrbox: { width: 250, height: 250 }, disableFlip: true };
      const handleSuccess = (text: string) => {
        try {
          if ('vibrate' in navigator) navigator.vibrate(150);
        } catch (_) {}
        try {
          if (scanner.isScanning) {
            scanner.stop().catch(() => {});
          }
        } catch (_) {}
        onScanSuccess(text);
      };

      if (targetId) {
        try {
          await scanner.start(targetId, scanConfig, handleSuccess, () => {});
          setIsStarted(true);
          return;
        } catch (err) {
          console.warn('Start with targetId failed:', err);
        }
      }

      // Fallback 1: user facing (laptop webcam)
      try {
        await scanner.start({ facingMode: 'user' }, scanConfig, handleSuccess, () => {});
        setIsStarted(true);
        return;
      } catch (err) {
        console.warn('Start with facingMode user failed:', err);
      }

      // Fallback 2: environment facing (HP rear cam)
      try {
        await scanner.start({ facingMode: 'environment' }, scanConfig, handleSuccess, () => {});
        setIsStarted(true);
        return;
      } catch (err) {
        console.warn('Start with facingMode environment failed:', err);
      }

      throw new Error('Tidak ada kamera yang dapat digunakan.');
    } catch (err: any) {
      console.error('Camera start error:', err);
      const msg = 'Gagal mengakses kamera laptop/HP. Pastikan izin kamera diizinkan di browser Anda (klik ikon gembok di sebelah URL ➔ Camera ➔ Allow).';
      setCameraError(msg);
      onScanError(msg);
      setIsStarted(false);
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
        } catch (_) {}
      }
    };
  }, []);

  return (
    <div className="space-y-4 text-center">
      {cameras.length > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#050505]">
          <Camera className="w-4 h-4 text-[#0D5C3A]" />
          <span>Pilih Kamera:</span>
          <select
            value={selectedCam}
            onChange={(e) => {
              setSelectedCam(e.target.value);
              startCamera(e.target.value);
            }}
            className="px-3 py-1.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold text-xs"
          >
            {cameras.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.label || `Kamera ${c.id.substring(0, 8)}...`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-[#0D5C3A] bg-black shadow-md">
        <div id="qr-camera-viewport-div" className="w-full h-72 bg-black overflow-hidden flex items-center justify-center relative">
          {isStarting && (
            <div className="flex flex-col items-center gap-2 text-slate-400 p-4 text-xs z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#0D5C3A]" />
              <span>Membuka kamera HP/Laptop...</span>
            </div>
          )}
        </div>

        {/* Clean Scanning Target Reticle Overlay (100% Unbroken Video View) */}
        {isStarted && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="w-52 h-52 border border-emerald-400/60 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse relative top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => startCamera()}
          disabled={isStarting}
          className="px-4 py-2 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          <span>{isStarted ? 'Muat Ulang Kamera' : 'Buka / Mulai Kamera'}</span>
        </button>
      </div>

      {cameraError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold text-left space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Akses Kamera Diblokir / Gagal</span>
          </div>
          <p className="text-[11px] text-rose-700 font-normal leading-relaxed">{cameraError}</p>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'home_cms' | 'route_cms' | 'catalog_cms' | 'articles' | 'galleries' | 'bookings' | 'routes' | 'reviews'>('overview');

  // Search & Filter States
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('ALL');
  const [articleSearch, setArticleSearch] = useState('');

  // Modals
  const [selectedBookingModal, setSelectedBookingModal] = useState<any>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // Profile CMS Modals
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<any>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [isGpxModalOpen, setIsGpxModalOpen] = useState(false);
  const [editingGpx, setEditingGpx] = useState<any>(null);
  // QR Scanner Modal State
  const [isQrScannerModalOpen, setIsQrScannerModalOpen] = useState(false);
  const [scannerTab, setScannerTab] = useState<'camera' | 'manual'>('camera');
  const [scanCodeInput, setScanCodeInput] = useState('');
  const [scannedBookingResult, setScannedBookingResult] = useState<any>(null);
  const [scanErrorMsg, setScanErrorMsg] = useState('');
  const [isScanningQuery, setIsScanningQuery] = useState(false);

  const handlePerformScanLookup = async (code: string) => {
    if (!code.trim()) return;
    setIsScanningQuery(true);
    setScanErrorMsg('');
    setScannedBookingResult(null);
    try {
      const res = await getBookingByCode(code.trim());
      if (res.success && res.data) {
        setScannedBookingResult(res.data);
      } else {
        setScanErrorMsg('Tiket/Reservasi tidak ditemukan. Pastikan Kode Booking/Kode Tiket benar.');
      }
    } catch (err: any) {
      setScanErrorMsg(err.response?.data?.error || 'Tiket/Reservasi tidak ditemukan.');
    } finally {
      setIsScanningQuery(false);
    }
  };

  // Scan QR Code from Photo Gallery
  const handleQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanningQuery(true);
      let tempDiv = document.getElementById('temp-qr-file-div');
      if (!tempDiv) {
        tempDiv = document.createElement('div');
        tempDiv.id = 'temp-qr-file-div';
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
      }
      const html5QrCode = new Html5Qrcode('temp-qr-file-div');
      const decodedText = await html5QrCode.scanFile(file, true);
      handlePerformScanLookup(decodedText);
    } catch (err) {
      alert('Gagal membaca QR Code dari foto galeri. Pastikan gambar QR Code terlihat jelas dan terang.');
    } finally {
      setIsScanningQuery(false);
    }
  };

  // File Upload State & Handler
  const [isUploading, setIsUploading] = useState(false);

  const parseGpxData = (xmlText: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const trkpts = xmlDoc.getElementsByTagName('trkpt');
      
      if (trkpts.length === 0) {
        return null;
      }

      let totalDistanceMeters = 0;
      let elevationGainMeters = 0;
      let minElevation = Infinity;
      let maxElevation = -Infinity;
      const waypointsCount = trkpts.length;

      const toRad = (x: number) => (x * Math.PI) / 180;

      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000; // Radius bumi dalam meter
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      let prevPt: { lat: number; lon: number; ele: number | null } | null = null;

      for (let i = 0; i < trkpts.length; i++) {
        const pt = trkpts[i];
        const lat = parseFloat(pt.getAttribute('lat') || '0');
        const lon = parseFloat(pt.getAttribute('lon') || '0');
        const eleEl = pt.getElementsByTagName('ele')[0];
        const ele = eleEl ? parseFloat(eleEl.textContent || '0') : null;

        if (ele !== null && !isNaN(ele)) {
          if (ele < minElevation) minElevation = ele;
          if (ele > maxElevation) maxElevation = ele;
        }

        if (prevPt) {
          const dist = getDistance(prevPt.lat, prevPt.lon, lat, lon);
          totalDistanceMeters += dist;

          if (prevPt.ele !== null && ele !== null && !isNaN(prevPt.ele) && !isNaN(ele)) {
            const diff = ele - prevPt.ele;
            if (diff > 0) {
              elevationGainMeters += diff;
            }
          }
        }

        prevPt = { lat, lon, ele };
      }

      return {
        totalDistanceKm: parseFloat((totalDistanceMeters / 1000).toFixed(2)),
        elevationGain: Math.round(elevationGainMeters),
        minElevation: minElevation === Infinity ? 0 : Math.round(minElevation),
        maxElevation: maxElevation === -Infinity ? 0 : Math.round(maxElevation),
        waypointsCount,
      };
    } catch (err) {
      console.error('Error parsing GPX data:', err);
      return null;
    }
  };

  const handleLocalFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string, fileName?: string, gpxStats?: any) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const isGpx = file.name.toLowerCase().endsWith('.gpx');
      let gpxStats: any = null;

      if (isGpx) {
        // Read file as text to parse GPS details
        const textReader = new FileReader();
        const parsePromise = new Promise<any>((resolve) => {
          textReader.onload = () => {
            const stats = parseGpxData(textReader.result as string);
            resolve(stats);
          };
          textReader.onerror = () => resolve(null);
          textReader.readAsText(file);
        });
        gpxStats = await parsePromise;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileData = reader.result as string;
        try {
          const res = await uploadFile({ fileName: file.name, fileData });
          if (res.success && res.url) {
            onSuccess(res.url, file.name, gpxStats);
          } else {
            alert(res.error || 'Gagal mengunggah berkas.');
          }
        } catch (err: any) {
          alert(err.response?.data?.error || 'Gagal mengunggah berkas.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      alert('Gagal membaca berkas.');
    }
  };

  // Article Form State
  const [articleForm, setArticleForm] = useState({
    judul: '',
    category_name: 'Pengumuman',
    ringkasan: '',
    konten: '',
    foto_sampul: '',
    status: 'Terbit',
    is_featured: false,
  });

  // Gallery Form State
  const [galleryForm, setGalleryForm] = useState({
    judul: '',
    category_name: 'Lanskap & Puncak',
    deskripsi: '',
    url_media: '',
    is_featured: false,
  });

  // Segment Form State
  const [segmentForm, setSegmentForm] = useState({
    nama_segmen: '',
    deskripsi: '',
    jarak_km: '1.5',
    estimasi_menit: '60',
    elevasi_naik: '200',
    elevasi_turun: '0',
    tingkat_kesulitan: 'Sedang',
    urutan: '1',
  });

  // Post / Checkpoint Form State
  const [postForm, setPostForm] = useState({
    nama_pos: '',
    deskripsi: '',
    elevasi: '1800',
    latitude: '-7.399',
    longitude: '110.035',
    fasilitas: ['air', 'shelter'],
    urutan: '1',
  });

  // GPX Form State
  const [gpxForm, setGpxForm] = useState({
    nama_file: 'sumbing_via_pencar_official_track.gpx',
    file_url: '/gpx/sumbing_via_pencar.gpx',
    total_jarak_km: '7.2',
    elevasi_gain: '1834',
    elevasi_loss: '0',
    elevasi_min: '1537',
    elevasi_max: '3371',
    total_waypoints: '450',
    deskripsi: 'Track resmi pendakian Gunung Sumbing Via Pencar Basecamp Bogowonto.',
  });

  // --- QUERIES ---
  const { data: statsRes, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
  });

  const { data: bookingsRes, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: fetchAdminBookings,
  });

  const { data: articlesRes, isLoading: articlesLoading, refetch: refetchArticles } = useQuery({
    queryKey: ['adminArticles'],
    queryFn: fetchAdminArticles,
  });

  const { data: galleriesRes, isLoading: galleriesLoading, refetch: refetchGalleries } = useQuery({
    queryKey: ['adminGalleries'],
    queryFn: fetchAdminGalleries,
  });

  const { data: reviewsRes, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: fetchAdminReviews,
  });

  const { data: publicRes, isLoading: publicLoading, refetch: refetchPublic } = useQuery({
    queryKey: ['publicAllData'],
    queryFn: fetchAllPublicData,
  });

  // --- MUTATIONS ---
  const bookingStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
    },
  });

  const articleCreateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createArticle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminArticles'] });
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      setIsArticleModalOpen(false);
      resetArticleForm();
      alert('Artikel berita berhasil diterbitkan!');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Gagal menyimpan artikel.'),
  });

  const articleUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminArticles'] });
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      setIsArticleModalOpen(false);
      setEditingArticle(null);
      resetArticleForm();
      alert('Artikel berhasil diperbarui!');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Gagal memperbarui artikel.'),
  });

  const articleDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminArticles'] });
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
    },
  });

  const galleryCreateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createGallery(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGalleries'] });
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      setIsGalleryModalOpen(false);
      resetGalleryForm();
      alert('Foto berhasil ditambahkan ke galeri!');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Gagal menambahkan foto galeri.'),
  });

  const galleryDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteGallery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGalleries'] });
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
    },
  });

  const routeDetailsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateRouteDetails(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      alert('Informasi profil jalur berhasil disimpan!');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Gagal menyimpan profil rute.'),
  });

  const segmentCreateMutation = useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) => createSegment(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      setIsSegmentModalOpen(false);
      alert('Segmen rute berhasil ditambahkan!');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Gagal menambahkan segmen.'),
  });

  const segmentUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateSegment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      setIsSegmentModalOpen(false);
      setEditingSegment(null);
      alert('Segmen rute berhasil diperbarui!');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Gagal memperbarui segmen.'),
  });

  const segmentDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteSegment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
    },
  });

  const postCreateMutation = useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) => createPost(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      setIsPostModalOpen(false);
      alert('Pos pendakian berhasil ditambahkan!');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Gagal menambahkan pos.'),
  });

  const postUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      setIsPostModalOpen(false);
      setEditingPost(null);
      alert('Pos pendakian berhasil diperbarui!');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Gagal memperbarui pos.'),
  });

  const postDeleteMutation = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
    },
  });

  const gpxCreateMutation = useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) => createGpx(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      setIsGpxModalOpen(false);

      // Auto-sync main route metadata with GPX parameters
      if (gpxForm.total_jarak_km && gpxForm.elevasi_min && gpxForm.elevasi_max) {
        routeDetailsMutation.mutate({
          id: mainRoute.id,
          data: {
            nama_jalur: mainRoute.nama_jalur,
            tingkat_kesulitan: mainRoute.tingkat_kesulitan,
            total_jarak_km: parseFloat(gpxForm.total_jarak_km),
            elevasi_start: parseInt(gpxForm.elevasi_min),
            elevasi_puncak: parseInt(gpxForm.elevasi_max),
            deskripsi: mainRoute.deskripsi,
          }
        });
      }

      alert('Data file GPX berhasil disimpan!');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Gagal menyimpan data GPX.'),
  });

  const gpxUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateGpx(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      setIsGpxModalOpen(false);
      setEditingGpx(null);

      // Auto-sync main route metadata with GPX parameters
      if (gpxForm.total_jarak_km && gpxForm.elevasi_min && gpxForm.elevasi_max) {
        routeDetailsMutation.mutate({
          id: mainRoute.id,
          data: {
            nama_jalur: mainRoute.nama_jalur,
            tingkat_kesulitan: mainRoute.tingkat_kesulitan,
            total_jarak_km: parseFloat(gpxForm.total_jarak_km),
            elevasi_start: parseInt(gpxForm.elevasi_min),
            elevasi_puncak: parseInt(gpxForm.elevasi_max),
            deskripsi: mainRoute.deskripsi,
          }
        });
      }

      alert('Data file GPX berhasil diperbarui!');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Gagal memperbarui data GPX.'),
  });

  const gpxDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteGpx(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
    },
  });

  const reviewApproveMutation = useMutation({
    mutationFn: ({ id, is_approved }: { id: string; is_approved: boolean }) => approveReview(id, is_approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
    },
  });

  const reviewDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
    },
  });

  const routeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateRouteStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      alert('Status jalur operasional berhasil diperbarui!');
    },
  });

  const packageUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateBookingPackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      alert('Tarif paket SIMAKSI berhasil diperbarui!');
    },
  });

  const handleRefresh = () => {
    refetchStats();
    refetchBookings();
    refetchArticles();
    refetchGalleries();
    refetchReviews();
    refetchPublic();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('bc_admin_token');
    sessionStorage.removeItem('bc_admin_session');
    navigate('/');
  };

  const resetArticleForm = () => {
    setArticleForm({
      judul: '',
      category_name: 'Pengumuman',
      ringkasan: '',
      konten: '',
      foto_sampul: '',
      status: 'Terbit',
      is_featured: false,
    });
  };

  const resetGalleryForm = () => {
    setGalleryForm({
      judul: '',
      category_name: 'Lanskap & Puncak',
      deskripsi: '',
      url_media: '',
      is_featured: false,
    });
  };

  const handleOpenEditArticle = (article: any) => {
    setEditingArticle(article);
    setArticleForm({
      judul: article.judul,
      category_name: article.category?.nama_kategori || 'Pengumuman',
      ringkasan: article.ringkasan || '',
      konten: article.konten,
      foto_sampul: article.foto_sampul || '',
      status: article.status || 'Terbit',
      is_featured: Boolean(article.is_featured),
    });
    setIsArticleModalOpen(true);
  };

  const handleOpenEditSegment = (seg: any) => {
    setEditingSegment(seg);
    setSegmentForm({
      nama_segmen: seg.nama_segmen,
      deskripsi: seg.deskripsi || '',
      jarak_km: String(seg.jarak_km || '1.0'),
      estimasi_menit: String(seg.estimasi_menit || '60'),
      elevasi_naik: String(seg.elevasi_naik || '0'),
      elevasi_turun: String(seg.elevasi_turun || '0'),
      tingkat_kesulitan: seg.tingkat_kesulitan || 'Sedang',
      urutan: String(seg.urutan || '1'),
    });
    setIsSegmentModalOpen(true);
  };

  const handleOpenEditPost = (p: any) => {
    setEditingPost(p);
    setPostForm({
      nama_pos: p.nama_pos,
      deskripsi: p.deskripsi || '',
      elevasi: String(p.elevasi || '1800'),
      latitude: String(p.latitude || '-7.399'),
      longitude: String(p.longitude || '110.035'),
      fasilitas: Array.isArray(p.fasilitas) ? p.fasilitas : ['air', 'shelter'],
      urutan: String(p.urutan || '1'),
    });
    setIsPostModalOpen(true);
  };

  const handleOpenEditGpx = (gpx: any) => {
    setEditingGpx(gpx);
    setGpxForm({
      nama_file: gpx.nama_file,
      file_url: gpx.file_url,
      total_jarak_km: String(gpx.total_jarak_km || '7.2'),
      elevasi_gain: String(gpx.elevasi_gain || '1834'),
      elevasi_loss: String(gpx.elevasi_loss || '0'),
      elevasi_min: String(gpx.elevasi_min || '1537'),
      elevasi_max: String(gpx.elevasi_max || '3371'),
      total_waypoints: String(gpx.total_waypoints || '450'),
      deskripsi: gpx.deskripsi || '',
    });
    setIsGpxModalOpen(true);
  };

  const stats = {
    totalBookings: statsRes?.data?.totalBookings ?? 0,
    totalRevenue: statsRes?.data?.totalRevenue ?? 0,
    totalHikers: statsRes?.data?.totalHikers ?? 0,
    openRoutes: statsRes?.data?.openRoutes ?? 1,
    pendingReviews: statsRes?.data?.pendingReviews ?? 0,
  };
  const bookings = Array.isArray(bookingsRes?.data) ? bookingsRes.data : Array.isArray(bookingsRes) ? bookingsRes : [];
  const articles = Array.isArray(articlesRes?.data) ? articlesRes.data : Array.isArray(articlesRes) ? articlesRes : [];
  const galleries = Array.isArray(galleriesRes?.data) ? galleriesRes.data : Array.isArray(galleriesRes) ? galleriesRes : [];
  const reviews = Array.isArray(reviewsRes?.data) ? reviewsRes.data : Array.isArray(reviewsRes) ? reviewsRes : [];
  const routes = Array.isArray(publicRes?.data?.routes) ? publicRes.data.routes : [];
  const packages = Array.isArray(publicRes?.data?.bookingPackages) ? publicRes.data.bookingPackages : [];

  const mainRoute = routes[0] || {
    id: 'default-route',
    nama_jalur: 'Gunung Sumbing Via Pencar',
    status: 'Buka',
    total_jarak_km: 7.2,
    estimasi_jam: 7,
    elevasi_start: 1537,
    elevasi_puncak: 3371,
    deskripsi: 'Jalur pendakian resmi Basecamp Bogowonto Sumbing Via Pencar.',
    tingkat_kesulitan: 'Sedang',
    segments: [],
    posts: [],
    gpx_files: [],
  };

  const mainPackage = packages[0] || {
    id: 'default-package',
    nama_paket: 'Tiket SIMAKSI Standar Via Pencar',
    harga_per_orang: 35000,
    deskripsi: 'Izin masuk resmi pendakian Sumbing Via Pencar + Asuransi Jasa Raharja + Sampah Bag',
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter((b: any) => {
    if (!b) return false;
    const matchesStatus = bookingFilterStatus === 'ALL' || b.status === bookingFilterStatus;
    const kode = b.kode_booking || '';
    const nama = b.nama_ketua || '';
    const hp = b.no_hp || '';
    const search = bookingSearch ? bookingSearch.toLowerCase() : '';
    const matchesSearch = !search || 
      kode.toLowerCase().includes(search) ||
      nama.toLowerCase().includes(search) ||
      hp.includes(search);
    return matchesStatus && matchesSearch;
  });

  // Filtered Articles
  const filteredArticles = articles.filter((a: any) => {
    if (!a) return false;
    const search = articleSearch ? articleSearch.toLowerCase() : '';
    const judul = a.judul || '';
    const cat = a.category?.nama_kategori || '';
    return !search || 
      judul.toLowerCase().includes(search) ||
      cat.toLowerCase().includes(search);
  });

  const isLoading = statsLoading || bookingsLoading || articlesLoading || galleriesLoading || reviewsLoading || publicLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5]">
        <Loader2 className="w-10 h-10 text-[#0D5C3A] animate-spin mb-4" />
        <p className="text-xs font-black text-[#050505] tracking-wider uppercase">
          Memuat Console Admin Basecamp Bogowonto...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col lg:flex-row text-[#050505]">
      
      {/* ===== ADMIN SIDEBAR ===== */}
      <aside className="w-full lg:w-72 bg-[#141410] text-white flex-shrink-0 flex flex-col border-r border-[#26261f]">
        
        {/* Top Header */}
        <div className="p-6 border-b border-[#26261f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-sm overflow-hidden">
              <img src={logoBc} alt="Logo Basecamp Bogowonto" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wide text-white">Console Admin</p>
              <p className="text-[11px] text-amber-300 font-bold">BC Bogowonto Sumbing</p>
            </div>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs grouped by Category */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          
          {/* GROUP 1: OPERASIONAL LOKET */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Operasional Loket
            </p>
            {[
              { id: 'overview', label: 'Ringkasan & KPI', icon: LayoutDashboard, badge: null },
              { id: 'bookings', label: 'Manajemen Reservasi', icon: CalendarCheck, badge: bookings.filter((b: any) => b.status === 'Paid').length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0D5C3A] text-white shadow-md'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== null && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* GROUP 2: CMS KELOLA HALAMAN WEB */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              CMS Kelola Halaman Web
            </p>
            {[
              { id: 'home_cms', label: 'CMS Halaman Home', icon: Sparkles, badge: 'Home' },
              { id: 'route_cms', label: 'CMS Halaman Profile & Jalur', icon: Mountain, badge: 'Profile' },
              { id: 'catalog_cms', label: 'CMS Halaman Katalog', icon: ShoppingBag, badge: 'Katalog' },
              { id: 'articles', label: 'CMS Halaman Berita', icon: FileText, badge: articles.length },
              { id: 'galleries', label: 'CMS Halaman Galeri', icon: ImageIcon, badge: galleries.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0D5C3A] text-white shadow-md'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== null && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* GROUP 3: PENGATURAN & MODERASI */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Pengaturan & Moderasi
            </p>
            {[
              { id: 'routes', label: 'Status & Tarif SIMAKSI', icon: DollarSign, badge: mainRoute.status },
              { id: 'reviews', label: 'Moderasi Ulasan', icon: Star, badge: stats.pendingReviews > 0 ? stats.pendingReviews : null },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0D5C3A] text-white shadow-md'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== null && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#26261f] space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Halaman Publik</span>
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi Admin</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT PANE ===== */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl">
        
        {/* ============================================================ */}
        {/* TAB: HOME CMS MANAGER */}
        {/* ============================================================ */}
        {activeTab === 'home_cms' && (
          <HomeCmsManager />
        )}

        {/* ============================================================ */}
        {/* TAB: CATALOG CMS MANAGER */}
        {/* ============================================================ */}
        {activeTab === 'catalog_cms' && (
          <CatalogCmsManager />
        )}

        {/* ============================================================ */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Dashboard Operasional</span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  Ringkasan Basecamp Bogowonto
                </h1>
                <p className="text-xs text-[#707070] mt-0.5">
                  Pantau statistik harian pendaki, pendapatan retribusi SIMAKSI, dan status jalur Sumbing Via Pencar.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#0D5C3A] text-xs font-black">
                  <span className="w-2 h-2 rounded-full bg-[#0D5C3A] animate-pulse" />
                  <span>Jalur Sumbing: {mainRoute.status}</span>
                </span>
              </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#F4F0E8] p-5 rounded-3xl border border-[#e7e5e4] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#707070] uppercase">Total Pendaki Terdaftar</span>
                  <p className="text-2xl font-black text-[#050505] mt-1">{(stats.totalHikers || 0).toLocaleString('id-ID')} Orang</p>
                  <span className="text-[10px] text-emerald-700 font-bold">✓ Kuota terpantau</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-[#F4F0E8] p-5 rounded-3xl border border-[#e7e5e4] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#707070] uppercase">Total Transaksi Booking</span>
                  <p className="text-2xl font-black text-[#050505] mt-1">{stats.totalBookings || 0} Reservasi</p>
                  <span className="text-[10px] text-[#707070]">Semua rombongan</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-[#F4F0E8] p-5 rounded-3xl border border-[#e7e5e4] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#707070] uppercase">Pendapatan Retribusi SIMAKSI</span>
                  <p className="text-2xl font-black text-[#0D5C3A] mt-1">Rp {(stats.totalRevenue || 0).toLocaleString('id-ID')}</p>
                  <span className="text-[10px] text-emerald-700 font-bold">Lunas terverifikasi</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-[#F4F0E8] p-5 rounded-3xl border border-[#e7e5e4] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#707070] uppercase">Ulasan Menunggu Moderasi</span>
                  <p className="text-2xl font-black text-[#050505] mt-1">{stats.pendingReviews} Ulasan</p>
                  <span className="text-[10px] text-amber-700 font-bold">Perlu disetujui</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Star className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Action & Recent Bookings Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Recent Bookings Stream */}
              <div className="lg:col-span-8 bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-[#050505] uppercase tracking-wider">
                    Reservasi Terbaru
                  </h3>
                  <button 
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-bold text-[#0D5C3A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lihat Semua</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {bookings.slice(0, 5).map((b: any) => (
                    <div key={b.id} className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#e7e5e4] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-[#e7e5e4] flex items-center justify-center font-bold text-xs text-[#0D5C3A]">
                          {b.jumlah_peserta}p
                        </div>
                        <div>
                          <p className="font-black text-xs text-[#050505]">{b.nama_ketua}</p>
                          <p className="text-[10px] text-[#707070] font-mono">{b.kode_booking} &bull; {b.no_hp}</p>
                          <p className="text-[9.5px] font-bold text-[#0D5C3A] mt-0.5">
                            🕒 Registrasi: {b.created_at ? new Date(b.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          b.status === 'CheckedIn'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'CheckedOut'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-100 text-[#0D5C3A]'
                        }`}>
                          {b.status}
                        </span>

                        <button
                          onClick={() => { setSelectedBookingModal(b); }}
                          className="px-3 py-1 bg-white border border-[#e7e5e4] text-xs font-bold text-[#050505] rounded-xl hover:bg-slate-100 cursor-pointer"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  ))}

                  {bookings.length === 0 && (
                    <p className="text-center py-8 text-xs text-[#707070]">Belum ada data reservasi.</p>
                  )}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="lg:col-span-4 bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs space-y-4">
                <h3 className="font-black text-sm text-[#050505] uppercase tracking-wider">
                  Aksi Cepat Pengelola
                </h3>

                <div className="space-y-2.5">
                  <button
                    onClick={() => {
                      setScanCodeInput('');
                      setScannedBookingResult(null);
                      setScanErrorMsg('');
                      setIsQrScannerModalOpen(true);
                    }}
                    className="w-full p-3.5 rounded-2xl bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black flex items-center gap-3 transition-all cursor-pointer shadow-md"
                  >
                    <QrCode className="w-4 h-4 text-amber-300" />
                    <span>📷 Scan QR Tiket / Check-In Loket</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('route_cms')}
                    className="w-full p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] text-xs font-black flex items-center gap-3 transition-all cursor-pointer"
                  >
                    <Mountain className="w-4 h-4" />
                    <span>Kelola Profil Jalur & GPX</span>
                  </button>

                  <button
                    onClick={() => {
                      resetArticleForm();
                      setIsArticleModalOpen(true);
                    }}
                    className="w-full p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-black flex items-center gap-3 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tulis Pengumuman / Berita Baru</span>
                  </button>

                  <button
                    onClick={() => {
                      resetGalleryForm();
                      setIsGalleryModalOpen(true);
                    }}
                    className="w-full p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black flex items-center gap-3 transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Unggah Foto Galeri Baru</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: MANAJEMEN RESERVASI & LOKET */}
        {/* ============================================================ */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Loket & Registrasi</span>
                <h2 className="text-2xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  Kelola Tiket & Check-In Rombongan
                </h2>
                <p className="text-xs text-[#707070] mt-0.5">
                  Verifikasi kehadiran rombongan di loket basecamp dan kelola status check-out saat pendaki selesai turun.
                </p>
              </div>

              <button
                onClick={() => {
                  setScanCodeInput('');
                  setScannedBookingResult(null);
                  setScanErrorMsg('');
                  setIsQrScannerModalOpen(true);
                }}
                className="px-6 py-3.5 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-2xl transition-all flex items-center gap-2.5 cursor-pointer shadow-lg shrink-0 self-start sm:self-auto"
              >
                <QrCode className="w-5 h-5 text-amber-300" />
                <span>📷 Scan QR Tiket / Check-In Loket</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-[#F4F0E8] p-4 rounded-2xl border border-[#e7e5e4] flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[#707070] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Kode Booking / Nama / No WA..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs font-bold text-[#050505]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['ALL', 'Pending', 'Confirmed', 'Paid', 'CheckedIn', 'CheckedOut'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      bookingFilterStatus === st
                        ? 'bg-[#0D5C3A] text-white'
                        : 'bg-[#FAF8F5] text-[#707070] hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL' ? 'Semua' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#e7e5e4] text-[#707070] uppercase text-[10px] font-black tracking-wider">
                    <tr>
                      <th className="p-4">Kode Booking</th>
                      <th className="p-4">Ketua Rombongan</th>
                      <th className="p-4">Waktu Registrasi</th>
                      <th className="p-4">Tanggal Naik - Turun</th>
                      <th className="p-4">Peserta</th>
                      <th className="p-4">Total Bayar</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi Loket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7e5e4]">
                    {filteredBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                        <td className="p-4 font-mono font-black text-[#050505]">
                          {b.kode_booking}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-[#050505]">{b.nama_ketua}</p>
                          <p className="text-[10px] text-[#707070]">{b.no_hp}</p>
                        </td>
                        <td className="p-4 text-[#707070]">
                          <p className="font-bold text-[#050505]">
                            {b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </p>
                          <p className="text-[10px] text-[#0D5C3A] font-semibold">
                            {b.created_at ? new Date(b.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : ''}
                          </p>
                        </td>
                        <td className="p-4 text-[#707070]">
                          <p className="font-semibold text-[#050505]">{new Date(b.tanggal_naik).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                          <p className="text-[10px]">s.d. {new Date(b.tanggal_turun).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                        </td>
                        <td className="p-4 font-black text-[#0D5C3A]">
                          {b.jumlah_peserta} Orang
                        </td>
                        <td className="p-4 font-black text-[#050505]">
                          Rp {b.total_harga.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            b.status === 'CheckedIn'
                              ? 'bg-blue-100 text-blue-800'
                              : b.status === 'CheckedOut'
                                ? 'bg-slate-200 text-slate-700'
                                : b.status === 'Pending' || b.status === 'Unpaid'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-[#0D5C3A]'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {(b.status === 'Pending' || b.status === 'Unpaid') && (
                            <button
                              onClick={() => bookingStatusMutation.mutate({ id: b.id, status: 'Paid' })}
                              className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-[11px] font-black hover:bg-amber-700 cursor-pointer"
                              title="Tandai pembayaran telah diterima"
                            >
                              Konfirmasi Bayar
                            </button>
                          )}
                          {(b.status === 'Paid' || b.status === 'Confirmed') && (
                            <button
                              onClick={() => bookingStatusMutation.mutate({ id: b.id, status: 'CheckedIn' })}
                              className="px-3 py-1.5 bg-[#0D5C3A] text-white rounded-xl text-[11px] font-black hover:bg-[#064e3b] cursor-pointer"
                              title="Tandai pendaki telah tiba di basecamp dan mulai naik"
                            >
                              Check-In
                            </button>
                          )}
                          {b.status === 'CheckedIn' && (
                            <button
                              onClick={() => bookingStatusMutation.mutate({ id: b.id, status: 'CheckedOut' })}
                              className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-[11px] font-black hover:bg-slate-900 cursor-pointer"
                              title="Tandai pendaki telah selesai turun dan lapor di pos"
                            >
                              Check-Out
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedBookingModal(b)}
                            className="px-2.5 py-1.5 bg-white border border-[#e7e5e4] text-[#050505] rounded-xl text-[11px] font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-xs text-[#707070]">
                          Tidak ada data reservasi yang sesuai dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: CMS PROFIL JALUR, SEGMENTASI & GPX */}
        {/* ============================================================ */}
        {activeTab === 'route_cms' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Profile & Route CMS</span>
                <h2 className="text-2xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  Kelola Profil Jalur, Segmen & File GPX
                </h2>
                <p className="text-xs text-[#707070] mt-0.5">
                  Ubah seluruh data komponen yang tampil di halaman profil pendakian Sumbing Via Pencar.
                </p>
              </div>
            </div>

            {/* 1. Header & General Route Metadata */}
            <div className="bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs space-y-4">
              <h3 className="font-black text-sm text-[#050505] uppercase tracking-wider flex items-center gap-2">
                <Mountain className="w-4 h-4 text-[#0D5C3A]" />
                <span>1. Informasi Utama & Elevasi Jalur</span>
              </h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as any;
                  routeDetailsMutation.mutate({
                    id: mainRoute.id,
                    data: {
                      nama_jalur: form.nama_jalur.value,
                      tingkat_kesulitan: form.tingkat_kesulitan.value,
                      elevasi_start: form.elevasi_start.value,
                      elevasi_puncak: form.elevasi_puncak.value,
                      total_jarak_km: form.total_jarak_km.value,
                      estimasi_jam: form.estimasi_jam.value,
                      deskripsi: form.deskripsi.value,
                    }
                  });
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-[#050505] block mb-1">Nama Jalur</label>
                    <input
                      name="nama_jalur"
                      defaultValue={mainRoute.nama_jalur}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#050505] block mb-1">Tingkat Kesulitan</label>
                    <select
                      name="tingkat_kesulitan"
                      defaultValue={mainRoute.tingkat_kesulitan}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                    >
                      <option value="Sedang">Sedang (Rekomendasi)</option>
                      <option value="Menantang">Menantang</option>
                      <option value="Berat">Berat</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#050505] block mb-1">Elevasi Start (Basecamp)</label>
                    <input
                      type="number"
                      name="elevasi_start"
                      defaultValue={mainRoute.elevasi_start}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#050505] block mb-1">Elevasi Puncak Sumbing</label>
                    <input
                      type="number"
                      name="elevasi_puncak"
                      defaultValue={mainRoute.elevasi_puncak}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#050505] block mb-1">Total Jarak Lintasan (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="total_jarak_km"
                      defaultValue={mainRoute.total_jarak_km}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#050505] block mb-1">Estimasi Waktu Naik (Jam)</label>
                    <input
                      type="number"
                      step="0.5"
                      name="estimasi_jam"
                      defaultValue={mainRoute.estimasi_jam}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#050505] block mb-1">Deskripsi Lengkap Karakteristik Jalur</label>
                  <textarea
                    rows={3}
                    name="deskripsi"
                    defaultValue={mainRoute.deskripsi || ''}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={routeDetailsMutation.isPending}
                    className="px-5 py-2.5 bg-[#0D5C3A] text-white font-black rounded-xl hover:bg-[#064e3b] cursor-pointer shadow-md disabled:opacity-50"
                  >
                    Simpan Informasi Jalur
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Segments Management */}
            <div className="bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-[#050505] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0D5C3A]" />
                  <span>2. Segmentasi Lintasan Jalur ({mainRoute.segments?.length || 0} Segmen)</span>
                </h3>

                <button
                  onClick={() => {
                    setEditingSegment(null);
                    setSegmentForm({
                      nama_segmen: '',
                      deskripsi: '',
                      jarak_km: '1.2',
                      estimasi_menit: '45',
                      elevasi_naik: '180',
                      elevasi_turun: '0',
                      tingkat_kesulitan: 'Sedang',
                      urutan: String((mainRoute.segments?.length || 0) + 1),
                    });
                    setIsSegmentModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#0D5C3A] text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Segmen</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mainRoute.segments?.map((seg: any) => (
                  <div key={seg.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#e7e5e4] flex justify-between items-start gap-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#0D5C3A] text-white flex items-center justify-center font-bold text-[10px]">
                          {seg.urutan}
                        </span>
                        <h4 className="font-black text-[#050505]">{seg.nama_segmen}</h4>
                      </div>
                      <p className="text-[11px] text-[#707070]">
                        {seg.jarak_km} km &bull; {seg.estimasi_menit} menit &bull; Gain +{seg.elevasi_naik}m
                      </p>
                      {seg.deskripsi && (
                        <p className="text-[10px] text-slate-600 italic">{seg.deskripsi}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditSegment(seg)}
                        className="p-1.5 rounded-lg bg-white border border-[#e7e5e4] hover:bg-slate-100 cursor-pointer"
                        title="Edit Segmen"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus segmen "${seg.nama_segmen}"?`)) {
                            segmentDeleteMutation.mutate(seg.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                        title="Hapus Segmen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Checkpoint Posts Management */}
            <div className="bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-[#050505] uppercase tracking-wider flex items-center gap-2">
                  <Flag className="w-4 h-4 text-[#0D5C3A]" />
                  <span>3. Pos Pendakian & Fasilitas Basecamp ({mainRoute.posts?.length || 0} Pos)</span>
                </h3>

                <button
                  onClick={() => {
                    setEditingPost(null);
                    setPostForm({
                      nama_pos: '',
                      deskripsi: '',
                      elevasi: '2000',
                      latitude: '-7.399',
                      longitude: '110.035',
                      fasilitas: ['air', 'shelter'],
                      urutan: String((mainRoute.posts?.length || 0) + 1),
                    });
                    setIsPostModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#0D5C3A] text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pos</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {mainRoute.posts?.map((p: any) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#e7e5e4] flex justify-between items-start gap-2">
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] font-black text-[#0D5C3A] uppercase">Pos #{p.urutan}</span>
                      <h4 className="font-black text-[#050505]">{p.nama_pos}</h4>
                      <p className="text-[11px] font-bold text-[#707070]">{p.elevasi} mdpl</p>
                      {p.deskripsi && <p className="text-[10px] text-slate-600 line-clamp-2">{p.deskripsi}</p>}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditPost(p)}
                        className="p-1.5 rounded-lg bg-white border border-[#e7e5e4] hover:bg-slate-100 cursor-pointer"
                        title="Edit Pos"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus pos "${p.nama_pos}"?`)) {
                            postDeleteMutation.mutate(p.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                        title="Hapus Pos"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. GPX Track Data Management */}
            <div className="bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-[#050505] uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#0D5C3A]" />
                  <span>4. File Navigasi & Data Track GPX</span>
                </h3>

                 <button
                  onClick={() => {
                    const gpxFiles = mainRoute.gpx_files || [];
                    const latestGpx = [...gpxFiles].sort((a: any, b: any) => {
                      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                      return timeB - timeA;
                    })[0];
                    if (latestGpx) {
                      handleOpenEditGpx(latestGpx);
                    } else {
                      setEditingGpx(null);
                      setIsGpxModalOpen(true);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-[#0D5C3A] text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{mainRoute.gpx_files?.length > 0 ? 'Edit Data GPX' : 'Tambah File GPX'}</span>
                </button>
              </div>

              {(() => {
                const gpxFiles = mainRoute.gpx_files || [];
                const latestGpx = [...gpxFiles].sort((a: any, b: any) => {
                  const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                  return timeB - timeA;
                })[0];

                if (latestGpx) {
                  return (
                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#e7e5e4] space-y-2 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-[#e7e5e4]">
                        <div>
                          <p className="font-black text-[#050505] font-mono">{latestGpx.nama_file}</p>
                          <p className="text-[10px] text-[#707070]">{latestGpx.deskripsi || 'File resmi GPX track pendakian'}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-100 text-[#0D5C3A] font-bold text-[10px] rounded-full">
                          ✓ Siap Diunduh Pendaki
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1">
                        <div>
                          <span className="text-[#707070] block">Elevasi Gain:</span>
                          <span className="font-bold text-[#050505]">+{latestGpx.elevasi_gain || 1834} m</span>
                        </div>
                        <div>
                          <span className="text-[#707070] block">Elevasi Min - Max:</span>
                          <span className="font-bold text-[#050505]">{latestGpx.elevasi_min || 1537}m - {latestGpx.elevasi_max || 3371}m</span>
                        </div>
                        <div>
                          <span className="text-[#707070] block">Total Jarak:</span>
                          <span className="font-bold text-[#050505]">{latestGpx.total_jarak_km || 7.2} km</span>
                        </div>
                        <div>
                          <span className="text-[#707070] block">Total Waypoints:</span>
                          <span className="font-bold text-[#050505]">{latestGpx.total_waypoints || 450} Titik</span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <p className="text-xs text-[#707070] py-4 text-center">Belum ada file GPX terdaftar. Klik "Tambah File GPX" untuk mendaftarkan track.</p>
                  );
                }
              })()}
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: CMS BERITA & PENGUMUMAN */}
        {/* ============================================================ */}
        {activeTab === 'articles' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Content Management</span>
                <h2 className="text-2xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  CMS Berita & Pengumuman Basecamp
                </h2>
                <p className="text-xs text-[#707070] mt-0.5">
                  Publikasikan pengumuman resmi, tips keselamatan, panduan jalur, dan update terkini untuk para pendaki.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingArticle(null);
                  resetArticleForm();
                  setIsArticleModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Artikel Baru</span>
              </button>
            </div>

            {/* Articles List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((article: any) => (
                <div key={article.id} className="bg-white dark:bg-[#F4F0E8] p-5 rounded-3xl border border-[#e7e5e4] shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-start gap-3.5">
                    {article.foto_sampul && (
                      <img 
                        src={article.foto_sampul} 
                        alt={article.judul} 
                        className="w-20 h-20 rounded-2xl object-cover border border-[#e7e5e4] shrink-0" 
                      />
                    )}
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 bg-emerald-50 text-[#0D5C3A] text-[10px] font-black rounded-md">
                        {article.category?.nama_kategori || 'Berita'}
                      </span>
                      <h4 className="font-black text-sm text-[#050505] line-clamp-2 leading-snug">
                        {article.judul}
                      </h4>
                      <p className="text-[11px] text-[#707070] line-clamp-2">
                        {article.ringkasan}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#e7e5e4] flex items-center justify-between">
                    <span className="text-[10px] text-[#707070]">
                      {new Date(article.tanggal_terbit || article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditArticle(article)}
                        className="p-2 rounded-xl bg-white border border-[#e7e5e4] text-[#050505] hover:bg-slate-100 text-xs font-bold cursor-pointer"
                        title="Edit Artikel"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus artikel "${article.judul}"?`)) {
                            articleDeleteMutation.mutate(article.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold cursor-pointer"
                        title="Hapus Artikel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredArticles.length === 0 && (
                <div className="col-span-2 p-12 text-center text-xs text-[#707070] bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4]">
                  Belum ada artikel berita. Klik "Buat Artikel Baru" untuk menerbitkan berita pertama.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: CMS GALERI FOTO */}
        {/* ============================================================ */}
        {activeTab === 'galleries' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Media Gallery</span>
                <h2 className="text-2xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  CMS Galeri Foto Lintasan Sumbing
                </h2>
                <p className="text-xs text-[#707070] mt-0.5">
                  Kelola dokumentasi keindahan alam jalur pendakian via Pencar Basecamp Bogowonto.
                </p>
              </div>

              <button
                onClick={() => {
                  resetGalleryForm();
                  setIsGalleryModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Foto Galeri</span>
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {galleries.map((g: any) => (
                <div key={g.id} className="group relative bg-white dark:bg-[#F4F0E8] rounded-2xl border border-[#e7e5e4] overflow-hidden shadow-xs">
                  <img 
                    src={g.url_media} 
                    alt={g.judul} 
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-3">
                    <span className="text-[9px] font-bold text-[#0D5C3A] uppercase block">
                      {g.category?.nama_kategori || 'Galeri'}
                    </span>
                    <p className="text-xs font-black text-[#050505] truncate">{g.judul}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Hapus foto "${g.judul}" dari galeri?`)) {
                        galleryDeleteMutation.mutate(g.id);
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {galleries.length === 0 && (
                <div className="col-span-4 p-12 text-center text-xs text-[#707070] bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4]">
                  Belum ada foto di galeri. Klik "Tambah Foto Galeri" untuk mengunggah foto.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: STATUS JALUR & TARIF SIMAKSI */}
        {/* ============================================================ */}
        {activeTab === 'routes' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Route & Tariff Control</span>
              <h2 className="text-2xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                Status Operasional Jalur & Tarif SIMAKSI
              </h2>
              <p className="text-xs text-[#707070] mt-0.5">
                Atur status buka/tutup jalur pendakian Gunung Sumbing Via Pencar dan penyesuaian tarif retribusi resmi.
              </p>
            </div>

            {/* Route Status Card */}
            <div className="bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-[#050505]">{mainRoute.nama_jalur}</h4>
                  <p className="text-xs text-[#707070]">Basecamp Bogowonto &bull; 1.537 s.d. 3.371 mdpl</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  mainRoute.status === 'Buka'
                    ? 'bg-emerald-100 text-[#0D5C3A]'
                    : mainRoute.status === 'Waspada'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                }`}>
                  Status: {mainRoute.status}
                </span>
              </div>

              <div className="pt-4 border-t border-[#e7e5e4]">
                <label className="text-xs font-black text-[#050505] block mb-2">Ubah Status Jalur Operasional:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { val: 'Buka', label: 'Buka Normal', desc: 'Jalur aman dan cuaca kondusif' },
                    { val: 'Waspada', label: 'Waspada Cuaca', desc: 'Himbauan angin kencang/hujan' },
                    { val: 'Tutup', label: 'Tutup Sementara', desc: 'Pemulihan ekosistem / badai' },
                  ].map((s) => (
                    <button
                      key={s.val}
                      onClick={() => routeStatusMutation.mutate({ id: mainRoute.id, status: s.val })}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        mainRoute.status === s.val
                          ? 'border-[#0D5C3A] bg-emerald-50/60 shadow-xs'
                          : 'border-[#e7e5e4] bg-[#FAF8F5] hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-black text-xs text-[#050505]">{s.label}</p>
                      <p className="text-[10px] text-[#707070] mt-0.5">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Package & SIMAKSI Pricing Card */}
            <div className="bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs space-y-4">
              <h4 className="font-black text-sm text-[#050505] uppercase tracking-wider">
                Tarif Resmi Registrasi SIMAKSI
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#050505] block mb-1">Nama Paket</label>
                  <input
                    type="text"
                    defaultValue={mainPackage.nama_paket}
                    id="pkg_name"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#050505] block mb-1">Tarif Per Orang (Rp)</label>
                  <input
                    type="number"
                    defaultValue={mainPackage.harga_per_orang}
                    id="pkg_price"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#050505] block mb-1">Deskripsi Fasilitas & Asuransi</label>
                <textarea
                  rows={2}
                  defaultValue={mainPackage.deskripsi}
                  id="pkg_desc"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const name = (document.getElementById('pkg_name') as HTMLInputElement)?.value;
                    const price = (document.getElementById('pkg_price') as HTMLInputElement)?.value;
                    const desc = (document.getElementById('pkg_desc') as HTMLTextAreaElement)?.value;
                    packageUpdateMutation.mutate({
                      id: mainPackage.id,
                      data: { nama_paket: name, harga_per_orang: parseInt(price), deskripsi: desc }
                    });
                  }}
                  className="px-5 py-2.5 bg-[#0D5C3A] text-white text-xs font-black rounded-xl hover:bg-[#064e3b] cursor-pointer shadow-sm"
                >
                  Simpan Perubahan Tarif
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 7: MODERASI ULASAN */}
        {/* ============================================================ */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Testimonials Moderation</span>
              <h2 className="text-2xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                Moderasi Ulasan Pendaki
              </h2>
              <p className="text-xs text-[#707070] mt-0.5">
                Tinjau ulasan yang masuk dari para pendaki sebelum ditampilkan pada halaman publik website.
              </p>
            </div>

            <div className="space-y-3">
              {reviews.map((r: any) => (
                <div key={r.id} className="bg-white dark:bg-[#F4F0E8] p-5 rounded-3xl border border-[#e7e5e4] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-[#050505]">{r.nama}</span>
                      <div className="flex items-center text-amber-500 text-xs">
                        {'★'.repeat(r.rating || 5)}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        r.is_approved ? 'bg-emerald-100 text-[#0D5C3A]' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.is_approved ? 'Disetujui' : 'Menunggu'}
                      </span>
                    </div>
                    <p className="text-xs text-[#707070] italic leading-relaxed">"{r.komentar}"</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => reviewApproveMutation.mutate({ id: r.id, is_approved: !r.is_approved })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                        r.is_approved
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          : 'bg-[#0D5C3A] text-white hover:bg-[#064e3b]'
                      }`}
                    >
                      {r.is_approved ? 'Batalkan' : 'Setujui'}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Hapus ulasan ini?')) {
                          reviewDeleteMutation.mutate(r.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {reviews.length === 0 && (
                <div className="p-12 text-center text-xs text-[#707070] bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4]">
                  Belum ada ulasan yang masuk.
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ============================================================ */}
      {/* MODAL: DETAIL BOOKING */}
      {/* ============================================================ */}
      {selectedBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e5e4]">
              <div>
                <span className="text-[10px] font-black text-[#0D5C3A] uppercase">Detail Tiket Reservasi</span>
                <h3 className="text-base font-black text-[#050505]">{selectedBookingModal.kode_booking}</h3>
              </div>
              <button 
                onClick={() => setSelectedBookingModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#e7e5e4]">
                <div>
                  <span className="text-[10px] text-[#707070] block font-semibold">Ketua Rombongan</span>
                  <p className="font-bold text-[#050505]">{selectedBookingModal.nama_ketua}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#707070] block font-semibold">No. WhatsApp</span>
                  <p className="font-bold text-[#050505] font-mono">{selectedBookingModal.no_hp}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#707070] block font-semibold">Waktu Registrasi</span>
                  <p className="font-bold text-[#0D5C3A]">
                    {selectedBookingModal.created_at ? new Date(selectedBookingModal.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#707070] block font-semibold">Status Reservasi</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase mt-0.5 ${
                    selectedBookingModal.status === 'CheckedIn'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedBookingModal.status === 'CheckedOut'
                        ? 'bg-slate-200 text-slate-700'
                        : selectedBookingModal.status === 'Pending' || selectedBookingModal.status === 'Unpaid'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-[#0D5C3A]'
                  }`}>
                    {selectedBookingModal.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#707070] block font-semibold">Waktu Check-In Loket</span>
                  <p className="font-bold text-blue-700">
                    {selectedBookingModal.ticket?.checked_in_at 
                      ? new Date(selectedBookingModal.ticket.checked_in_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
                      : <span className="text-slate-400 font-normal italic">Belum Check-In</span>}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#707070] block font-semibold">Waktu Check-Out Selesai</span>
                  <p className="font-bold text-slate-700">
                    {selectedBookingModal.ticket?.checked_out_at 
                      ? new Date(selectedBookingModal.ticket.checked_out_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
                      : <span className="text-slate-400 font-normal italic">Belum Check-Out</span>}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black text-[#707070] uppercase block mb-1">Daftar Anggota Rombongan:</span>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {selectedBookingModal.members?.map((m: any, idx: number) => (
                    <div key={idx} className="p-2 bg-[#FAF8F5] rounded-xl flex justify-between">
                      <span className="font-bold">{idx + 1}. {m.nama_lengkap} {m.is_ketua ? '(Ketua)' : ''}</span>
                      <span className="text-[#707070] font-mono">NIK: {m.nik || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e7e5e4] flex justify-end gap-2">
              <a
                href={`/reservasi?mode=check&code=${selectedBookingModal.kode_booking}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Buka Karcis Cetak
              </a>
              <button
                onClick={() => setSelectedBookingModal(null)}
                className="px-4 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT SEGMEN CMS */}
      {/* ============================================================ */}
      {isSegmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e5e4]">
              <h3 className="text-base font-black text-[#050505]">
                {editingSegment ? 'Edit Segmen Lintasan' : 'Tambah Segmen Lintasan Baru'}
              </h3>
              <button 
                onClick={() => setIsSegmentModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingSegment) {
                  segmentUpdateMutation.mutate({ id: editingSegment.id, data: segmentForm });
                } else {
                  segmentCreateMutation.mutate({ routeId: mainRoute.id, data: segmentForm });
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-[#050505] block mb-1">Nama Segmen *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Basecamp ke Pos 1 (Gerbang Rimba)"
                  value={segmentForm.nama_segmen}
                  onChange={(e) => setSegmentForm({ ...segmentForm, nama_segmen: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#050505] block mb-1">Jarak (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={segmentForm.jarak_km}
                    onChange={(e) => setSegmentForm({ ...segmentForm, jarak_km: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#050505] block mb-1">Estimasi Waktu (Menit)</label>
                  <input
                    type="number"
                    required
                    value={segmentForm.estimasi_menit}
                    onChange={(e) => setSegmentForm({ ...segmentForm, estimasi_menit: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#050505] block mb-1">Elevasi Naik (+m)</label>
                  <input
                    type="number"
                    value={segmentForm.elevasi_naik}
                    onChange={(e) => setSegmentForm({ ...segmentForm, elevasi_naik: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#050505] block mb-1">Tingkat Kesulitan</label>
                  <select
                    value={segmentForm.tingkat_kesulitan}
                    onChange={(e) => setSegmentForm({ ...segmentForm, tingkat_kesulitan: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Curam">Curam & Terjal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#050505] block mb-1">Deskripsi & Tips Medan</label>
                <textarea
                  rows={2}
                  placeholder="Kondisi jalur berupa tanah padat dan bebatuan..."
                  value={segmentForm.deskripsi}
                  onChange={(e) => setSegmentForm({ ...segmentForm, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-[#e7e5e4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSegmentModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={segmentCreateMutation.isPending || segmentUpdateMutation.isPending}
                  className="px-5 py-2 bg-[#0D5C3A] text-white font-black rounded-xl hover:bg-[#064e3b] cursor-pointer shadow-md"
                >
                  {editingSegment ? 'Simpan Perubahan' : 'Tambah Segmen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT POS PENDAKIAN CMS */}
      {/* ============================================================ */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e5e4]">
              <h3 className="text-base font-black text-[#050505]">
                {editingPost ? 'Edit Pos Pendakian' : 'Tambah Pos Pendakian Baru'}
              </h3>
              <button 
                onClick={() => setIsPostModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingPost) {
                  postUpdateMutation.mutate({ id: editingPost.id, data: postForm });
                } else {
                  postCreateMutation.mutate({ routeId: mainRoute.id, data: postForm });
                }
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#050505] block mb-1">Nama Pos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pos 2 - Mata Air"
                    value={postForm.nama_pos}
                    onChange={(e) => setPostForm({ ...postForm, nama_pos: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#050505] block mb-1">Elevasi (mdpl) *</label>
                  <input
                    type="number"
                    required
                    value={postForm.elevasi}
                    onChange={(e) => setPostForm({ ...postForm, elevasi: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#050505] block mb-1">Deskripsi Pos & Karakteristik</label>
                <textarea
                  rows={2}
                  placeholder="Kondisi shelter, kapasitas tenda, ketersediaan air..."
                  value={postForm.deskripsi}
                  onChange={(e) => setPostForm({ ...postForm, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-[#e7e5e4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={postCreateMutation.isPending || postUpdateMutation.isPending}
                  className="px-5 py-2 bg-[#0D5C3A] text-white font-black rounded-xl hover:bg-[#064e3b] cursor-pointer shadow-md"
                >
                  {editingPost ? 'Simpan Perubahan' : 'Tambah Pos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT GPX TRACK CMS */}
      {/* ============================================================ */}
      {isGpxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e5e4]">
              <h3 className="text-base font-black text-[#050505]">
                {editingGpx ? 'Edit Data File GPX' : 'Daftarkan File GPX Baru'}
              </h3>
              <button 
                onClick={() => setIsGpxModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingGpx) {
                  gpxUpdateMutation.mutate({ id: editingGpx.id, data: gpxForm });
                } else {
                  gpxCreateMutation.mutate({ routeId: mainRoute.id, data: gpxForm });
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-[#050505] block mb-1">Nama File GPX *</label>
                <input
                  type="text"
                  required
                  placeholder="sumbing_via_pencar.gpx"
                  value={gpxForm.nama_file}
                  onChange={(e) => setGpxForm({ ...gpxForm, nama_file: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-[#050505] block mb-1">Unggah File GPX Lokal *</label>
                <input
                  type="file"
                  accept=".gpx"
                  disabled={isUploading}
                  onChange={(e) => {
                    handleLocalFileUpload(e, (url, name, gpxStats) => {
                      if (gpxStats) {
                        setGpxForm({
                          ...gpxForm,
                          file_url: url,
                          nama_file: name || gpxForm.nama_file,
                          total_jarak_km: String(gpxStats.totalDistanceKm),
                          elevasi_gain: String(gpxStats.elevationGain),
                          elevasi_min: String(gpxStats.minElevation),
                          elevasi_max: String(gpxStats.maxElevation),
                          total_waypoints: String(gpxStats.waypointsCount),
                        });
                      } else {
                        setGpxForm({ ...gpxForm, file_url: url, nama_file: name || gpxForm.nama_file });
                      }
                    });
                  }}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                />
                {isUploading && (
                  <p className="mt-1 text-[10px] text-amber-600 animate-pulse font-bold">
                    Mengunggah file GPX...
                  </p>
                )}
                {gpxForm.file_url && !isUploading && (
                  <p className="mt-1 text-[10px] text-emerald-700 font-mono break-all bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    File Terunggah: {gpxForm.file_url}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#050505] block mb-1">Total Elevasi Gain (+m)</label>
                  <input
                    type="number"
                    value={gpxForm.elevasi_gain}
                    onChange={(e) => setGpxForm({ ...gpxForm, elevasi_gain: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#050505] block mb-1">Total Jarak (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gpxForm.total_jarak_km}
                    onChange={(e) => setGpxForm({ ...gpxForm, total_jarak_km: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#050505] block mb-1">Deskripsi Track Navigasi</label>
                <textarea
                  rows={2}
                  placeholder="Format standar GPX 1.1 kompatibel dengan Garmin, Strava, OsmAnd..."
                  value={gpxForm.deskripsi}
                  onChange={(e) => setGpxForm({ ...gpxForm, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-[#e7e5e4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGpxModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={gpxCreateMutation.isPending || gpxUpdateMutation.isPending}
                  className="px-5 py-2 bg-[#0D5C3A] text-white font-black rounded-xl hover:bg-[#064e3b] cursor-pointer shadow-md"
                >
                  Simpan Data GPX
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT ARTIKEL CMS */}
      {/* ============================================================ */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] w-full max-w-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e5e4]">
              <div>
                <span className="text-[10px] font-black text-[#0D5C3A] uppercase">Content Management</span>
                <h3 className="text-lg font-black text-[#050505]">
                  {editingArticle ? 'Edit Artikel Berita' : 'Tulis Artikel Berita Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setIsArticleModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (editingArticle) {
                  articleUpdateMutation.mutate({ id: editingArticle.id, data: articleForm });
                } else {
                  articleCreateMutation.mutate(articleForm);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-[#050505] block mb-1">Judul Artikel *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Himbauan Cuaca & SOP Pendakian Sumbing Via Pencar"
                  value={articleForm.judul}
                  onChange={(e) => setArticleForm({ ...articleForm, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#050505] block mb-1">Kategori</label>
                  <select
                    value={articleForm.category_name}
                    onChange={(e) => setArticleForm({ ...articleForm, category_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs font-bold"
                  >
                    <option value="Pengumuman">Pengumuman</option>
                    <option value="Tips Pendakian">Tips Pendakian</option>
                    <option value="Panduan Jalur">Panduan Jalur</option>
                    <option value="Konservasi">Konservasi</option>
                    <option value="Wisata Sekitar">Wisata Sekitar</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#050505] block mb-1">Unggah Foto Sampul</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) => {
                      handleLocalFileUpload(e, (url) => {
                        setArticleForm({ ...articleForm, foto_sampul: url });
                      });
                    }}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs font-bold"
                  />
                  {isUploading && (
                    <p className="mt-1 text-[10px] text-amber-600 animate-pulse font-bold">
                      Mengunggah foto sampul...
                    </p>
                  )}
                  {articleForm.foto_sampul && !isUploading && (
                    <div className="mt-2 flex items-center gap-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      <img src={articleForm.foto_sampul} className="w-10 h-10 rounded-lg object-cover border" alt="preview" />
                      <span className="text-[10px] text-emerald-750 truncate flex-1 font-mono">{articleForm.foto_sampul}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-[#050505] block mb-1">Ringkasan Singkat (Excerpt)</label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan 1-2 kalimat untuk preview..."
                  value={articleForm.ringkasan}
                  onChange={(e) => setArticleForm({ ...articleForm, ringkasan: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-[#050505] block mb-1">Isi Konten Lengkap Artikel *</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Tuliskan isi artikel lengkap di sini..."
                  value={articleForm.konten}
                  onChange={(e) => setArticleForm({ ...articleForm, konten: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-[#e7e5e4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="px-4 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={articleCreateMutation.isPending || articleUpdateMutation.isPending}
                  className="px-6 py-2.5 bg-[#0D5C3A] text-white font-black rounded-xl hover:bg-[#064e3b] cursor-pointer shadow-md disabled:opacity-50"
                >
                  {editingArticle ? 'Simpan Pembaruan' : 'Terbitkan Artikel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH FOTO GALERI */}
      {/* ============================================================ */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e5e4]">
              <h3 className="text-base font-black text-[#050505]">Tambah Foto ke Galeri</h3>
              <button 
                onClick={() => setIsGalleryModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                galleryCreateMutation.mutate(galleryForm);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-[#050505] block mb-1">Judul / Caption Foto *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sunrise Puncak Sumbing 3.371 mdpl"
                  value={galleryForm.judul}
                  onChange={(e) => setGalleryForm({ ...galleryForm, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#050505] block mb-1">Kategori Foto</label>
                <select
                  value={galleryForm.category_name}
                  onChange={(e) => setGalleryForm({ ...galleryForm, category_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold"
                >
                  <option value="Lanskap & Puncak">Lanskap & Puncak</option>
                  <option value="Savana & Pos">Savana & Pos</option>
                  <option value="Basecamp Bogowonto">Basecamp Bogowonto</option>
                  <option value="Sunrise & Golden Hour">Sunrise & Golden Hour</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#050505] block mb-1">Unggah Foto Dokumentasi *</label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={(e) => {
                    handleLocalFileUpload(e, (url) => {
                      setGalleryForm({ ...galleryForm, url_media: url });
                    });
                  }}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl text-xs font-bold"
                />
                {isUploading && (
                  <p className="mt-1 text-[10px] text-amber-600 animate-pulse font-bold">
                    Mengunggah foto dokumentasi...
                  </p>
                )}
                {galleryForm.url_media && !isUploading && (
                  <div className="mt-2 flex items-center gap-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <img src={galleryForm.url_media} className="w-10 h-10 rounded-lg object-cover border" alt="preview" />
                    <span className="text-[10px] text-emerald-750 truncate flex-1 font-mono">{galleryForm.url_media}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#e7e5e4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF8F5] border border-[#e7e5e4] rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={galleryCreateMutation.isPending}
                  className="px-5 py-2 bg-[#0D5C3A] text-white font-black rounded-xl hover:bg-[#064e3b] cursor-pointer shadow-md disabled:opacity-50"
                >
                  Simpan Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SCANNER QR TIKET / CHECK-IN LOKET */}
      {/* ============================================================ */}
      {isQrScannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] w-full max-w-xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e7e5e4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0D5C3A] text-white flex items-center justify-center shadow-xs">
                  <QrCode className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-wider">Pemindai Loket Basecamp</span>
                  <h3 className="text-lg font-black text-[#050505]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                    Scan QR Code / Verifikasi Tiket
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setIsQrScannerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scanner Mode Switcher Tabs */}
            <div className="flex p-1 bg-[#FAF8F5] border border-[#e7e5e4] rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setScannerTab('camera');
                  setScannedBookingResult(null);
                  setScanErrorMsg('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  scannerTab === 'camera'
                    ? 'bg-[#0D5C3A] text-white shadow-xs'
                    : 'text-[#707070] hover:text-[#050505]'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Kamera HP / Device</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScannerTab('manual');
                  setScannedBookingResult(null);
                  setScanErrorMsg('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  scannerTab === 'manual'
                    ? 'bg-[#0D5C3A] text-white shadow-xs'
                    : 'text-[#707070] hover:text-[#050505]'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Ketik Manual / USB Scanner</span>
              </button>
            </div>

            {/* TAB 1: CAMERA HP / LAPTOP SCANNER VIEWPORT */}
            {scannerTab === 'camera' && !scannedBookingResult && (
              <div className="space-y-4">
                <CameraScannerView
                  onScanSuccess={(decodedText) => handlePerformScanLookup(decodedText)}
                  onScanError={(err) => setScanErrorMsg(err)}
                />

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-[#e7e5e4]">
                  <label className="px-4 py-2 bg-[#FAF8F5] border border-[#e7e5e4] hover:bg-slate-100 text-[#050505] text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                    <Download className="w-4 h-4 text-[#0D5C3A]" />
                    <span>Upload Foto QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrFileUpload}
                      className="hidden"
                    />
                  </label>

                  {bookings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handlePerformScanLookup(bookings[0].kode_booking)}
                      className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>⚡ Simulasikan Scan ({bookings[0].kode_booking})</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL / USB BARCODE SCANNER INPUT */}
            {scannerTab === 'manual' && !scannedBookingResult && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePerformScanLookup(scanCodeInput);
                }}
                className="space-y-3"
              >
                <label className="text-xs font-black text-[#050505] block">
                  Arahkan USB Barcode Gun atau Ketik Kode Booking Tiket:
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="w-4 h-4 text-[#0D5C3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Contoh: SMB-849201 atau TKT-SMB-849201-92..."
                      value={scanCodeInput}
                      onChange={(e) => {
                        setScanCodeInput(e.target.value);
                        if (e.target.value.length >= 10) {
                          handlePerformScanLookup(e.target.value);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border-2 border-[#0D5C3A] rounded-2xl text-xs sm:text-sm font-bold font-mono text-[#050505] uppercase focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isScanningQuery}
                    className="px-6 py-3 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-2xl uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 shrink-0"
                  >
                    {isScanningQuery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Verifikasi</span>
                  </button>
                </div>
              </form>
            )}

            {scanErrorMsg && !scannedBookingResult && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{scanErrorMsg}</span>
              </div>
            )}

            {/* Scanned Result Ticket View */}
            {scannedBookingResult && (
              <div className="space-y-4 pt-4 border-t border-[#e7e5e4]">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0c0a09] to-[#1c1917] text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-amber-300 uppercase block">Hasil Pemindaian QR Tiket</span>
                    <h4 className="text-base font-black font-mono text-amber-300">{scannedBookingResult.kode_booking}</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">Ketua: <strong>{scannedBookingResult.nama_ketua}</strong> &bull; {scannedBookingResult.no_hp}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      scannedBookingResult.status === 'CheckedIn'
                        ? 'bg-blue-500 text-white'
                        : scannedBookingResult.status === 'CheckedOut'
                          ? 'bg-slate-500 text-white'
                          : scannedBookingResult.status === 'Pending' || scannedBookingResult.status === 'Unpaid'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-500 text-white'
                    }`}>
                      {scannedBookingResult.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#e7e5e4]">
                  <div>
                    <span className="text-[10px] text-[#707070] block font-semibold">Jumlah Peserta</span>
                    <span className="font-black text-[#0D5C3A] text-sm">{scannedBookingResult.jumlah_peserta} Orang</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#707070] block font-semibold">Total Tarif SIMAKSI</span>
                    <span className="font-black text-[#050505] text-sm">Rp {(scannedBookingResult.total_harga || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#707070] block font-semibold">Tanggal Naik</span>
                    <span className="font-bold text-[#050505]">{new Date(scannedBookingResult.tanggal_naik).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#707070] block font-semibold">Tanggal Turun</span>
                    <span className="font-bold text-[#050505]">{new Date(scannedBookingResult.tanggal_turun).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#707070] block font-semibold">Waktu Check-In Loket</span>
                    <span className="font-bold text-blue-700">
                      {scannedBookingResult.ticket?.checked_in_at 
                        ? new Date(scannedBookingResult.ticket.checked_in_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
                        : <span className="text-slate-400 font-normal italic">Belum Check-In</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#707070] block font-semibold">Waktu Check-Out Selesai</span>
                    <span className="font-bold text-slate-700">
                      {scannedBookingResult.ticket?.checked_out_at 
                        ? new Date(scannedBookingResult.ticket.checked_out_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
                        : <span className="text-slate-400 font-normal italic">Belum Check-Out</span>}
                    </span>
                  </div>
                </div>

                {/* Hiker List */}
                <div>
                  <span className="text-[10px] font-black text-[#707070] uppercase block mb-1.5">Anggota Rombongan:</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {scannedBookingResult.members?.map((m: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-xl bg-[#FAF8F5] border border-[#e7e5e4] text-xs flex justify-between items-center">
                        <span className="font-bold text-[#050505]">{idx + 1}. {m.nama_lengkap} {m.is_ketua ? '(Ketua)' : ''}</span>
                        <span className="text-[10px] text-[#707070] font-mono">NIK: {m.nik || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons for Basecamp Officers */}
                <div className="pt-3 border-t border-[#e7e5e4] space-y-2">
                  {(scannedBookingResult.status === 'Paid' || scannedBookingResult.status === 'Confirmed') && (
                    <button
                      onClick={async () => {
                        await bookingStatusMutation.mutateAsync({ id: scannedBookingResult.id, status: 'CheckedIn' });
                        const res = await getBookingByCode(scannedBookingResult.kode_booking);
                        if (res.success) setScannedBookingResult(res.data);
                        alert('🟢 CHECK-IN BERHASIL! Rombongan ' + scannedBookingResult.nama_ketua + ' dipersilakan naik.');
                      }}
                      disabled={bookingStatusMutation.isPending}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>🟢 PROSES CHECK-IN LOKET SEKARANG</span>
                    </button>
                  )}

                  {scannedBookingResult.status === 'CheckedIn' && (
                    <button
                      onClick={async () => {
                        await bookingStatusMutation.mutateAsync({ id: scannedBookingResult.id, status: 'CheckedOut' });
                        const res = await getBookingByCode(scannedBookingResult.kode_booking);
                        if (res.success) setScannedBookingResult(res.data);
                        alert('🔵 CHECK-OUT BERHASIL! Rombongan ' + scannedBookingResult.nama_ketua + ' telah resmi melapor selesai turun.');
                      }}
                      disabled={bookingStatusMutation.isPending}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>🔵 PROSES CHECK-OUT SELESAI TURUN</span>
                    </button>
                  )}

                  {(scannedBookingResult.status === 'Pending' || scannedBookingResult.status === 'Unpaid') && (
                    <button
                      onClick={async () => {
                        await bookingStatusMutation.mutateAsync({ id: scannedBookingResult.id, status: 'Paid' });
                        const res = await getBookingByCode(scannedBookingResult.kode_booking);
                        if (res.success) setScannedBookingResult(res.data);
                        alert('🟡 KONFIRMASI BAYAR BERHASIL! Pembayaran tunai diterima.');
                      }}
                      disabled={bookingStatusMutation.isPending}
                      className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>🟡 KONFIRMASI PEMBAYARAN TUNAI LOKET</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#e7e5e4] flex justify-end">
              <button
                type="button"
                onClick={() => setIsQrScannerModalOpen(false)}
                className="px-5 py-2.5 bg-[#FAF8F5] border border-[#e7e5e4] text-xs font-bold text-[#050505] rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Selesai / Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
