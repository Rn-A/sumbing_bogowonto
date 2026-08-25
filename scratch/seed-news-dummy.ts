import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DUMMY_CATEGORIES = [
  { id: 'cat-1', nama_kategori: 'Pengumuman', slug: 'pengumuman', icon: 'Megaphone', urutan: 1 },
  { id: 'cat-2', nama_kategori: 'Tips Pendakian', slug: 'tips-pendakian', icon: 'Compass', urutan: 2 },
  { id: 'cat-3', nama_kategori: 'Panduan Jalur', slug: 'panduan-jalur', icon: 'Map', urutan: 3 },
  { id: 'cat-4', nama_kategori: 'Konservasi', slug: 'konservasi', icon: 'Trees', urutan: 4 },
  { id: 'cat-5', nama_kategori: 'Wisata Sekitar', slug: 'wisata-sekitar', icon: 'Camera', urutan: 5 },
];

const DUMMY_ARTICLES = [
  {
    id: 'art-1',
    category_slug: 'pengumuman',
    judul: 'Penyesuaian Tarif SIMAKSI & Sistem Reservasi Online Basecamp Bogowonto 2026',
    slug: 'penyesuaian-tarif-simaksi-2026',
    is_featured: true,
    views: 1420,
    foto_sampul: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: new Date('2026-08-01T08:00:00.000Z'),
    ringkasan: 'Mulai 1 Agustus 2026, Basecamp Gunung Sumbing Via Pencar memberlakukan sistem registrasi tiket digital QR terpadu untuk efisiensi check-in dan asuransi pendakian resmi.',
    konten: `<p class="lead">Pengelola Basecamp Bogowonto resmi meluncurkan pembaruan regulasi pendakian Gunung Sumbing Via Pencar untuk periode tahun 2026. Pembaruan ini menitikberatkan pada kemudahan registrasi online, peningkatan standar keselamatan pendaki, serta perlindungan asuransi resmi.</p>

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
</ol>`
  },
  {
    id: 'art-2',
    category_slug: 'tips-pendakian',
    judul: 'Panduan Fisik & Perlengkapan Wajib Mendaki Puncak Sumbing Via Pencar',
    slug: 'panduan-fisik-dan-perlengkapan-sumbing',
    is_featured: true,
    views: 980,
    foto_sampul: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: new Date('2026-08-05T09:30:00.000Z'),
    ringkasan: 'Persiapan fisik esensial, rekomendasi checklist logistik, sistem layer pakaian gunung, serta manajemen air sebelum menaklukkan medan sabana dan bebatuan Gunung Sumbing.',
    konten: `<p class="lead">Gunung Sumbing (3.371 mdpl) adalah salah satu atap tertinggi di Pulau Jawa dengan rute yang menantang dan vegetasi terbuka. Mempersiapkan fisik dan perlengkapan yang tepat adalah kunci utama keberhasilan dan keselamatan pendakian Anda.</p>

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
<p>Sumber air di jalur Via Pencar terdapat di area Basecamp dan titik dekat Pos 2. Di atas Pos 3 hingga Puncak, tidak terdapat sumber mata air permanen. Disarankan membawa minimal <strong>3 liter air bersih per orang</strong> untuk kebutuhan mendaki dan memasak di area camp.</p>`
  },
  {
    id: 'art-3',
    category_slug: 'konservasi',
    judul: 'Aksi Bersih Jalur & Konservasi Alam: Menjaga Kelestarian Sabana Sumbing',
    slug: 'aksi-bersih-jalur-konservasi-sumbing',
    is_featured: false,
    views: 650,
    foto_sampul: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: new Date('2026-08-08T14:15:00.000Z'),
    ringkasan: 'Gerakan peduli lingkungan zero waste di sepanjang Pos 1 hingga Pos 4 Pencar Atas bersama komunitas relawan dan pengelola Basecamp Bogowonto.',
    konten: `<p class="lead">Kelestarian alam dan kebersihan ekosistem Gunung Sumbing merupakan tanggung jawab bersama. Basecamp Bogowonto bersama komunitas pendaki pecinta alam rutin menyelenggarakan program bersih gunung (Clean-Up Trail) dan penanaman pohon penahan erosi.</p>

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
</blockquote>`
  },
  {
    id: 'art-4',
    category_slug: 'panduan-jalur',
    judul: 'Eksplorasi Jalur Sabana & Sunrise Camp: Titik Terbaik Menikmati Lautan Awan',
    slug: 'eksplorasi-jalur-sabana-sunrise-camp',
    is_featured: false,
    views: 890,
    foto_sampul: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: new Date('2026-08-10T11:00:00.000Z'),
    ringkasan: 'Menelusuri keindahan bentang alam padang sabana, formasi bebatuan Pos 3 Batu Belah, serta spot berkemah Sunrise Camp yang memukau di lereng Sumbing.',
    konten: `<p class="lead">Jalur pendakian Gunung Sumbing Via Pencar menawarkan panorama yang sangat bervariasi. Dari area kebun tembakau dan sayuran warga di lereng bawah, hutan pinus yang teduh, hingga padang sabana luas berhias rumput ilalang keemasan.</p>

<h3>Spot Favorit di Sepanjang Rute</h3>
<ul>
  <li><strong>Pos 2 Genitri:</strong> Tempat istirahat teduh yang nyaman dengan semilir angin sejuk dan rindang pepohonan.</li>
  <li><strong>Pos 3 Batu Belah:</strong> Formasi batuan vulkanik unik yang menjadi ikon jalur Via Pencar, cocok untuk spot berfoto dengan latar lembah Wonosobo.</li>
  <li><strong>Sunrise Camp (2.300 mdpl):</strong> Area datar ideal untuk mendirikan tenda camp. Dari titik ini, Anda dapat menikmati pemandangan matahari terbit dengan lautan awan yang membentang luas menutupi lembah Sindoro dan Dieng.</li>
  <li><strong>Pos 4 Padang Sabana:</strong> Hamparan sabana hijau terbuka yang mempesona menjelang tanjakan batu terjal menuju puncak.</li>
</ul>`
  },
  {
    id: 'art-5',
    category_slug: 'wisata-sekitar',
    judul: 'Rekomendasi Kuliner Khas & Homestay Nyaman di Sekitar Pencar Kalikajar',
    slug: 'kuliner-khas-dan-homestay-kalikajar',
    is_featured: false,
    views: 520,
    foto_sampul: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: new Date('2026-08-11T16:20:00.000Z'),
    ringkasan: 'Daftar homestay ramah pendaki, warung kopi lokal penghangat tubuh, dan produk UMKM khas lereng Gunung Sumbing yang wajib dicoba.',
    konten: `<p class="lead">Perjalanan mendaki Gunung Sumbing tidak hanya tentang menaklukkan puncak, namun juga tentang menikmati kehangatan keramahan warga desa Pencar Atas dan kelezatan kuliner lokal pegunungan.</p>

<h3>Homestay Nyaman Mitra Basecamp Bogowonto</h3>
<p>Bagi pendaki yang menempuh perjalanan jauh dari luar kota, tersedia puluhan homestay milik warga desa di sekitar basecamp dengan tarif terjangkau (mulai Rp 75.000 - Rp 150.000 per kamar). Fasilitas mencakup kasur empuk, air hangat, colokan listrik, serta suguhan teh atau kopi lokal hangat.</p>

<h3>Kuliner Wajib Dicoba:</h3>
<ul>
  <li><strong>Tempe Kemul Hangat:</strong> Tempe goreng berbalut tepung kunyit renyah dengan taburan daun kucai, nikmat disantap dengan cabai rawit saat udara dingin.</li>
  <li><strong>Kopi Arabika Sumbing:</strong> Biji kopi asli hasil perkebunan lereng Sumbing dengan aroma floral dan rasa fruity yang khas.</li>
  <li><strong>Mie Ongklok Wonosobo:</strong> Kuliner legendaris dengan kuah kental gurih manis bertabur sate sapi empuk.</li>
</ul>`
  },
  {
    id: 'art-6',
    category_slug: 'tips-pendakian',
    judul: 'Strategi Pencegahan Hipotermia dan Mountain Sickness (AMS) di Ketinggian',
    slug: 'strategi-mengatasi-hipotermia-dan-ams',
    is_featured: false,
    views: 740,
    foto_sampul: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: new Date('2026-08-12T07:00:00.000Z'),
    ringkasan: 'Langkah preventif dan penanganan pertama darurat saat menghadapi penurunan suhu tubuh drastis atau gejala pusing di ketinggian di atas 2.500 mdpl.',
    konten: `<p class="lead">Suhu di area camp dan puncak Gunung Sumbing pada malam hari dapat turun hingga 5°C - 2°C, bahkan mendekati titik beku pada puncak musim kemarau. Memahami tanda-tanda hipotermia dan Acute Mountain Sickness (AMS) adalah pengetahuan krusial bagi setiap pendaki.</p>

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
</ol>`
  },
  {
    id: 'art-7',
    category_slug: 'panduan-jalur',
    judul: 'Spot Foto Terbaik & Waktu Golden Hour di Sepanjang Jalur Sabana Pencar',
    slug: 'spot-foto-golden-hour-pencar',
    is_featured: false,
    views: 410,
    foto_sampul: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    tanggal_terbit: new Date('2026-08-12T09:15:00.000Z'),
    ringkasan: 'Rekomendasi titik pengambilan gambar lanskap terbaik dari Pos Ojek, hutan pinus, hingga sabana Pos 4 dengan latar belakang Gunung Sindoro.',
    konten: `<p class="lead">Bagi para pecinta fotografi alam bebas, jalur pendakian Gunung Sumbing Via Pencar menyajikan sudut pandang unik yang sangat fotogenik sepanjang perjalanan.</p>

<h3>Titik Foto Wajib Dikunjungi</h3>
<ul>
  <li><strong>Sunrise Camp (Pukul 05:15 - 05:45 WIB):</strong> Momen matahari terbit dengan lautan awan yang membentang luas.</li>
  <li><strong>Pos 3 Batu Belah (Pukul 08:00 - 10:00 WIB):</strong> Bebatuan raksasa dengan latar lereng Sindoro yang gagah di kejauhan.</li>
  <li><strong>Sabana Pos 4 (Pukul 15:30 - 17:00 WIB):</strong> Sinar matahari sore keemasan yang menerangi padang ilalang terbuka.</li>
</ul>`
  }
];

async function seedNewsArticles() {
  console.log('Seeding dummy articles to database...');

  // 1. Get or create Admin user
  let adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (!adminUser) {
    adminUser = await prisma.user.findFirst();
  }

  if (!adminUser) {
    console.error('No admin user found in database!');
    return;
  }

  // 2. Upsert Categories
  const categoryMap = new Map<string, string>();
  for (const cat of DUMMY_CATEGORIES) {
    const createdCat = await prisma.articleCategory.upsert({
      where: { slug: cat.slug },
      update: {
        nama_kategori: cat.nama_kategori,
        icon: cat.icon,
        urutan: cat.urutan
      },
      create: {
        id: cat.id,
        nama_kategori: cat.nama_kategori,
        slug: cat.slug,
        icon: cat.icon,
        urutan: cat.urutan
      }
    });
    categoryMap.set(cat.slug, createdCat.id);
  }

  // 3. Upsert Articles
  for (const art of DUMMY_ARTICLES) {
    const categoryId = categoryMap.get(art.category_slug);
    if (!categoryId) continue;

    await prisma.article.upsert({
      where: { slug: art.slug },
      update: {
        judul: art.judul,
        category_id: categoryId,
        foto_sampul: art.foto_sampul,
        ringkasan: art.ringkasan,
        konten: art.konten,
        status: 'Terbit',
        is_featured: art.is_featured,
        views: art.views,
        tanggal_terbit: art.tanggal_terbit
      },
      create: {
        id: art.id,
        author_id: adminUser.id,
        category_id: categoryId,
        judul: art.judul,
        slug: art.slug,
        foto_sampul: art.foto_sampul,
        ringkasan: art.ringkasan,
        konten: art.konten,
        status: 'Terbit',
        is_featured: art.is_featured,
        views: art.views,
        tanggal_terbit: art.tanggal_terbit
      }
    });
  }

  console.log(`Successfully seeded ${DUMMY_ARTICLES.length} news articles into the database!`);
}

seedNewsArticles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
