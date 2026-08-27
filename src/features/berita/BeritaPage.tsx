import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAllPublicData } from '../../services/api';
import { 
  Newspaper, Search, Calendar, Eye, Tag, Loader2, 
  ArrowLeft, Clock, User, Share2, CornerDownRight,
  Bookmark, CheckCircle2, AlertCircle, ArrowRight,
  Flame, Sparkles, MessageCircle, Link2
} from 'lucide-react';
import { formatPlainTextToHtml } from '../../utils/textFormatter';

interface ArticleCategory {
  id: string;
  nama_kategori: string;
  slug: string;
}

interface ArticleItem {
  id: string;
  judul: string;
  slug: string;
  ringkasan: string;
  konten: string;
  foto_sampul?: string;
  tanggal_terbit?: string | Date;
  views?: number;
  is_featured?: boolean;
  category?: {
    nama_kategori: string;
  };
}

const DEFAULT_CATEGORIES: ArticleCategory[] = [
  { id: 'cat-1', nama_kategori: 'Pengumuman', slug: 'pengumuman' },
  { id: 'cat-2', nama_kategori: 'Tips Pendakian', slug: 'tips-pendakian' },
  { id: 'cat-3', nama_kategori: 'Panduan Jalur', slug: 'panduan-jalur' },
  { id: 'cat-4', nama_kategori: 'Konservasi', slug: 'konservasi' },
  { id: 'cat-5', nama_kategori: 'Wisata Sekitar', slug: 'wisata-sekitar' },
];

const DEFAULT_ARTICLES: ArticleItem[] = [
  {
    id: 'art-1',
    judul: 'Penyesuaian Tarif SIMAKSI & Sistem Reservasi Online Basecamp Bogowonto 2026',
    slug: 'penyesuaian-tarif-simaksi-2026',
    category: { nama_kategori: 'Pengumuman' },
    is_featured: true,
    foto_sampul: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: '2026-08-01T08:00:00.000Z',
    views: 1420,
    ringkasan: 'Mulai 1 Agustus 2026, Basecamp Gunung Sumbing Via Pencar memberlakukan sistem registrasi tiket digital QR terpadu untuk efisiensi check-in dan asuransi pendakian resmi.',
    konten: `
      <p class="lead">Pengelola Basecamp Bogowonto resmi meluncurkan pembaruan regulasi pendakian Gunung Sumbing Via Pencar untuk periode tahun 2026. Pembaruan ini menitikberatkan pada kemudahan registrasi online, peningkatan standar keselamatan pendaki, serta perlindungan asuransi resmi.</p>
      
      <h3>1. Tarif Tiket & Asuransi Resmi</h3>
      <p>Berdasarkan musyawarah pengelola basecamp bersama pihak terkait, tarif retribusi pendakian (SIMAKSI) Gunung Sumbing Via Pencar ditetapkan sebesar <strong>Rp 35.000,- per orang</strong>. Tarif tersebut sudah mencakup:</p>
      <ul>
        <li>Izin masuk kawasan pendakian resmi (SIMAKSI).</li>
        <li>Asuransi kecelakaan diri dari PT Asuransi Jasa Raharja Putera selama masa pendakian.</li>
        <li>Akses fasilitas basecamp (toilet, mushola, tempat istirahat, dan area charge baterai).</li>
        <li>Penyediaan kantong sampah resmi (trash bag) untuk dibawa turun.</li>
      </ul>

      <blockquote>
        "Sistem digital ini kami buat agar para pendaki tidak perlu mengantre panjang saat proses registrasi fisik di basecamp. Cukup tunjukkan tiket QR digital saat tiba di pos registrasi."
      </blockquote>

      <h3>2. Ketentuan Jam Operasional & Registrasi</h3>
      <p>Proses check-in dan briefing keselamatan di Basecamp Bogowonto dibuka mulai pukul <strong>07:00 WIB hingga 18:00 WIB</strong> setiap hari. Bagi rombongan yang tiba di luar jam operasional, dipersilakan beristirahat di area basecamp atau homestay mitra yang telah disediakan sebelum memulai pendakian keesokan harinya.</p>

      <h3>3. Prosedur Wajib Check-In & Check-Out</h3>
      <ol>
        <li>Tunjukkan bukti booking tiket QR digital kepada petugas di loket registrasi.</li>
        <li>Lakukan verifikasi identitas (KTP/SIM/Kartu Pelajar) seluruh anggota rombongan.</li>
        <li>Petugas akan melakukan pemeriksaan perlengkapan wajib dan mencatat checklist logistik sampah.</li>
        <li>Saat turun dari pendakian, ketua rombongan wajib melapor di pos check-out dan menyerahkan sampah sesuai checklist untuk mendapatkan kembali kartu identitas.</li>
      </ol>
    `,
  },
  {
    id: 'art-2',
    judul: 'Panduan Fisik & Perlengkapan Wajib Mendaki Puncak Sumbing Via Pencar',
    slug: 'panduan-fisik-dan-perlengkapan-sumbing',
    category: { nama_kategori: 'Tips Pendakian' },
    is_featured: true,
    foto_sampul: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: '2026-08-05T09:30:00.000Z',
    views: 980,
    ringkasan: 'Persiapan fisik esensial, rekomendasi checklist logistik, sistem layer pakaian gunung, serta manajemen air sebelum menaklukkan medan sabana dan bebatuan Gunung Sumbing.',
    konten: `
      <p class="lead">Gunung Sumbing (3.371 mdpl) adalah salah satu atap tertinggi di Pulau Jawa dengan rute yang menantang dan vegetasi terbuka. Mempersiapkan fisik dan perlengkapan yang tepat adalah kunci utama keberhasilan dan keselamatan pendakian Anda.</p>

      <h3>A. Latihan Fisik Minimal 2 Minggu Sebelum Pendakian</h3>
      <p>Jalur Via Pencar memiliki elevasi gain lebih dari 1.800 meter dengan gradien tanjakan yang konsisten. Lakukan latihan fisik teratur berikut:</p>
      <ul>
        <li><strong>Jogging atau Bersekolah:</strong> 3-4 kali seminggu selama 30-45 menit untuk melatih kapasitas aerobik dan stamina paru-paru.</li>
        <li><strong>Latihan Beban Kaki:</strong> Squat, lunge, dan calf raise untuk memperkuat otot paha dan betis saat menanjak membawa carrier.</li>
        <li><strong>Latihan Naik Turun Tangga:</strong> Simulasi medan tanjakan dengan membawa beban ransel 5-10 kg.</li>
      </ul>

      <h3>B. Checklist Perlengkapan Wajib (Standar Basecamp)</h3>
      <p>Setiap kelompok pendaki wajib membawa perlengkapan standar berikut:</p>
      <ul>
        <li>Tenda dome double-layer tahan angin & badai.</li>
        <li>Sleeping bag dengan batas kenyamanan (comfort limit) minimal 10°C - 5°C.</li>
        <li>Matras aluminium foil atau matras angin (inflatable mat).</li>
        <li>Jaket windproof, jaket insulasi (fleece/down jacket), dan jas hujan/ponco.</li>
        <li>Headlamp atau senter dengan baterai cadangan.</li>
        <li>Kompor portable, nesting, dan logistik makanan tinggi kalori yang cukup.</li>
        <li>Kotak P3K pribadi (obat luka, paracetamol, oralit, plester, dan obat pribadi).</li>
      </ul>

      <h3>C. Manajemen Persediaan Air</h3>
      <p>Sumber air di jalur Via Pencar terdapat di area Basecamp dan titik dekat Pos 2. Di atas Pos 3 hingga Puncak, tidak terdapat sumber mata air permanen. Disarankan membawa minimal <strong>3 liter air bersih per orang</strong> untuk kebutuhan mendaki dan memasak di area camp.</p>
    `,
  },
  {
    id: 'art-3',
    judul: 'Aksi Bersih Jalur & Konservasi Alam: Menjaga Kelestarian Sabana Sumbing',
    slug: 'aksi-bersih-jalur-konservasi-sumbing',
    category: { nama_kategori: 'Konservasi' },
    foto_sampul: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: '2026-08-08T14:15:00.000Z',
    views: 650,
    ringkasan: 'Gerakan peduli lingkungan zero waste di sepanjang Pos 1 hingga Pos 4 Pencar Atas bersama komunitas relawan dan pengelola Basecamp Bogowonto.',
    konten: `
      <p class="lead">Kelestarian alam dan kebersihan ekosistem Gunung Sumbing merupakan tanggung jawab bersama. Basecamp Bogowonto bersama komunitas pendaki pecinta alam rutin menyelenggarakan program bersih gunung (Clean-Up Trail) dan penanaman pohon penahan erosi.</p>

      <h3>Prinsip Leave No Trace (LNT) di Jalur Bogowonto</h3>
      <p>Kami mengajak seluruh pendaki untuk secara disiplin menerapkan 7 prinsip dasar kelestarian alam:</p>
      <ul>
        <li><strong>Rencanakan dan Persiapkan:</strong> Kurangi kemasan plastik sekali pakai sejak di basecamp. Pindahkan logistik ke wadah guna ulang (reusable container).</li>
        <li><strong>Bawa Pulang Sampahmu:</strong> Jangan tinggalkan puntung rokok, bungkus makanan, atau tisu basah di sepanjang jalur pendakian.</li>
        <li><strong>Hargai Satwa & Tumbuhan:</strong> Dilarang keras memetik bunga edelweiss atau menebang ranting pohon untuk kayu bakar.</li>
        <li><strong>Gunakan Api Unggun dengan Bijak:</strong> Hindari membuat api unggun di area semak kering demi mencegah potensi kebakaran hutan.</li>
      </ul>

      <blockquote>
        "Jangan mengambil apa pun selain foto, jangan meninggalkan apa pun selain jejak, dan jangan membunuh apa pun selain waktu."
      </blockquote>
    `,
  },
  {
    id: 'art-4',
    judul: 'Eksplorasi Jalur Sabana & Sunrise Camp: Titik Terbaik Menikmati Lautan Awan',
    slug: 'eksplorasi-jalur-sabana-sunrise-camp',
    category: { nama_kategori: 'Panduan Jalur' },
    foto_sampul: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: '2026-08-10T11:00:00.000Z',
    views: 890,
    ringkasan: 'Menelusuri keindahan bentang alam padang sabana, formasi bebatuan Pos 3 Batu Belah, serta spot berkemah Sunrise Camp yang memukau di lereng Sumbing.',
    konten: `
      <p class="lead">Jalur pendakian Gunung Sumbing Via Pencar menawarkan panorama yang sangat bervariasi. Dari area kebun tembakau dan sayuran warga di lereng bawah, hutan pinus yang teduh, hingga padang sabana luas berhias rumput ilalang keemasan.</p>

      <h3>Spot Favorit di Sepanjang Rute</h3>
      <ul>
        <li><strong>Pos 2 Genitri:</strong> Tempat istirahat teduh yang nyaman dengan semilir angin sejuk dan rindang pepohonan.</li>
        <li><strong>Pos 3 Batu Belah:</strong> Formasi batuan vulkanik unik yang menjadi ikon jalur Via Pencar, cocok untuk spot berfoto dengan latar lembah Wonosobo.</li>
        <li><strong>Sunrise Camp (2.300 mdpl):</strong> Area datar ideal untuk mendirikan tenda camp. Dari titik ini, Anda dapat menikmati pemandangan matahari terbit dengan lautan awan yang membentang luas menutupi lembah Sindoro dan Dieng.</li>
        <li><strong>Pos 4 Padang Sabana:</strong> Hamparan sabana hijau terbuka yang mempesona menjelang tanjakan batu terjal menuju puncak.</li>
      </ul>
    `,
  },
  {
    id: 'art-5',
    judul: 'Rekomendasi Kuliner Khas & Homestay Nyaman di Sekitar Pencar Kalikajar',
    slug: 'kuliner-khas-dan-homestay-kalikajar',
    category: { nama_kategori: 'Wisata Sekitar' },
    foto_sampul: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: '2026-08-11T16:20:00.000Z',
    views: 520,
    ringkasan: 'Daftar homestay ramah pendaki, warung kopi lokal penghangat tubuh, dan produk UMKM khas lereng Gunung Sumbing yang wajib dicoba.',
    konten: `
      <p class="lead">Perjalanan mendaki Gunung Sumbing tidak hanya tentang menaklukkan puncak, namun juga tentang menikmati kehangatan keramahan warga desa Pencar Atas dan kelezatan kuliner lokal pegunungan.</p>

      <h3>Homestay Nyaman Mitra Basecamp Bogowonto</h3>
      <p>Bagi pendaki yang menempuh perjalanan jauh dari luar kota, tersedia puluhan homestay milik warga desa di sekitar basecamp dengan tarif terjangkau (mulai Rp 75.000 - Rp 150.000 per kamar). Fasilitas mencakup kasur empuk, air hangat, colokan listrik, serta suguhan teh atau kopi lokal hangat.</p>

      <h3>Kuliner Wajib Dicoba:</h3>
      <ul>
        <li><strong>Tempe Kemul Hangat:</strong> Tempe goreng berbalut tepung kunyit renyah dengan taburan daun kucai, nikmat disantap dengan cabai rawit saat udara dingin.</li>
        <li><strong>Kopi Arabika Sumbing:</strong> Biji kopi asli hasil perkebunan lereng Sumbing dengan aroma floral dan rasa fruity yang khas.</li>
        <li><strong>Mie Ongklok Wonosobo:</strong> Kuliner legendaris dengan kuah kental gurih manis bertabur sate sapi empuk.</li>
      </ul>
    `,
  },
  {
    id: 'art-6',
    judul: 'Strategi Pencegahan Hipotermia dan Mountain Sickness (AMS) di Ketinggian',
    slug: 'strategi-mengatasi-hipotermia-dan-ams',
    category: { nama_kategori: 'Tips Pendakian' },
    foto_sampul: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: '2026-08-12T07:00:00.000Z',
    views: 740,
    ringkasan: 'Langkah preventif dan penanganan pertama darurat saat menghadapi penurunan suhu tubuh drastis atau gejala pusing di ketinggian di atas 2.500 mdpl.',
    konten: `
      <p class="lead">Suhu di area camp dan puncak Gunung Sumbing pada malam hari dapat turun hingga 5°C - 2°C, bahkan mendekati titik beku pada puncak musim kemarau. Memahami tanda-tanda hipotermia dan Acute Mountain Sickness (AMS) adalah pengetahuan krusial bagi setiap pendaki.</p>

      <h3>A. Prinsip 3-Layer Pakaian</h3>
      <p>Gunakan sistem pelapisan pakaian yang tepat untuk menjaga suhu inti tubuh tetap stabil:</p>
      <ul>
        <li><strong>Base Layer:</strong> Pakaian dalam sintetis cepat kering (quick-dry/merino wool) yang menyerap keringat dan tidak menahan kelembapan. Hindari bahan katun tebal!</li>
        <li><strong>Mid Layer:</strong> Jaket fleece, rajut hangat, atau down jacket ringan untuk memerangkap panas tubuh.</li>
        <li><strong>Outer Layer:</strong> Jaket windproof dan waterproof (Gore-Tex / Hardshell) untuk melindungi dari terpaan angin dingin dan hujan kabut.</li>
      </ul>

      <h3>B. Pertolongan Pertama Hipotermia di Tenda</h3>
      <ol>
        <li>Segera ganti seluruh pakaian yang basah atau lembap dengan pakaian kering.</li>
        <li>Bungkus tubuh korban dengan emergency blanket (foil) sebelum dimasukkan ke dalam sleeping bag tebal.</li>
        <li>Berikan minuman manis hangat (teh manis atau cokelat panas), hindari kopi berkafein tinggi atau alkohol.</li>
        <li>Jika kondisi tidak kunjung membaik, segera hubungi nomor darurat Basecamp Bogowonto untuk penjemputan tim medis evakuasi.</li>
      </ol>
    `,
  },
  {
    id: 'art-7',
    judul: 'Spot Foto Terbaik & Waktu Golden Hour di Sepanjang Jalur Sabana Pencar',
    slug: 'spot-foto-golden-hour-pencar',
    category: { nama_kategori: 'Panduan Jalur' },
    foto_sampul: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: '2026-08-12T09:15:00.000Z',
    views: 410,
    ringkasan: 'Rekomendasi titik pengambilan gambar lanskap terbaik dari Pos Ojek, hutan pinus, hingga sabana Pos 4 dengan latar belakang Gunung Sindoro.',
    konten: `
      <p class="lead">Bagi para pecinta fotografi alam bebas, jalur pendakian Gunung Sumbing Via Pencar menyajikan sudut pandang unik yang sangat fotogenik sepanjang perjalanan.</p>
      <h3>Titik Foto Wajib Dikunjungi</h3>
      <ul>
        <li><strong>Sunrise Camp (Pukul 05:15 - 05:45 WIB):</strong> Momen matahari terbit dengan lautan awan yang membentang luas.</li>
        <li><strong>Pos 3 Batu Belah:</strong> Siluet bebatuan besar dengan latar belakang lereng gunung yang dramatis.</li>
        <li><strong>Sabana Pos 4:</strong> Padang ilalang keemasan saat terkena sinar matahari sore (golden hour).</li>
      </ul>
    `,
  },
  {
    id: 'art-8',
    judul: 'Tips Memilih Jasa Porter dan Guide Resmi Basecamp Bogowonto',
    slug: 'tips-memilih-porter-dan-guide-resmi',
    category: { nama_kategori: 'Tips Pendakian' },
    foto_sampul: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: '2026-08-12T10:00:00.000Z',
    views: 320,
    ringkasan: 'Kenali keunggulan menggunakan porter dan guide lokal berlisensi untuk kenyamanan, keamanan logistik, serta navigasi rute selama pendakian.',
    konten: `
      <p class="lead">Menggunakan jasa porter dan guide resmi dari Basecamp Bogowonto adalah pilihan tepat untuk memastikan pendakian berlangsung aman, nyaman, dan terorganisir.</p>
      <h3>Keuntungan Menggunakan Layanan Resmi:</h3>
      <ul>
        <li>Porter terlatih membawa beban logistik hingga 20 kg dengan aman.</li>
        <li>Guide lokal memahami navigasi jalur, perubahan cuaca mikro, dan prosedur P3K darurat.</li>
        <li>Membantu langsung perekonomian masyarakat lokal desa Pencar Atas.</li>
      </ul>
    `,
  },
  {
    id: 'art-9',
    judul: 'Panduan Navigasi GPS Offline Menggunakan File GPX Sumbing Via Pencar',
    slug: 'panduan-navigasi-gps-offline-gpx',
    category: { nama_kategori: 'Panduan Jalur' },
    foto_sampul: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: '2026-08-12T11:20:00.000Z',
    views: 530,
    ringkasan: 'Langkah mudah mengunduh dan mengimpor file peta GPX ke aplikasi smartphone seperti Avenza Maps, OsmAnd, atau Gaia GPS sebelum naik.',
    konten: `
      <p class="lead">Meskipun jalur Via Pencar memiliki patok pos yang jelas, memiliki peta navigasi digital offline di ponsel pintar sangat disarankan untuk mengantisipasi kabut tebal malam hari.</p>
      <h3>Cara Menggunakan File GPX:</h3>
      <ol>
        <li>Unduh file GPX resmi melalui menu Profil Jalur di website ini.</li>
        <li>Buka aplikasi peta offline (Avenza Maps, Gaia GPS, atau GPX Viewer).</li>
        <li>Impor file GPX dan simpan layer peta offline sebelum meninggalkan basecamp.</li>
      </ol>
    `,
  },
  {
    id: 'art-10',
    judul: 'Prakiraan Cuaca & Waktu Pendakian Terbaik Bulan Ini di Sumbing',
    slug: 'prakiraan-cuaca-dan-waktu-terbaik-mendaki',
    category: { nama_kategori: 'Pengumuman' },
    foto_sampul: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: '2026-08-12T12:00:00.000Z',
    views: 680,
    ringkasan: 'Update kondisi meteorologi, pola angin lereng barat daya, dan tips memilih tanggal pendakian dengan probabilitas langit cerah tertinggi.',
    konten: `
      <p class="lead">Berdasarkan data stasiun cuaca lereng Sumbing, bulan ini didominasi cuaca cerah berawan dengan kecepatan angin sedang di siang hari dan penurunan suhu di malam hari.</p>
      <h3>Rekomendasi Waktu Pendakian:</h3>
      <ul>
        <li><strong>Hari Jumat - Minggu:</strong> Cocok untuk pendakian akhir pekan dengan layanan operasional basecamp penuh.</li>
        <li><strong>Hari Kerja (Weekday):</strong> Direkomendasikan bagi pendaki yang menginginkan suasana hening dan tidak padat di area camp.</li>
      </ul>
    `,
  }
];

export default function BeritaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const slugFromUrl = searchParams.get('slug');
  const catFromUrl = searchParams.get('category');

  const [selectedCategory, setSelectedCategory] = useState<string>(catFromUrl || 'Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [readingArticleSlug, setReadingArticleSlug] = useState<string | null>(slugFromUrl);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync state with URL search params
  useEffect(() => {
    if (slugFromUrl) {
      setReadingArticleSlug(slugFromUrl);
    } else {
      setReadingArticleSlug(null);
    }
    if (catFromUrl) {
      setSelectedCategory(catFromUrl);
    }
  }, [slugFromUrl, catFromUrl]);

  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ['publicAllData'],
    queryFn: fetchAllPublicData,
    retry: 1,
  });

  const publicData = apiResponse?.data || {};
  const rawArticles: ArticleItem[] = (publicData.articles && publicData.articles.length > 0)
    ? publicData.articles
    : DEFAULT_ARTICLES;

  // Merge default categories with API categories
  const apiCategories: ArticleCategory[] = publicData.articleCategories || [];
  const categories: ArticleCategory[] = apiCategories.length > 0
    ? apiCategories
    : DEFAULT_CATEGORIES;

  // Combine articles with defaults so we always have a full rich list
  const combinedArticles = [...rawArticles];
  DEFAULT_ARTICLES.forEach((def) => {
    if (!combinedArticles.some((a) => a.slug === def.slug)) {
      combinedArticles.push(def);
    }
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 8;

  // Filtered Articles
  let filtered = [...combinedArticles];

  if (selectedCategory !== 'Semua') {
    filtered = filtered.filter(
      (art) =>
        art.category?.nama_kategori?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (art) =>
        art.judul.toLowerCase().includes(q) ||
        (art.ringkasan && art.ringkasan.toLowerCase().includes(q))
    );
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedArticles = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeArticle = combinedArticles.find((a) => a.slug === readingArticleSlug);

  // Related articles (same category or others)
  const relatedArticles = combinedArticles
    .filter((a) => a.slug !== readingArticleSlug)
    .slice(0, 3);

  const handleOpenArticle = (slug: string) => {
    setReadingArticleSlug(slug);
    setSearchParams({ slug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setReadingArticleSlug(null);
    setSearchParams({});
  };

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentPage(1);
    if (catName === 'Semua') {
      setSearchParams({});
    } else {
      setSearchParams({ category: catName });
    }
  };

  const handleShare = (art: ArticleItem) => {
    const currentUrl = window.location.origin + `/berita?slug=${art.slug}`;
    if (navigator.share) {
      navigator.share({
        title: art.judul,
        text: art.ringkasan,
        url: currentUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoading && !apiResponse && combinedArticles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#FAF8F5] font-sans">
        <Loader2 className="w-10 h-10 text-[#0D5C3A] animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500 dark:text-[#707070] tracking-wider animate-pulse uppercase">
          Memuat Berita Bogowonto...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[var(--header-height)] bg-[#FAF8F5] dark:bg-[#FAF8F5]">
      
      {/* ===== ARTICLE DETAILED VIEW ===== */}
      <AnimatePresence mode="wait">
        {readingArticleSlug && activeArticle ? (
          <motion.div
            key="article-detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="container-app py-10 max-w-4xl"
          >
            {/* Top Navigation & Share Bar */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBackToList}
                className="group inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#050505] dark:text-[#050505] hover:text-white bg-white dark:bg-[#F4F0E8] hover:bg-[#0D5C3A] dark:hover:bg-[#0D5C3A] border border-[#e7e5e4] rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Semua Berita</span>
              </button>

              <button 
                onClick={() => handleShare(activeArticle)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#0D5C3A] bg-emerald-50 hover:bg-[#0D5C3A] hover:text-white rounded-xl border border-emerald-100 shadow-2xs transition-all cursor-pointer"
                title="Bagikan artikel"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tautan Disalin!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Bagikan</span>
                  </>
                )}
              </button>
            </div>

            {/* Article Category & Title Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D5C3A]/10 text-[#0D5C3A] text-xs font-bold uppercase tracking-wider mb-4">
                <Tag className="w-3.5 h-3.5" />
                <span>{activeArticle.category?.nama_kategori || 'Pengumuman'}</span>
              </div>

              <h1 
                className="text-[#050505] dark:text-[#050505] text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight mb-4"
                style={{ fontFamily: "'Lora', Georgia, serif" }}
              >
                {activeArticle.judul}
              </h1>

              {/* Meta information row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#707070] pb-6 border-b border-[#e7e5e4]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-[#0D5C3A]" />
                  {activeArticle.tanggal_terbit 
                    ? new Date(activeArticle.tanggal_terbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Baru saja'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-[#0D5C3A]" />
                  4 Menit Membaca
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <User className="w-4 h-4 text-[#0D5C3A]" />
                  Pengelola Basecamp Bogowonto
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Eye className="w-4 h-4 text-[#0D5C3A]" />
                  {activeArticle.views || 350} Pembaca
                </span>
              </div>
            </div>

            {/* Article Main Hero Cover Image */}
            <div className="h-64 sm:h-96 md:h-[440px] w-full rounded-3xl overflow-hidden bg-[#EBE7DF] relative mb-8 shadow-sm border border-[#e7e5e4]">
              {activeArticle.foto_sampul ? (
                <img
                  src={activeArticle.foto_sampul}
                  alt={activeArticle.judul}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Newspaper className="w-16 h-16 text-[#d4c9a8]" />
                </div>
              )}
            </div>

            {/* Summary / Excerpt Callout */}
            <div className="p-5 sm:p-6 bg-[#F4F0E8] dark:bg-[#F4F0E8] rounded-2xl border-l-4 border-[#0D5C3A] mb-8 shadow-2xs">
              <p className="text-[#050505] text-sm sm:text-base font-semibold leading-relaxed italic">
                "{activeArticle.ringkasan}"
              </p>
            </div>

            {/* Content Body */}
            <div 
              className="prose prose-slate max-w-none text-[#292524] text-sm sm:text-base leading-relaxed space-y-5 article-body"
              dangerouslySetInnerHTML={{ __html: formatPlainTextToHtml(activeArticle.konten) }}
            />

            {/* Bottom Call to Action for Hikers */}
            <div className="mt-12 p-8 bg-gradient-to-br from-[#0c0a09] to-[#1c1917] rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">Siap Mendaki Sumbing?</span>
                <h3 className="font-display font-black text-xl sm:text-2xl mt-1">
                  Reservasi SIMAKSI Online Sekarang
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  Dapatkan tiket digital dengan verifikasi cepat di Basecamp Bogowonto Via Pencar.
                </p>
              </div>
              <Link
                to="/reservasi"
                className="px-6 py-3.5 bg-[#0D5C3A] hover:bg-[#064e3b] text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-lg flex-shrink-0 transition-all flex items-center gap-2"
              >
                <span>Daftar Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-16 pt-10 border-t border-[#e7e5e4]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-black text-xl text-[#050505]">
                    Artikel & Pengumuman Terkait
                  </h3>
                  <button
                    onClick={handleBackToList}
                    className="text-xs font-bold text-[#0D5C3A] hover:underline"
                  >
                    Lihat Semua ➔
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {relatedArticles.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => handleOpenArticle(rel.slug)}
                      className="bg-white dark:bg-[#F4F0E8] rounded-2xl border border-[#e7e5e4] p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col"
                    >
                      <div className="h-32 rounded-xl overflow-hidden mb-3 bg-[#EBE7DF]">
                        {rel.foto_sampul && (
                          <img
                            src={rel.foto_sampul}
                            alt={rel.judul}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-[#0D5C3A] uppercase tracking-wider mb-1">
                        {rel.category?.nama_kategori || 'Berita'}
                      </span>
                      <h4 className="font-bold text-xs text-[#050505] leading-snug group-hover:text-[#0D5C3A] transition-colors line-clamp-2 mb-2">
                        {rel.judul}
                      </h4>
                      <p className="text-[11px] text-[#707070] line-clamp-2 mt-auto">
                        {rel.ringkasan}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        ) : (
          <motion.div 
            key="article-list" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            {/* Header Hero Banner */}
            <section className="relative py-20 bg-gradient-to-b from-[#1a1a14] via-[#23231a] to-[#1a1a14] text-white overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0D5C3A_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="container-app relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-amber-300 text-xs font-bold mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Portal Berita & Informasi Resmi</span>
                </div>
                <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl mb-4 tracking-tight">
                  Kabar & Informasi Basecamp Bogowonto
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
                  Pusat rilis informasi resmi mengenai kondisi cuaca jalur Pencar, aturan SIMAKSI, tips keselamatan, agenda konservasi alam, dan kegiatan komunitas pendaki Gunung Sumbing.
                </p>
              </div>
            </section>

            {/* Main Content: Search, Filter, Grid */}
            <section className="section-padding">
              <div className="container-app max-w-7xl">
                
                {/* Search & Category Tabs */}
                <div className="space-y-6 mb-10">
                  
                  {/* Search Bar */}
                  <div className="relative max-w-xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#707070]" />
                    <input 
                      type="text" 
                      placeholder="Cari judul artikel, topik pendakian, atau pengumuman..." 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#F4F0E8] border border-[#e7e5e4] rounded-2xl text-xs sm:text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/30 focus:border-[#0D5C3A] text-[#050505]" 
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#707070] hover:text-[#050505]"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
                    <button 
                      onClick={() => handleSelectCategory('Semua')}
                      className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                        selectedCategory === 'Semua' 
                          ? 'bg-[#0D5C3A] text-white shadow-md' 
                          : 'bg-white dark:bg-[#F4F0E8] text-[#292524] hover:bg-emerald-50 border border-[#e7e5e4]'
                      }`}
                    >
                      Semua ({combinedArticles.length})
                    </button>
                    {categories.map((cat) => {
                      const count = combinedArticles.filter(
                        (a) => a.category?.nama_kategori?.toLowerCase() === cat.nama_kategori.toLowerCase()
                      ).length;
                      return (
                        <button 
                          key={cat.id}
                          onClick={() => handleSelectCategory(cat.nama_kategori)}
                          className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                            selectedCategory.toLowerCase() === cat.nama_kategori.toLowerCase() 
                              ? 'bg-[#0D5C3A] text-white shadow-md' 
                              : 'bg-white dark:bg-[#F4F0E8] text-[#292524] hover:bg-emerald-50 border border-[#e7e5e4]'
                          }`}
                        >
                          {cat.nama_kategori} {count > 0 ? `(${count})` : ''}
                        </button>
                      );
                    })}
                  </div>

                </div>

                {/* Featured Headline Article (shown if not searching and on 'Semua' tab and on page 1) */}
                {selectedCategory === 'Semua' && !searchQuery && currentPage === 1 && combinedArticles.length > 0 && (
                  <div className="mb-10">
                    <div 
                      onClick={() => handleOpenArticle(combinedArticles[0].slug)}
                      className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group grid grid-cols-1 lg:grid-cols-12 gap-0"
                    >
                      <div className="lg:col-span-7 h-56 sm:h-72 lg:h-auto relative overflow-hidden bg-[#EBE7DF]">
                        {combinedArticles[0].foto_sampul && (
                          <img
                            src={combinedArticles[0].foto_sampul}
                            alt={combinedArticles[0].judul}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        )}
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 rounded-full bg-[#0D5C3A] text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                            ⭐ UTAMA • {combinedArticles[0].category?.nama_kategori}
                          </span>
                        </div>
                      </div>

                      <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 text-xs font-semibold text-[#707070] mb-2.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#0D5C3A]" />
                              {new Date(combinedArticles[0].tanggal_terbit || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              4 mnt baca
                            </span>
                          </div>

                          <h2 
                            className="text-[#050505] text-lg sm:text-xl font-black leading-snug mb-3 group-hover:text-[#0D5C3A] transition-colors"
                            style={{ fontFamily: "'Lora', Georgia, serif" }}
                          >
                            {combinedArticles[0].judul}
                          </h2>

                          <p className="text-xs text-[#475569] leading-relaxed line-clamp-3 mb-4">
                            {combinedArticles[0].ringkasan}
                          </p>
                        </div>

                        <div className="pt-3.5 border-t border-[#e7e5e4] flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-xs font-black text-[#0D5C3A] uppercase tracking-wider">
                            <span>Baca Ulasan Lengkap</span>
                            <CornerDownRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </span>
                          <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-[#0D5C3A] group-hover:bg-[#0D5C3A] group-hover:text-white transition-colors">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* News Cards Grid: 4 to 5 cards per row on large screens */}
                <div id="articles-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {paginatedArticles.length > 0 ? (
                    paginatedArticles.map((art, i) => (
                      <motion.article
                        key={art.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => handleOpenArticle(art.slug)}
                        className="bg-white dark:bg-[#FAF8F5] rounded-2xl border border-[#e7e5e4] overflow-hidden shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          {/* Image Thumbnail */}
                          <div className="h-36 sm:h-38 relative bg-[#EBE7DF] overflow-hidden">
                            {art.foto_sampul ? (
                              <img 
                                src={art.foto_sampul} 
                                alt={art.judul} 
                                className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Newspaper className="w-10 h-10 text-[#d4c9a8]" />
                              </div>
                            )}

                            {/* Category Pill Tag */}
                            <div className="absolute top-2.5 left-2.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#0c0a09]/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                                {art.category?.nama_kategori || 'Pengumuman'}
                              </span>
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-4">
                            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#707070] mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#0D5C3A]" /> 
                                {art.tanggal_terbit 
                                  ? new Date(art.tanggal_terbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                  : 'Baru'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                3 mnt
                              </span>
                            </div>

                            <h3 className="font-display font-bold text-xs sm:text-[13px] text-[#050505] mb-2 group-hover:text-[#0D5C3A] transition-colors line-clamp-2 leading-snug">
                              {art.judul}
                            </h3>

                            <p className="text-[11px] text-[#475569] leading-relaxed line-clamp-2">
                              {art.ringkasan}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="p-4 pt-0">
                          <div className="pt-3 border-t border-[#e7e5e4] flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#0D5C3A] group-hover:text-[#064e3b] uppercase tracking-wider transition-colors">
                              <span>Baca</span>
                              <CornerDownRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>

                            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-[#0D5C3A] group-hover:bg-[#0D5C3A] group-hover:text-white transition-colors">
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center text-[#707070] bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] p-8">
                      <Newspaper className="w-12 h-12 mx-auto text-[#707070] mb-3 opacity-40" />
                      <p className="text-sm font-bold text-[#050505]">Tidak ada artikel berita ditemukan</p>
                      <p className="text-xs text-[#707070] mt-1">Coba gunakan kata kunci lain atau pilih kategori Semua.</p>
                      <button
                        onClick={() => { setSelectedCategory('Semua'); setSearchQuery(''); setCurrentPage(1); }}
                        className="mt-4 px-4 py-2 bg-[#0D5C3A] text-white text-xs font-bold rounded-xl"
                      >
                        Tampilkan Semua Berita
                      </button>
                    </div>
                  )}
                </div>

                {/* ===== COMPACT PILL PAGINATION MATCHING REFERENCE ===== */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-10">
                    <div className="inline-flex items-center h-8 rounded-full border border-[#cbd5e1] dark:border-[#d6d3d1] bg-white dark:bg-[#FAF8F5] shadow-2xs overflow-hidden">
                      {/* Previous Page Button (if page > 1) */}
                      {currentPage > 1 && (
                        <button
                          onClick={() => {
                            setCurrentPage((p) => Math.max(1, p - 1));
                            document.getElementById('articles-grid')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="h-full px-3 text-xs font-black text-[#050505] hover:bg-[#F4F0E8] transition-colors border-r border-[#cbd5e1] dark:border-[#d6d3d1] flex items-center justify-center cursor-pointer"
                          title="Halaman Sebelumnya"
                        >
                          «
                        </button>
                      )}

                      {/* Numbered Page Buttons */}
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                        const isActive = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              document.getElementById('articles-grid')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`h-full px-3.5 min-w-[32px] text-xs font-black transition-colors cursor-pointer flex items-center justify-center ${
                              isActive
                                ? 'bg-[#0f172a] text-white'
                                : 'bg-transparent text-[#050505] hover:bg-[#F4F0E8]'
                            } ${pageNum > 1 || (currentPage > 1 && pageNum === 1) ? 'border-l border-[#cbd5e1] dark:border-[#d6d3d1]' : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      {/* Next Page Button (if page < totalPages) */}
                      {currentPage < totalPages && (
                        <button
                          onClick={() => {
                            setCurrentPage((p) => Math.min(totalPages, p + 1));
                            document.getElementById('articles-grid')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="h-full px-3 text-xs font-black text-[#050505] hover:bg-[#F4F0E8] transition-colors border-l border-[#cbd5e1] dark:border-[#d6d3d1] flex items-center justify-center cursor-pointer"
                          title="Halaman Berikutnya"
                        >
                          »
                        </button>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
