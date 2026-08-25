import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Roles
  console.log('Creating roles...');
  const roleSuperAdmin = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {},
    create: {
      name: 'superadmin',
      description: 'Super Administrator with full access',
      permissions: JSON.stringify(['*']),
    },
  });

  const roleAdmin = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with standard access',
      permissions: JSON.stringify(['manage_bookings', 'manage_content', 'manage_catalog']),
    },
  });

  // 2. Default SuperAdmin User
  console.log('Creating default superadmin...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superadmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@basecampsumbing.id',
      password: hashedPassword,
      nama_lengkap: 'Super Admin Basecamp Sumbing',
      phone: '+6281234567890',
      role_id: roleSuperAdmin.id,
      is_active: true,
    },
  });

  // 3. Hiking Routes (Jalur Pendakian)
  console.log('Creating hiking routes...');
  const routeKalikajar = await prisma.route.upsert({
    where: { slug: 'jalur-kalikajar' },
    update: {},
    create: {
      nama_jalur: 'Jalur Kalikajar (Wonosobo)',
      slug: 'jalur-kalikajar',
      deskripsi: 'Jalur Kalikajar merupakan salah satu jalur terpopuler menuju puncak Gunung Sumbing. Jalur ini memiliki trek yang relatif stabil namun menantang, dengan pemandangan kebun penduduk dan hutan lamtoro yang rindang.',
      tingkat_kesulitan: 'Sedang',
      total_jarak_km: 8.5,
      estimasi_jam: 7,
      elevasi_start: 1540,
      elevasi_puncak: 3371,
      status: 'Buka',
      foto_sampul: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
      map_center_lat: -7.3833,
      map_center_lng: 110.0667,
      map_zoom: 13,
      is_active: true,
    },
  });

  const routeGarung = await prisma.route.upsert({
    where: { slug: 'jalur-garung' },
    update: {},
    create: {
      nama_jalur: 'Jalur Garung (Wonosobo)',
      slug: 'jalur-garung',
      deskripsi: 'Jalur Garung terkenal dengan pemandangan "Double S" dan tanjakan tanahnya yang terjal. Jalur ini merupakan jalur klasik yang sangat disukai oleh para pendaki karena aksesnya yang mudah dijangkau dari jalan raya.',
      tingkat_kesulitan: 'Sulit',
      total_jarak_km: 9.2,
      estimasi_jam: 8,
      elevasi_start: 1400,
      elevasi_puncak: 3371,
      status: 'Buka',
      foto_sampul: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      map_center_lat: -7.3667,
      map_center_lng: 110.0833,
      map_zoom: 13,
      is_active: true,
    },
  });

  const routeBowongso = await prisma.route.upsert({
    where: { slug: 'jalur-bowongso' },
    update: {},
    create: {
      nama_jalur: 'Jalur Bowongso (Wonosobo)',
      slug: 'jalur-bowongso',
      deskripsi: 'Jalur Bowongso menyajikan lanskap alam yang lebih alami, sunyi, dan asri. Tanjakan di jalur ini cukup terjal dengan area savana yang mempesona menjelang puncak.',
      tingkat_kesulitan: 'Sangat Sulit',
      total_jarak_km: 7.8,
      estimasi_jam: 6.5,
      elevasi_start: 1900,
      elevasi_puncak: 3371,
      status: 'Tutup',
      foto_sampul: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80',
      map_center_lat: -7.4167,
      map_center_lng: 110.0333,
      map_zoom: 13,
      is_active: true,
    },
  });

  // 4. Route Segments
  console.log('Creating route segments...');
  const segmentsData = [
    // Kalikajar
    { route_id: routeKalikajar.id, nama_segmen: 'Basecamp - Pos 1 (Seketeng)', jarak_km: 2.1, estimasi_menit: 90, elevasi_naik: 250, elevasi_turun: 0, tingkat_kesulitan: 'Mudah', urutan: 1 },
    { route_id: routeKalikajar.id, nama_segmen: 'Pos 1 - Pos 2 (Genitri)', jarak_km: 1.8, estimasi_menit: 75, elevasi_naik: 320, elevasi_turun: 10, tingkat_kesulitan: 'Sedang', urutan: 2 },
    { route_id: routeKalikajar.id, nama_segmen: 'Pos 2 - Pos 3 (Batu Belah)', jarak_km: 2.2, estimasi_menit: 120, elevasi_naik: 510, elevasi_turun: 0, tingkat_kesulitan: 'Sulit', urutan: 3 },
    { route_id: routeKalikajar.id, nama_segmen: 'Pos 3 - Pos 4 (Kawasan Hutan)', jarak_km: 1.4, estimasi_menit: 90, elevasi_naik: 450, elevasi_turun: 0, tingkat_kesulitan: 'Sulit', urutan: 4 },
    { route_id: routeKalikajar.id, nama_segmen: 'Pos 4 - Puncak Sumbing', jarak_km: 1.0, estimasi_menit: 60, elevasi_naik: 301, elevasi_turun: 0, tingkat_kesulitan: 'Sulit', urutan: 5 },
  ];

  for (const seg of segmentsData) {
    await prisma.segment.create({ data: seg });
  }

  // 5. Route Posts
  console.log('Creating route posts...');
  const postsData = [
    // Kalikajar
    { route_id: routeKalikajar.id, nama_pos: 'Basecamp Kalikajar', deskripsi: 'Pendaftaran pendaki, fasilitas mushola, toilet, area istirahat, parkir motor & mobil 24 jam.', elevasi: 1540, latitude: -7.3888, longitude: 110.0621, fasilitas: JSON.stringify(['Mushola', 'Toilet', 'Warung', 'Charger Station', 'Loker']), urutan: 0 },
    { route_id: routeKalikajar.id, nama_pos: 'Pos 1 (Seketeng)', deskripsi: 'Pos istirahat beratap seng, terdapat shelter kayu kecil dan area duduk rata.', elevasi: 1790, latitude: -7.3852, longitude: 110.0635, fasilitas: JSON.stringify(['Shelter', 'Trash Bin']), urutan: 1 },
    { route_id: routeKalikajar.id, nama_pos: 'Pos 2 (Genitri)', deskripsi: 'Shelter istirahat yang luas, dikelilingi pohon pinus rindang.', elevasi: 2100, latitude: -7.3811, longitude: 110.0652, fasilitas: JSON.stringify(['Shelter']), urutan: 2 },
    { route_id: routeKalikajar.id, nama_pos: 'Pos 3 (Batu Belah)', deskripsi: 'Area camp utama sebelum summit. Cukup datar untuk mendirikan 20-30 tenda.', elevasi: 2610, latitude: -7.3782, longitude: 110.0674, fasilitas: JSON.stringify(['Camping Ground', 'Sumber Air (Musiman)']), urutan: 3 },
    { route_id: routeKalikajar.id, nama_pos: 'Pos 4 (Savana)', deskripsi: 'Titik pos terakhir di batas hutan, menyajikan pemandangan padang rumput savana terbuka.', elevasi: 3060, latitude: -7.3755, longitude: 110.0691, fasilitas: JSON.stringify(['Camping Area']), urutan: 4 },
  ];

  for (const post of postsData) {
    await prisma.post.create({ data: post });
  }

  // 6. Booking Packages
  console.log('Creating booking packages...');
  await prisma.bookingPackage.createMany({
    data: [
      {
        route_id: routeKalikajar.id,
        nama_paket: 'Simaksi Mandiri',
        slug: 'simaksi-mandiri-kalikajar',
        deskripsi: 'Paket dasar tiket izin masuk (SIMAKSI) pendakian Gunung Sumbing jalur Kalikajar. Pendakian mandiri tanpa tambahan guide/porter.',
        harga_per_orang: 50000,
        min_peserta: 1,
        max_peserta: 20,
        durasi_hari: 2,
        include: JSON.stringify(['Tiket SIMAKSI resmi', 'Asuransi jiwa', 'Peta rute cetak', 'Free charging di Basecamp']),
        exclude: JSON.stringify(['Tenda & Alat camping', 'Konsumsi', 'Guide & Porter']),
        foto: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80',
        is_available: true,
        is_featured: true,
        urutan: 1,
      },
      {
        route_id: routeKalikajar.id,
        nama_paket: 'Sunrise Trip (Sewa Porter)',
        slug: 'sunrise-trip-kalikajar',
        deskripsi: 'Pendakian 2 Hari 1 Malam ditemani porter lokal berpengalaman yang membantu membawakan tenda & perlengkapan kelompok.',
        harga_per_orang: 350000,
        min_peserta: 3,
        max_peserta: 8,
        durasi_hari: 2,
        include: JSON.stringify(['Tiket SIMAKSI resmi', 'Asuransi jiwa', '1 Porter kelompok', 'Tenda Dome (kapasitas 4)', 'Matras & Sleeping Bag']),
        exclude: JSON.stringify(['Konsumsi pribadi', 'Guide khusus']),
        foto: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80',
        is_available: true,
        is_featured: true,
        urutan: 2,
      },
      {
        route_id: routeKalikajar.id,
        nama_paket: 'Full Service VIP Trip Sumbing',
        slug: 'vip-trip-sumbing',
        deskripsi: 'Fasilitas premium lengkap. Anda hanya perlu membawa pakaian pribadi. Termasuk Guide, Porter pribadi, makanan hangat bergizi, dan tenda dome besar nyaman.',
        harga_per_orang: 850000,
        min_peserta: 2,
        max_peserta: 10,
        durasi_hari: 2,
        include: JSON.stringify(['Tiket SIMAKSI', 'Asuransi premium', 'Guide bersertifikat', 'Porter pribadi (1 porter/pendaki)', 'Makan 4x selama pendakian (masakan hangat)', 'Sleeping bag tebal + bantal tiup', 'Tenda makan & tenda toilet di pos camp']),
        exclude: JSON.stringify(['Tips opsional guide/porter']),
        foto: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=600&q=80',
        is_available: true,
        is_featured: false,
        urutan: 3,
      },
    ],
  });

  // 7. Product Categories (Rental, Homestay, Porter, UMKM)
  console.log('Creating catalog categories...');
  const catSewa = await prisma.productCategory.create({ data: { nama_kategori: 'Peralatan Camping', slug: 'peralatan-camping', tipe: 'sewa', urutan: 1 } });
  const catHomestay = await prisma.productCategory.create({ data: { nama_kategori: 'Homestay Basecamp', slug: 'homestay-basecamp', tipe: 'homestay', urutan: 2 } });
  const catJasa = await prisma.productCategory.create({ data: { nama_kategori: 'Guide & Porter', slug: 'guide-porter', tipe: 'porter', urutan: 3 } });
  const catUmkm = await prisma.productCategory.create({ data: { nama_kategori: 'Warung & UMKM Lokal', slug: 'umkm-lokal', tipe: 'umkm', urutan: 4 } });

  // 8. Products
  console.log('Creating products catalog...');
  await prisma.product.createMany({
    data: [
      // Rental Gear
      {
        category_id: catSewa.id,
        nama_produk: 'Tenda Dome Kapasitas 4 Orang',
        slug: 'tenda-dome-kap-4',
        deskripsi: 'Tenda double-layer anti-badai tahan angin & air hujan. Merk Consina/Great Outdoor.',
        harga: 40000,
        satuan: '/hari',
        foto: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=400&q=80',
        stok: 50,
        is_available: true,
        is_featured: true,
      },
      {
        category_id: catSewa.id,
        nama_produk: 'Sleeping Bag Dacron Tebal',
        slug: 'sleeping-bag-dacron',
        deskripsi: 'Sleeping bag hangat menjaga suhu tubuh tetap nyaman di ketinggian ekstrem.',
        harga: 10000,
        satuan: '/hari',
        foto: 'https://images.unsplash.com/photo-1627917897092-28df52834b64?auto=format&fit=crop&w=400&q=80',
        stok: 100,
        is_available: true,
        is_featured: true,
      },
      {
        category_id: catSewa.id,
        nama_produk: 'Kompor Camping Portable + Gas Kaleng',
        slug: 'kompor-camping-portable',
        deskripsi: 'Kompor lipat mini portable praktis, lengkap dengan 1 tabung gas baru.',
        harga: 20000,
        satuan: '/hari',
        foto: 'https://images.unsplash.com/photo-1554342597-7098bd83a1f7?auto=format&fit=crop&w=400&q=80',
        stok: 30,
        is_available: true,
      },
      // Homestay
      {
        category_id: catHomestay.id,
        nama_produk: 'Homestay Pendaki Sekar Gunung',
        slug: 'homestay-sekar-gunung',
        deskripsi: 'Penginapan ala rumah warga di depan basecamp. Kamar bersih, kamar mandi luar dengan air panas, teh/kopi gratis.',
        harga: 75000,
        satuan: '/malam/kamar',
        foto: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
        is_available: true,
        is_featured: true,
        fasilitas: JSON.stringify(['Air Panas', 'Wifi', 'Teh/Kopi', 'Tempat Tidur Kasur Kasur lantai']),
      },
      // Jasa
      {
        category_id: catJasa.id,
        nama_produk: 'Layanan Porter Angkut Barang (Max 20kg)',
        slug: 'porter-angkut-20kg',
        deskripsi: 'Jasa porter lokal untuk membawa perlengkapan naik & turun gunung (tenda, logistik, peralatan masak).',
        harga: 250000,
        satuan: '/trip PP',
        foto: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80',
        is_available: true,
      },
    ],
  });

  // 9. Article Categories
  console.log('Creating article categories...');
  const catInfo = await prisma.articleCategory.create({ data: { nama_kategori: 'Pengumuman', slug: 'pengumuman', urutan: 1 } });
  const catTips = await prisma.articleCategory.create({ data: { nama_kategori: 'Tips Pendakian', slug: 'tips-pendakian', urutan: 2 } });
  const catWisata = await prisma.articleCategory.create({ data: { nama_kategori: 'Wisata Sekitar', slug: 'wisata-sekitar', urutan: 3 } });

  // 10. Articles (News)
  console.log('Creating articles...');
  await prisma.article.create({
    data: {
      author_id: superadmin.id,
      category_id: catInfo.id,
      judul: 'Penyesuaian Tarif SIMAKSI & Sistem Reservasi Online Basecamp Kalikajar',
      slug: 'penyesuaian-tarif-simaksi-2026',
      ringkasan: 'Mulai 1 Agustus 2026, Basecamp Gunung Sumbing memberlakukan sistem reservasi online terintegrasi untuk pendataan tiket digital.',
      konten: `<p>Kami informasikan kepada seluruh calon pendaki Gunung Sumbing via Kalikajar bahwa pengelola basecamp resmi meluncurkan portal reservasi online digital yang baru.</p>
               <p>Sistem ini dirancang untuk mempermudah pendaftaran tiket masuk (SIMAKSI), sewa peralatan, pemesanan homestay, hingga porter. Dengan sistem QR digital ini, proses check-in di pos basecamp akan jauh lebih cepat.</p>
               <p>Tarif SIMAKSI terbaru disesuaikan menjadi Rp 50.000 per orang yang sudah mencakup asuransi pendakian resmi.</p>`,
      foto_sampul: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80',
      status: 'Terbit',
      is_featured: true,
      tanggal_terbit: new Date(),
    },
  });

  // 11. Galleries
  console.log('Creating gallery items...');
  const catGalSavana = await prisma.galleryCategory.create({ data: { nama_kategori: 'Savana & Alam', slug: 'savana-alam', urutan: 1 } });
  
  await prisma.gallery.createMany({
    data: [
      {
        category_id: catGalSavana.id,
        judul: 'Pemandangan Sunrise dari Pos 4',
        deskripsi: 'Momen keemasan matahari terbit menyinari lautan awan di pos 4 jalur Kalikajar.',
        url_media: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        media_type: 'image',
        is_featured: true,
      },
      {
        category_id: catGalSavana.id,
        judul: 'Area Camp Pos 3 Batu Belah',
        deskripsi: 'Pendaki mendirikan tenda berwarna-warni di area camp Pos 3 yang asri.',
        url_media: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
        media_type: 'image',
        is_featured: false,
      },
    ],
  });

  // 12. Reviews
  console.log('Creating reviews...');
  await prisma.review.createMany({
    data: [
      {
        nama: 'Budi Santoso',
        email: 'budi@gmail.com',
        rating: 5,
        komentar: 'Pelayanan basecamp sangat ramah, toilet bersih dan fasilitas charge HP sangat membantu. Sistem booking barunya juga gampang banget dipake!',
        is_approved: true,
        is_featured: true,
      },
      {
        nama: 'Siti Rahma',
        email: 'siti@yahoo.com',
        rating: 4,
        komentar: 'Jalurnya mantap, sunrise di pos 4 indah sekali. Porter yang direkomendasikan basecamp ramah dan jago masak!',
        is_approved: true,
        is_featured: true,
      },
    ],
  });

  console.log('🌱 Seeding database completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding DB:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
