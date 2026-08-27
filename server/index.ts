import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
// @ts-ignore
import midtransClient from 'midtrans-client';

dotenv.config();

const __dirname = process.env.VERCEL
  ? process.cwd()
  : path.dirname(fileURLToPath(import.meta.url));

const app = express();
const prisma = new PrismaClient();

// Midtrans Snap API Client
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'basecamp-sumbing-super-secret-key-change-me';

// ============================================
// MIDDLEWARE
// ============================================

// Logger
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// JWT Authentication Middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Akses ditolak. Sesi admin tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Sesi admin telah kedaluwarsa. Silakan login kembali.' });
    }
    req.admin = decoded;
    next();
  });
};

// Uploads directory
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', 'public', 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('Warning: Failed to create uploads directory:', err);
}

app.use('/uploads', express.static(uploadsDir));

// ============================================
// PUBLIC ROUTES
// ============================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Basecamp Sumbing API is running', timestamp: new Date().toISOString() });
});

// Get all public data (for initial app load)
app.get('/api/public/all-data', async (_req, res) => {
  try {
    const [
      articles,
      articleCategories,
      routes,
      products,
      productCategories,
      galleries,
      galleryCategories,
      reviews,
      bookingPackages,
    ] = await Promise.all([
      prisma.article.findMany({ where: { status: 'Terbit' }, orderBy: { tanggal_terbit: 'desc' }, take: 20 }),
      prisma.articleCategory.findMany({ orderBy: { urutan: 'asc' } }),
      prisma.route.findMany({ where: { is_active: true }, include: { segments: { orderBy: { urutan: 'asc' } }, posts: { orderBy: { urutan: 'asc' } }, gpx_files: true } }),
      prisma.product.findMany({ where: { is_available: true }, orderBy: { created_at: 'desc' } }),
      prisma.productCategory.findMany({ orderBy: { urutan: 'asc' } }),
      prisma.gallery.findMany({ orderBy: { created_at: 'desc' }, take: 30 }),
      prisma.galleryCategory.findMany({ orderBy: { urutan: 'asc' } }),
      prisma.review.findMany({ where: { is_approved: true }, orderBy: { created_at: 'desc' }, take: 10 }),
      prisma.bookingPackage.findMany({ where: { is_available: true }, orderBy: { urutan: 'asc' }, include: { route: true } }),
    ]);

    // Calculate active hikers currently hiking on today's date (tanggal_naik <= todayEnd AND tanggal_turun >= todayStart)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activeBookingsToday = await prisma.booking.findMany({
      where: {
        tanggal_naik: { lte: todayEnd },
        tanggal_turun: { gte: todayStart },
        status: { in: ['Confirmed', 'Paid', 'CheckedIn'] }
      },
      select: { jumlah_peserta: true }
    });

    const activeHikersTodayCount = activeBookingsToday.reduce((sum, b) => sum + (b.jumlah_peserta || 1), 0);
    const activeHikersCount = activeHikersTodayCount;

    const dbSettings = await prisma.setting.findMany();
    const settingsMap: Record<string, any> = {};
    dbSettings.forEach((s) => {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    });

    res.json({
      success: true,
      data: {
        articles,
        articleCategories,
        routes,
        products,
        productCategories,
        galleries,
        galleryCategories,
        reviews,
        bookingPackages,
        activeHikersCount,
        activeHikersTodayCount,
        settings: settingsMap,
      },
    });
  } catch (err: any) {
    console.error('Error fetching all data:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data aplikasi.' });
  }
});

// Settings API (Public & Admin)
app.get('/api/settings', async (_req, res) => {
  try {
    const dbSettings = await prisma.setting.findMany();
    const settingsMap: Record<string, any> = {};
    dbSettings.forEach((s) => {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    });
    res.json({ success: true, data: settingsMap });
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil pengaturan.' });
  }
});

app.put('/api/admin/settings', authenticateAdmin, async (req: any, res: any) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Format data settings tidak valid.' });
    }

    const upsertPromises = Object.entries(settings).map(([key, value]) => {
      const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);
      return prisma.setting.upsert({
        where: { key },
        update: { value: stringifiedValue },
        create: { key, value: stringifiedValue },
      });
    });

    await Promise.all(upsertPromises);
    res.json({ success: true, message: 'Pengaturan CMS berhasil disimpan.' });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    res.status(500).json({ success: false, error: 'Gagal menyimpan pengaturan.' });
  }
});

// Get articles
app.get('/api/articles', async (req, res) => {
  try {
    const { category, search, page = '1', limit = '12' } = req.query as Record<string, string>;
    const where: any = { status: 'Terbit' };
    if (category) where.category_id = category;
    if (search) where.judul = { contains: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [articles, total] = await Promise.all([
      prisma.article.findMany({ where, orderBy: { tanggal_terbit: 'desc' }, skip, take: parseInt(limit), include: { category: true } }),
      prisma.article.count({ where }),
    ]);

    res.json({ success: true, data: articles, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err: any) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data berita.' });
  }
});

// Get single article by slug
app.get('/api/articles/:slug', async (req, res) => {
  try {
    const article = await prisma.article.findUnique({ where: { slug: req.params.slug }, include: { category: true, author: { select: { id: true, nama_lengkap: true, avatar: true } } } });
    if (!article) return res.status(404).json({ success: false, error: 'Berita tidak ditemukan.' });
    // Increment views
    await prisma.article.update({ where: { id: article.id }, data: { views: { increment: 1 } } });
    res.json({ success: true, data: article });
  } catch (err: any) {
    console.error('Error fetching article:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data berita.' });
  }
});

// Weather WMO Code to Indonesian Description
function getWmoWeatherText(code: number): string {
  if (code === 0) return 'Cerah';
  if (code === 1 || code === 2) return 'Cerah Berawan';
  if (code === 3) return 'Berawan';
  if (code === 45 || code === 48) return 'Kabut';
  if (code >= 51 && code <= 57) return 'Gerimis';
  if (code >= 61 && code <= 67) return 'Hujan Ringan';
  if (code >= 71 && code <= 77) return 'Hujan Salju';
  if (code >= 80 && code <= 82) return 'Hujan Sedang';
  if (code >= 95) return 'Hujan Petir';
  return 'Cerah Berawan';
}

let cachedWeather: any = null;
let cachedWeatherTime = 0;

// Get Weather for Mount Sumbing (lat: -7.385, lon: 110.0725) from Google Maps link https://maps.app.goo.gl/2Vi5RfHmJoBk1Uf26
app.get('/api/weather', async (_req, res) => {
  try {
    const now = Date.now();
    if (cachedWeather && (now - cachedWeatherTime < 10 * 60 * 1000)) {
      return res.json({ success: true, data: cachedWeather });
    }

    const lat = -7.385;
    const lon = 110.0725;
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Asia%2FJakarta`);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const data = await response.json();
    const current = data.current_weather || {};
    const condition = getWmoWeatherText(current.weathercode ?? 1);
    const temp = Math.round(current.temperature ?? 16);

    cachedWeather = {
      location: 'Puncak Gunung Sumbing',
      google_maps_url: 'https://maps.app.goo.gl/2Vi5RfHmJoBk1Uf26',
      lat,
      lon,
      temp,
      condition,
      display_text: `${temp}°C ${condition}`,
      weathercode: current.weathercode,
      windspeed: current.windspeed,
      is_day: current.is_day,
      updated_at: new Date().toISOString()
    };
    cachedWeatherTime = now;

    res.json({ success: true, data: cachedWeather });
  } catch (err: any) {
    console.error('Error fetching weather:', err);
    const fallback = {
      location: 'Puncak Gunung Sumbing',
      google_maps_url: 'https://maps.app.goo.gl/2Vi5RfHmJoBk1Uf26',
      lat: -7.385,
      lon: 110.0725,
      temp: 16,
      condition: 'Cerah Berawan',
      display_text: '16°C Cerah Berawan',
      weathercode: 1,
      is_day: 1,
      updated_at: new Date().toISOString()
    };
    res.json({ success: true, data: fallback });
  }
});

// Get routes
app.get('/api/routes', async (_req, res) => {
  try {
    const routes = await prisma.route.findMany({
      where: { is_active: true },
      include: { segments: { orderBy: { urutan: 'asc' } }, posts: { orderBy: { urutan: 'asc' } }, gpx_files: true },
    });
    res.json({ success: true, data: routes });
  } catch (err: any) {
    console.error('Error fetching routes:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data rute.' });
  }
});

// Get GPX data for a route
app.get('/api/routes/:routeId/gpx', async (req, res) => {
  try {
    const gpxFiles = await prisma.routeGpx.findMany({ where: { route_id: req.params.routeId } });
    res.json({ success: true, data: gpxFiles });
  } catch (err: any) {
    console.error('Error fetching GPX data:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data GPX.' });
  }
});

// Download GPX file
app.get('/api/gpx/:gpxId/download', async (req, res) => {
  try {
    const gpx = await prisma.routeGpx.findUnique({ where: { id: req.params.gpxId } });
    if (!gpx) return res.status(404).json({ success: false, error: 'File GPX tidak ditemukan.' });

    // Increment download count
    await prisma.routeGpx.update({ where: { id: gpx.id }, data: { download_count: { increment: 1 } } });

    // If it's a URL (e.g., Vercel Blob), redirect
    if (gpx.file_url.startsWith('http')) {
      return res.redirect(gpx.file_url);
    }

    // Otherwise serve from local filesystem
    const filePath = path.join(__dirname, '..', 'public', gpx.file_url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File GPX tidak ditemukan di server.' });
    }
    res.setHeader('Content-Type', 'application/gpx+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${gpx.nama_file}"`);
    res.sendFile(filePath);
  } catch (err: any) {
    console.error('Error downloading GPX:', err);
    res.status(500).json({ success: false, error: 'Gagal mengunduh file GPX.' });
  }
});

// Get products
app.get('/api/products', async (req, res) => {
  try {
    const { category, type, search } = req.query as Record<string, string>;
    const where: any = { is_available: true };
    if (category) where.category_id = category;
    if (search) where.nama_produk = { contains: search };

    const products = await prisma.product.findMany({ where, orderBy: { created_at: 'desc' }, include: { category: true } });

    // Filter by category type if specified
    const filtered = type
      ? products.filter(p => p.category?.tipe === type)
      : products;

    res.json({ success: true, data: filtered });
  } catch (err: any) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data produk.' });
  }
});

// Get gallery
app.get('/api/gallery', async (_req, res) => {
  try {
    const galleries = await prisma.gallery.findMany({ orderBy: { created_at: 'desc' }, include: { category: true } });
    res.json({ success: true, data: galleries });
  } catch (err: any) {
    console.error('Error fetching gallery:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data galeri.' });
  }
});

// Get reviews (public approved only)
app.get('/api/reviews', async (_req, res) => {
  try {
    const reviews = await prisma.review.findMany({ where: { is_approved: true }, orderBy: { created_at: 'desc' } });
    res.json({ success: true, data: reviews });
  } catch (err: any) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data review.' });
  }
});

// Submit review (public)
app.post('/api/reviews', async (req, res) => {
  try {
    const { nama, email, rating, komentar } = req.body;
    if (!nama || !komentar || !rating) {
      return res.status(400).json({ success: false, error: 'Nama, rating, dan komentar wajib diisi.' });
    }
    const review = await prisma.review.create({ data: { nama, email: email || null, rating: parseInt(rating), komentar, is_approved: false } });
    res.json({ success: true, data: review, message: 'Review berhasil dikirim! Menunggu persetujuan admin.' });
  } catch (err: any) {
    console.error('Error submitting review:', err);
    res.status(500).json({ success: false, error: 'Gagal mengirim review.' });
  }
});

// Get booking packages
app.get('/api/booking-packages', async (_req, res) => {
  try {
    const packages = await prisma.bookingPackage.findMany({ where: { is_available: true }, orderBy: { urutan: 'asc' }, include: { route: true } });
    res.json({ success: true, data: packages });
  } catch (err: any) {
    console.error('Error fetching booking packages:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data paket.' });
  }
});

// Submit contact message (public)
app.post('/api/contact', async (req, res) => {
  try {
    const { nama, email, subjek, pesan } = req.body;
    if (!nama || !email || !pesan) {
      return res.status(400).json({ success: false, error: 'Nama, email, dan pesan wajib diisi.' });
    }
    const contact = await prisma.contact.create({ data: { nama, email, subjek: subjek || null, pesan } });
    res.json({ success: true, data: contact, message: 'Pesan berhasil dikirim!' });
  } catch (err: any) {
    console.error('Error submitting contact:', err);
    res.status(500).json({ success: false, error: 'Gagal mengirim pesan.' });
  }
});

// ============================================
// RESERVASI / BOOKING ROUTES (Midtrans Snap Integration)
// ============================================

// Helper: Generate Ticket for a Booking after successful payment
async function generateTicketForBooking(bookingId: string, kodeBooking: string) {
  const existing = await prisma.ticket.findUnique({ where: { booking_id: bookingId } });
  if (existing) return existing;

  const kodeTiket = `TKT-${kodeBooking}-${Math.floor(10 + Math.random() * 90)}`;
  return prisma.ticket.create({
    data: {
      booking_id: bookingId,
      kode_tiket: kodeTiket,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(kodeBooking)}`,
      status: 'Active',
    },
  });
}

// Create Booking (with Midtrans Snap for online payment)
app.post('/api/bookings', async (req, res) => {
  try {
    let {
      package_id,
      nama_ketua,
      email,
      no_hp,
      alamat,
      tanggal_naik,
      tanggal_turun,
      catatan,
      members,
      payment_method,
      total_harga,
    } = req.body;

    if (!nama_ketua || !no_hp || !tanggal_naik || !tanggal_turun || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ success: false, error: 'Data pendaftaran reservasi tidak lengkap! Pastikan nama ketua, no HP, tanggal, dan anggota rombongan terisi.' });
    }

    if (!email) {
      email = `${no_hp.replace(/\D/g, '') || 'pendaki'}@pendaki.muncak.id`;
    }

    // Ensure package exists or fallback to standard SIMAKSI
    let pkg = null;
    if (package_id) {
      pkg = await prisma.bookingPackage.findUnique({ where: { id: package_id } });
    }
    if (!pkg) {
      pkg = await prisma.bookingPackage.findFirst();
    }
    if (!pkg) {
      let route = await prisma.route.findFirst();
      if (!route) {
        route = await prisma.route.create({
          data: {
            nama_jalur: 'Gunung Sumbing Via Pencar',
            slug: 'gunung-sumbing-via-pencar',
            deskripsi: 'Jalur resmi Basecamp Bogowonto Pencar',
            tingkat_kesulitan: 'Sedang',
            total_jarak_km: 7.2,
            estimasi_jam: 7,
            elevasi_start: 1537,
            elevasi_puncak: 3371,
            status: 'Buka',
          }
        });
      }
      pkg = await prisma.bookingPackage.create({
        data: {
          route_id: route.id,
          nama_paket: 'Tiket SIMAKSI Standar Via Pencar',
          slug: 'tiket-simaksi-standar-via-pencar',
          deskripsi: 'Izin masuk resmi pendakian Sumbing Via Pencar + Asuransi Jasa Raharja + Sampah Bag',
          harga_per_orang: 35000,
          durasi_hari: 2,
          min_peserta: 1,
          max_peserta: 20,
        }
      });
    }

    const calculatedTotal = parseInt(total_harga || '0') || (pkg.harga_per_orang * members.length);
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const kodeBooking = `SMB-${randomNum}`;
    const isCash = payment_method === 'CASH';

    // Create booking in Pending state (NOT instantly Paid anymore)
    const booking = await prisma.booking.create({
      data: {
        package_id: pkg.id,
        kode_booking: kodeBooking,
        nama_ketua,
        email,
        no_hp,
        alamat: alamat || 'Indonesia',
        tanggal_naik: new Date(tanggal_naik),
        tanggal_turun: new Date(tanggal_turun),
        jumlah_peserta: members.length,
        total_harga: calculatedTotal,
        catatan: catatan || '',
        status: isCash ? 'Pending' : 'Pending',
        members: {
          create: members.map((m: any, idx: number) => ({
            nama_lengkap: m.nama_lengkap,
            nik: m.nik || '',
            jenis_kelamin: m.jenis_kelamin || 'L',
            umur: parseInt(m.umur || '20'),
            no_hp: m.no_hp || no_hp,
            foto_identitas: m.foto_identitas || '',
            is_ketua: idx === 0,
          })),
        },
        payment: {
          create: {
            metode: payment_method || 'QRIS',
            gateway: isCash ? 'cash' : 'midtrans',
            jumlah: calculatedTotal,
            total: calculatedTotal,
            status: 'Unpaid',
            expired_at: isCash ? null : new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hour expiry for online payment
          },
        },
      },
      include: {
        package: { include: { route: true } },
        members: true,
        payment: true,
        ticket: true,
      },
    });

    // Helper to build QRIS & VA session data
    const cleanNum = kodeBooking.replace(/\D/g, '');
    const defaultPaymentSession = {
      qris_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226580016ID.CO.QRIS.WWW01189360091430000000000215000350005802ID5917BASECAMP BOGOWONTO6008WONOSOBO6304${kodeBooking}`,
      va_numbers: {
        BCA: `88001${cleanNum}`,
        BRI: `12800${cleanNum}`,
        MANDIRI: `89008${cleanNum}`,
      },
      selected_method: payment_method || 'QRIS',
      total_harga: calculatedTotal,
      expired_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    // For CASH payment: return booking code directly (no Midtrans)
    if (isCash) {
      return res.json({
        success: true,
        data: booking,
        payment_type: 'cash',
        payment_session: defaultPaymentSession,
        message: 'Reservasi berhasil dibuat! Tunjukkan kode booking kepada petugas loket basecamp untuk pembayaran tunai.',
      });
    }

    // For ONLINE payment: check Midtrans keys
    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || '';
    if (!midtransServerKey || midtransServerKey.includes('XXXX')) {
      // Return interactive QRIS & VA payment modal session
      await prisma.payment.update({
        where: { booking_id: booking.id },
        data: {
          snap_token: `LOCAL-SIM-${kodeBooking}`,
          snap_url: '#',
          gateway_trx_id: kodeBooking,
        },
      });

      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { package: { include: { route: true } }, members: true, payment: true, ticket: true },
      });

      return res.json({
        success: true,
        data: updatedBooking,
        payment_type: 'interactive_modal',
        payment_session: defaultPaymentSession,
        message: 'Reservasi berhasil dibuat! Silakan selesaikan pembayaran QRIS atau Virtual Account di bawah.',
      });
    }

    // Create Midtrans Snap transaction
    try {
      const parameter = {
        transaction_details: {
          order_id: kodeBooking,
          gross_amount: calculatedTotal,
        },
        customer_details: {
          first_name: nama_ketua,
          email: email,
          phone: no_hp,
        },
        item_details: [
          {
            id: pkg.id,
            price: pkg.harga_per_orang,
            quantity: members.length,
            name: pkg.nama_paket.substring(0, 50),
          },
        ],
        expiry: {
          unit: 'hour',
          duration: 2,
        },
        callbacks: {
          finish: `${req.protocol}://${req.get('host')}/reservasi?mode=check&code=${kodeBooking}`,
        },
      };

      const snapTransaction = await snap.createTransaction(parameter);

      // Save snap_token and snap_url in payment record
      await prisma.payment.update({
        where: { booking_id: booking.id },
        data: {
          snap_token: snapTransaction.token,
          snap_url: snapTransaction.redirect_url,
          gateway_trx_id: kodeBooking,
        },
      });

      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { package: { include: { route: true } }, members: true, payment: true, ticket: true },
      });

      return res.json({
        success: true,
        data: updatedBooking,
        payment_type: 'midtrans',
        snap_token: snapTransaction.token,
        snap_redirect_url: snapTransaction.redirect_url,
        payment_session: defaultPaymentSession,
        message: 'Reservasi berhasil dibuat! Silakan selesaikan pembayaran.',
      });
    } catch (midtransError: any) {
      console.error('Midtrans Snap error:', midtransError);

      await prisma.payment.update({
        where: { booking_id: booking.id },
        data: {
          snap_token: `LOCAL-SIM-${kodeBooking}`,
          snap_url: '#',
          gateway_trx_id: kodeBooking,
        },
      });

      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { package: { include: { route: true } }, members: true, payment: true, ticket: true },
      });

      return res.json({
        success: true,
        data: updatedBooking,
        payment_type: 'interactive_modal',
        payment_session: defaultPaymentSession,
        message: 'Silakan selesaikan pembayaran QRIS atau Virtual Account di bawah.',
      });
    }

  } catch (err: any) {
    console.error('Error creating booking:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan sistem saat memproses reservasi: ' + (err.message || '') });
  }
});

// ============================================
// MIDTRANS WEBHOOK / NOTIFICATION HANDLER
// ============================================
app.post('/api/midtrans/notification', async (req, res) => {
  try {
    const notification = await snap.transaction.notification(req.body);
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    console.log(`[Midtrans Webhook] order_id=${orderId} status=${transactionStatus} fraud=${fraudStatus}`);

    // Find the booking by kode_booking (which we used as order_id)
    const booking = await prisma.booking.findUnique({
      where: { kode_booking: orderId },
      include: { payment: true },
    });

    if (!booking || !booking.payment) {
      console.warn(`[Midtrans Webhook] Booking not found for order_id=${orderId}`);
      return res.status(200).send('OK');
    }

    // Idempotency: skip if already Paid
    if (booking.payment.status === 'Paid') {
      return res.status(200).send('OK');
    }

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        // Payment successful!
        await prisma.payment.update({
          where: { booking_id: booking.id },
          data: {
            status: 'Paid',
            paid_at: new Date(),
            metode: notification.payment_type || booking.payment.metode,
            raw_response: notification as any,
          },
        });
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'Paid' },
        });
        // Generate ticket
        await generateTicketForBooking(booking.id, orderId);
        console.log(`[Midtrans Webhook] Payment SUCCESS for ${orderId}`);
      }
    } else if (transactionStatus === 'pending') {
      await prisma.payment.update({
        where: { booking_id: booking.id },
        data: { status: 'Pending', raw_response: notification as any },
      });
    } else if (transactionStatus === 'expire') {
      await prisma.payment.update({
        where: { booking_id: booking.id },
        data: { status: 'Expired', raw_response: notification as any },
      });
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'Expired' },
      });
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny') {
      await prisma.payment.update({
        where: { booking_id: booking.id },
        data: { status: 'Failed', raw_response: notification as any },
      });
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'Cancelled' },
      });
    }

    res.status(200).send('OK');
  } catch (err: any) {
    console.error('[Midtrans Webhook] Error:', err);
    res.status(200).send('OK'); // Always return 200 to Midtrans
  }
});

// Simulate / Instant Confirm Payment (For interactive QRIS & VA modal testing)
app.post('/api/bookings/:id/pay-simulate', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { payment: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking tidak ditemukan.' });
    }

    await prisma.payment.update({
      where: { booking_id: booking.id },
      data: { status: 'Paid', paid_at: new Date() },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'Paid' },
    });

    await generateTicketForBooking(booking.id, booking.kode_booking);

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { package: { include: { route: true } }, members: true, payment: true, ticket: true },
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Pembayaran QRIS / Virtual Account berhasil dikonfirmasi! Tiket digital telah diterbitkan.',
    });
  } catch (err: any) {
    console.error('Error simulating payment:', err);
    res.status(500).json({ success: false, error: 'Gagal mengonfirmasi pembayaran.' });
  }
});

// Get Payment Status for a Booking (polling endpoint)
app.get('/api/bookings/:id/payment-status', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        payment: true,
        ticket: true,
        package: { include: { route: true } },
        members: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking tidak ditemukan.' });
    }

    res.json({
      success: true,
      data: {
        booking_id: booking.id,
        kode_booking: booking.kode_booking,
        booking_status: booking.status,
        payment_status: booking.payment?.status || 'Unpaid',
        payment_method: booking.payment?.metode,
        snap_token: booking.payment?.snap_token,
        snap_url: booking.payment?.snap_url,
        expired_at: booking.payment?.expired_at,
        paid_at: booking.payment?.paid_at,
        ticket: booking.ticket,
        booking: booking,
      },
    });
  } catch (err: any) {
    console.error('Error fetching payment status:', err);
    res.status(500).json({ success: false, error: 'Gagal mengecek status pembayaran.' });
  }
});

// Get Midtrans Client Key (for frontend Snap.js)
app.get('/api/midtrans/client-key', (_req, res) => {
  const clientKey = process.env.MIDTRANS_CLIENT_KEY || '';
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  res.json({
    success: true,
    data: {
      client_key: clientKey,
      is_production: isProduction,
      snap_url: isProduction
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js',
    },
  });
});

// Check/Get Booking by Code, Ticket Code, or Phone Number
app.get('/api/bookings/check/:code', async (req, res) => {
  try {
    const rawCode = req.params.code.trim();
    const cleanPhone = rawCode.replace(/\D/g, '');

    let booking = await prisma.booking.findUnique({
      where: { kode_booking: rawCode },
      include: {
        package: { include: { route: true } },
        members: true,
        payment: true,
        ticket: true,
      },
    });

    if (!booking) {
      booking = await prisma.booking.findFirst({
        where: {
          OR: [
            { kode_booking: { equals: rawCode } },
            { no_hp: { contains: rawCode } },
            ...(cleanPhone ? [{ no_hp: { contains: cleanPhone } }] : []),
            { email: { equals: rawCode } },
            { ticket: { kode_tiket: { equals: rawCode } } },
          ],
        },
        include: {
          package: { include: { route: true } },
          members: true,
          payment: true,
          ticket: true,
        },
        orderBy: { created_at: 'desc' },
      });
    }

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Data tiket/reservasi tidak ditemukan. Pastikan kode booking atau nomor WhatsApp sudah benar.' });
    }

    res.json({ success: true, data: booking });
  } catch (err: any) {
    console.error('Error checking booking:', err);
    res.status(500).json({ success: false, error: 'Gagal mencari data reservasi.' });
  }
});

// ============================================
// ADMIN API ENDPOINTS (Protected by authenticateAdmin)
// ============================================

// Get admin stats
app.get('/api/admin/stats', authenticateAdmin, async (_req, res) => {
  try {
    const [bookings, routesCount, pendingReviewsCount] = await Promise.all([
      prisma.booking.findMany({ include: { payment: true } }),
      prisma.route.count({ where: { is_active: true, status: 'Buka' } }),
      prisma.review.count({ where: { is_approved: false } }),
    ]);

    const totalBookings = bookings.length;
    const paidBookings = bookings.filter(b => b.status === 'Paid' || b.status === 'CheckedIn' || b.status === 'CheckedOut');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.total_harga, 0);
    const totalHikers = paidBookings.reduce((sum, b) => sum + b.jumlah_peserta, 0);

    res.json({
      success: true,
      data: {
        totalBookings,
        totalRevenue,
        totalHikers,
        openRoutes: routesCount,
        pendingReviews: pendingReviewsCount,
      },
    });
  } catch (err: any) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil statistik admin.' });
  }
});

// Get all bookings
app.get('/api/admin/bookings', authenticateAdmin, async (_req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        package: { include: { route: true } },
        members: true,
        payment: true,
        ticket: true,
      },
    });
    res.json({ success: true, data: bookings });
  } catch (err: any) {
    console.error('Error fetching admin bookings:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil daftar booking.' });
  }
});

// Update booking status
app.put('/api/admin/bookings/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Status wajib diisi.' });

    const updatedBooking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
      include: { ticket: true, payment: true },
    });

    // If status changed to Paid or Confirmed, sync payment status and generate ticket
    if (status === 'Paid' || status === 'Confirmed') {
      if (updatedBooking.payment && updatedBooking.payment.status !== 'Paid') {
        await prisma.payment.update({
          where: { booking_id: updatedBooking.id },
          data: { status: 'Paid', paid_at: new Date() },
        });
      }
      if (!updatedBooking.ticket) {
        await generateTicketForBooking(updatedBooking.id, updatedBooking.kode_booking);
      }
    }

    // Update ticket check-in/out timestamps accordingly
    if (updatedBooking.ticket || (status === 'CheckedIn' || status === 'CheckedOut')) {
      const ticket = updatedBooking.ticket || (await prisma.ticket.findUnique({ where: { booking_id: updatedBooking.id } }));
      if (ticket) {
        if (status === 'CheckedIn') {
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: { checked_in_at: new Date(), status: 'Used' },
          });
        } else if (status === 'CheckedOut') {
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: { checked_out_at: new Date() },
          });
        }
      }
    }

    const finalBooking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { package: { include: { route: true } }, members: true, payment: true, ticket: true },
    });

    res.json({ success: true, data: finalBooking, message: 'Status booking berhasil diperbarui.' });
  } catch (err: any) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ success: false, error: 'Gagal memperbarui status booking.' });
  }
});

// Get all reviews (moderation)
app.get('/api/admin/reviews', authenticateAdmin, async (_req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: reviews });
  } catch (err: any) {
    console.error('Error fetching admin reviews:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil daftar ulasan.' });
  }
});

// Approve a review
app.put('/api/admin/reviews/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const { is_approved } = req.body;
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { is_approved },
    });
    res.json({ success: true, data: review, message: is_approved ? 'Ulasan disetujui.' : 'Ulasan dibatalkan persetujuannya.' });
  } catch (err: any) {
    console.error('Error approving review:', err);
    res.status(500).json({ success: false, error: 'Gagal mengubah status ulasan.' });
  }
});

// Delete a review
app.delete('/api/admin/reviews/:id', authenticateAdmin, async (req, res) => {
  try {
    await prisma.review.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true, message: 'Ulasan berhasil dihapus.' });
  } catch (err: any) {
    console.error('Error deleting review:', err);
    res.status(500).json({ success: false, error: 'Gagal menghapus ulasan.' });
  }
});

// Toggle route status
app.put('/api/admin/routes/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'Status rute wajib diisi.' });

    const route = await prisma.route.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ success: true, data: route, message: 'Status jalur berhasil diperbarui.' });
  } catch (err: any) {
    console.error('Error updating route status:', err);
    res.status(500).json({ success: false, error: 'Gagal memperbarui status jalur.' });
  }
});

// Update route details
app.put('/api/admin/routes/:id', authenticateAdmin, async (req, res) => {
  try {
    const { nama_jalur, deskripsi, status, tingkat_kesulitan, total_jarak_km, estimasi_jam, elevasi_start, elevasi_puncak } = req.body;
    const route = await prisma.route.update({
      where: { id: req.params.id },
      data: {
        ...(nama_jalur && { nama_jalur }),
        ...(deskripsi !== undefined && { deskripsi }),
        ...(status && { status }),
        ...(tingkat_kesulitan && { tingkat_kesulitan }),
        ...(total_jarak_km !== undefined && { total_jarak_km: parseFloat(total_jarak_km) }),
        ...(estimasi_jam !== undefined && { estimasi_jam: parseFloat(estimasi_jam) }),
        ...(elevasi_start !== undefined && { elevasi_start: parseInt(elevasi_start) }),
        ...(elevasi_puncak !== undefined && { elevasi_puncak: parseInt(elevasi_puncak) }),
      },
    });
    res.json({ success: true, data: route, message: 'Data jalur berhasil diperbarui.' });
  } catch (err: any) {
    console.error('Error updating route:', err);
    res.status(500).json({ success: false, error: 'Gagal memperbarui data jalur.' });
  }
});

// ============================================
// CMS: ARTICLES / BERITA
// ============================================

// Get all articles (Admin)
app.get('/api/admin/articles', authenticateAdmin, async (_req, res) => {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        category: true,
        author: { select: { id: true, nama_lengkap: true, username: true } },
      },
    });
    res.json({ success: true, data: articles });
  } catch (err: any) {
    console.error('Error fetching admin articles:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil daftar artikel.' });
  }
});

// Create article
app.post('/api/admin/articles', authenticateAdmin, async (req: any, res) => {
  try {
    const { judul, category_name, ringkasan, konten, foto_sampul, status, is_featured } = req.body;
    if (!judul || !konten) {
      return res.status(400).json({ success: false, error: 'Judul dan isi konten artikel wajib diisi!' });
    }

    const slug = judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    // Find or create category
    const catName = category_name || 'Pengumuman';
    const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let category = await prisma.articleCategory.findUnique({ where: { slug: catSlug } });
    if (!category) {
      category = await prisma.articleCategory.create({
        data: { nama_kategori: catName, slug: catSlug },
      });
    }

    // Find admin author
    let authorId = req.user?.id;
    if (!authorId) {
      const adminUser = await prisma.user.findFirst();
      authorId = adminUser?.id;
    }

    const article = await prisma.article.create({
      data: {
        judul,
        slug,
        category_id: category.id,
        author_id: authorId,
        ringkasan: ringkasan || judul,
        konten,
        foto_sampul: foto_sampul || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
        status: status || 'Terbit',
        is_featured: Boolean(is_featured),
        tanggal_terbit: new Date(),
      },
      include: { category: true, author: { select: { nama_lengkap: true } } },
    });

    res.json({ success: true, data: article, message: 'Artikel berita berhasil diterbitkan!' });
  } catch (err: any) {
    console.error('Error creating article:', err);
    res.status(500).json({ success: false, error: 'Gagal membuat artikel baru: ' + err.message });
  }
});

// Update article
app.put('/api/admin/articles/:id', authenticateAdmin, async (req, res) => {
  try {
    const { judul, category_name, ringkasan, konten, foto_sampul, status, is_featured } = req.body;
    
    let categoryId: string | undefined = undefined;
    if (category_name) {
      const catSlug = category_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let category = await prisma.articleCategory.findUnique({ where: { slug: catSlug } });
      if (!category) {
        category = await prisma.articleCategory.create({
          data: { nama_kategori: category_name, slug: catSlug },
        });
      }
      categoryId = category.id;
    }

    const article = await prisma.article.update({
      where: { id: req.params.id },
      data: {
        ...(judul && { judul }),
        ...(categoryId && { category_id: categoryId }),
        ...(ringkasan !== undefined && { ringkasan }),
        ...(konten && { konten }),
        ...(foto_sampul !== undefined && { foto_sampul }),
        ...(status && { status }),
        ...(is_featured !== undefined && { is_featured: Boolean(is_featured) }),
      },
      include: { category: true },
    });

    res.json({ success: true, data: article, message: 'Artikel berhasil diperbarui!' });
  } catch (err: any) {
    console.error('Error updating article:', err);
    res.status(500).json({ success: false, error: 'Gagal memperbarui artikel.' });
  }
});

// Delete article
app.delete('/api/admin/articles/:id', authenticateAdmin, async (req, res) => {
  try {
    await prisma.article.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Artikel berhasil dihapus.' });
  } catch (err: any) {
    console.error('Error deleting article:', err);
    res.status(500).json({ success: false, error: 'Gagal menghapus artikel.' });
  }
});

// ============================================
// CMS: GALLERIES / DOKUMENTASI
// ============================================

// Get all galleries (Admin)
app.get('/api/admin/galleries', authenticateAdmin, async (_req, res) => {
  try {
    const galleries = await prisma.gallery.findMany({
      orderBy: { created_at: 'desc' },
      include: { category: true },
    });
    res.json({ success: true, data: galleries });
  } catch (err: any) {
    console.error('Error fetching admin galleries:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil galeri foto.' });
  }
});

// Create gallery item
app.post('/api/admin/galleries', authenticateAdmin, async (req, res) => {
  try {
    const { judul, category_name, deskripsi, url_media, is_featured } = req.body;
    if (!judul || !url_media) {
      return res.status(400).json({ success: false, error: 'Judul dan URL foto/video wajib diisi!' });
    }

    const catName = category_name || 'Lanskap & Puncak';
    const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let category = await prisma.galleryCategory.findUnique({ where: { slug: catSlug } });
    if (!category) {
      category = await prisma.galleryCategory.create({
        data: { nama_kategori: catName, slug: catSlug },
      });
    }

    const gallery = await prisma.gallery.create({
      data: {
        category_id: category.id,
        judul,
        deskripsi: deskripsi || '',
        url_media,
        is_featured: Boolean(is_featured),
      },
      include: { category: true },
    });

    res.json({ success: true, data: gallery, message: 'Foto dokumentasi berhasil ditambahkan ke galeri!' });
  } catch (err: any) {
    console.error('Error creating gallery item:', err);
    res.status(500).json({ success: false, error: 'Gagal menambahkan foto galeri.' });
  }
});

// Delete gallery item
app.delete('/api/admin/galleries/:id', authenticateAdmin, async (req, res) => {
  try {
    await prisma.gallery.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Foto galeri berhasil dihapus.' });
  } catch (err: any) {
    console.error('Error deleting gallery item:', err);
    res.status(500).json({ success: false, error: 'Gagal menghapus foto galeri.' });
  }
});

// ============================================
// CMS: PACKAGES / TARIF SIMAKSI
// ============================================

app.put('/api/admin/packages/:id', authenticateAdmin, async (req, res) => {
  try {
    const { nama_paket, harga_per_orang, deskripsi } = req.body;
    const pkg = await prisma.bookingPackage.update({
      where: { id: req.params.id },
      data: {
        ...(nama_paket && { nama_paket }),
        ...(harga_per_orang !== undefined && { harga_per_orang: parseInt(harga_per_orang) }),
        ...(deskripsi !== undefined && { deskripsi }),
      },
    });
    res.json({ success: true, data: pkg, message: 'Tarif paket SIMAKSI berhasil diperbarui!' });
  } catch (err: any) {
    console.error('Error updating package:', err);
    res.status(500).json({ success: false, error: 'Gagal memperbarui tarif paket.' });
  }
});

// ============================================
// CMS: ROUTE SEGMENTS (SEGMENTASI LINTASAN)
// ============================================

// Create segment
app.post('/api/admin/routes/:routeId/segments', authenticateAdmin, async (req, res) => {
  try {
    const { nama_segmen, deskripsi, jarak_km, estimasi_menit, elevasi_naik, elevasi_turun, tingkat_kesulitan, urutan } = req.body;
    if (!nama_segmen) {
      return res.status(400).json({ success: false, error: 'Nama segmen wajib diisi.' });
    }

    const segment = await prisma.segment.create({
      data: {
        route_id: req.params.routeId,
        nama_segmen,
        deskripsi: deskripsi || '',
        jarak_km: parseFloat(jarak_km || '1.0'),
        estimasi_menit: parseInt(estimasi_menit || '60'),
        elevasi_naik: parseInt(elevasi_naik || '0'),
        elevasi_turun: parseInt(elevasi_turun || '0'),
        tingkat_kesulitan: tingkat_kesulitan || 'Sedang',
        urutan: parseInt(urutan || '0'),
      },
    });

    res.json({ success: true, data: segment, message: 'Segmen rute berhasil ditambahkan!' });
  } catch (err: any) {
    console.error('Error creating segment:', err);
    res.status(500).json({ success: false, error: 'Gagal menambahkan segmen rute.' });
  }
});

// Update segment
app.put('/api/admin/segments/:id', authenticateAdmin, async (req, res) => {
  try {
    const { nama_segmen, deskripsi, jarak_km, estimasi_menit, elevasi_naik, elevasi_turun, tingkat_kesulitan, urutan } = req.body;

    const segment = await prisma.segment.update({
      where: { id: req.params.id },
      data: {
        ...(nama_segmen && { nama_segmen }),
        ...(deskripsi !== undefined && { deskripsi }),
        ...(jarak_km !== undefined && { jarak_km: parseFloat(jarak_km) }),
        ...(estimasi_menit !== undefined && { estimasi_menit: parseInt(estimasi_menit) }),
        ...(elevasi_naik !== undefined && { elevasi_naik: parseInt(elevasi_naik) }),
        ...(elevasi_turun !== undefined && { elevasi_turun: parseInt(elevasi_turun) }),
        ...(tingkat_kesulitan && { tingkat_kesulitan }),
        ...(urutan !== undefined && { urutan: parseInt(urutan) }),
      },
    });

    res.json({ success: true, data: segment, message: 'Segmen rute berhasil diperbarui!' });
  } catch (err: any) {
    console.error('Error updating segment:', err);
    res.status(500).json({ success: false, error: 'Gagal memperbarui segmen rute.' });
  }
});

// Delete segment
app.delete('/api/admin/segments/:id', authenticateAdmin, async (req, res) => {
  try {
    await prisma.segment.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Segmen rute berhasil dihapus.' });
  } catch (err: any) {
    console.error('Error deleting segment:', err);
    res.status(500).json({ success: false, error: 'Gagal menghapus segmen rute.' });
  }
});

// ============================================
// CMS: CHECKPOINT POSTS (POS PENDAKIAN)
// ============================================

// Create post
app.post('/api/admin/routes/:routeId/posts', authenticateAdmin, async (req, res) => {
  try {
    const { nama_pos, deskripsi, elevasi, latitude, longitude, fasilitas, urutan } = req.body;
    if (!nama_pos) {
      return res.status(400).json({ success: false, error: 'Nama pos wajib diisi.' });
    }

    const post = await prisma.post.create({
      data: {
        route_id: req.params.routeId,
        nama_pos,
        deskripsi: deskripsi || '',
        elevasi: parseInt(elevasi || '0'),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        fasilitas: fasilitas || [],
        urutan: parseInt(urutan || '0'),
      },
    });

    res.json({ success: true, data: post, message: 'Pos pendakian berhasil ditambahkan!' });
  } catch (err: any) {
    console.error('Error creating post:', err);
    res.status(500).json({ success: false, error: 'Gagal menambahkan pos pendakian.' });
  }
});

// Update post
app.put('/api/admin/posts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { nama_pos, deskripsi, elevasi, latitude, longitude, fasilitas, urutan } = req.body;

    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        ...(nama_pos && { nama_pos }),
        ...(deskripsi !== undefined && { deskripsi }),
        ...(elevasi !== undefined && { elevasi: parseInt(elevasi) }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(fasilitas !== undefined && { fasilitas }),
        ...(urutan !== undefined && { urutan: parseInt(urutan) }),
      },
    });

    res.json({ success: true, data: post, message: 'Pos pendakian berhasil diperbarui!' });
  } catch (err: any) {
    console.error('Error updating post:', err);
    res.status(500).json({ success: false, error: 'Gagal memperbarui pos pendakian.' });
  }
});

// Delete post
app.delete('/api/admin/posts/:id', authenticateAdmin, async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Pos pendakian berhasil dihapus.' });
  } catch (err: any) {
    console.error('Error deleting post:', err);
    res.status(500).json({ success: false, error: 'Gagal menghapus pos pendakian.' });
  }
});

// ============================================
// CMS: GPX TRACK DATA
// ============================================

// Create / Add GPX
app.post('/api/admin/routes/:routeId/gpx', authenticateAdmin, async (req, res) => {
  try {
    const { nama_file, file_url, total_jarak_km, elevasi_gain, elevasi_loss, elevasi_min, elevasi_max, total_waypoints, deskripsi } = req.body;
    if (!nama_file || !file_url) {
      return res.status(400).json({ success: false, error: 'Nama file dan URL file GPX wajib diisi.' });
    }

    const gpx = await prisma.routeGpx.create({
      data: {
        route_id: req.params.routeId,
        nama_file,
        file_url,
        total_jarak_km: total_jarak_km ? parseFloat(total_jarak_km) : null,
        elevasi_gain: elevasi_gain ? parseInt(elevasi_gain) : null,
        elevasi_loss: elevasi_loss ? parseInt(elevasi_loss) : null,
        elevasi_min: elevasi_min ? parseInt(elevasi_min) : null,
        elevasi_max: elevasi_max ? parseInt(elevasi_max) : null,
        total_waypoints: total_waypoints ? parseInt(total_waypoints) : null,
        deskripsi: deskripsi || '',
      },
    });

    res.json({ success: true, data: gpx, message: 'File GPX berhasil didaftarkan!' });
  } catch (err: any) {
    console.error('Error adding GPX:', err);
    res.status(500).json({ success: false, error: 'Gagal menambahkan data GPX.' });
  }
});

// Update GPX
app.put('/api/admin/gpx/:id', authenticateAdmin, async (req, res) => {
  try {
    const { nama_file, file_url, total_jarak_km, elevasi_gain, elevasi_loss, elevasi_min, elevasi_max, total_waypoints, deskripsi } = req.body;

    const gpx = await prisma.routeGpx.update({
      where: { id: req.params.id },
      data: {
        ...(nama_file && { nama_file }),
        ...(file_url && { file_url }),
        ...(total_jarak_km !== undefined && { total_jarak_km: total_jarak_km ? parseFloat(total_jarak_km) : null }),
        ...(elevasi_gain !== undefined && { elevasi_gain: elevasi_gain ? parseInt(elevasi_gain) : null }),
        ...(elevasi_loss !== undefined && { elevasi_loss: elevasi_loss ? parseInt(elevasi_loss) : null }),
        ...(elevasi_min !== undefined && { elevasi_min: elevasi_min ? parseInt(elevasi_min) : null }),
        ...(elevasi_max !== undefined && { elevasi_max: elevasi_max ? parseInt(elevasi_max) : null }),
        ...(total_waypoints !== undefined && { total_waypoints: total_waypoints ? parseInt(total_waypoints) : null }),
        ...(deskripsi !== undefined && { deskripsi }),
      },
    });

    res.json({ success: true, data: gpx, message: 'Data GPX berhasil diperbarui!' });
  } catch (err: any) {
    console.error('Error updating GPX:', err);
    res.status(500).json({ success: false, error: 'Gagal memperbarui data GPX.' });
  }
});

// Delete GPX
app.delete('/api/admin/gpx/:id', authenticateAdmin, async (req, res) => {
  try {
    await prisma.routeGpx.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Data GPX berhasil dihapus.' });
  } catch (err: any) {
    console.error('Error deleting GPX:', err);
    res.status(500).json({ success: false, error: 'Gagal menghapus data GPX.' });
  }
});





// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username dan password wajib diisi!' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username }, include: { role: true } });

    if (user && user.is_active) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const { password: _, ...userWithoutPassword } = user;
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role?.name },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({ success: true, user: userWithoutPassword, token });
      }
    }

    return res.status(401).json({ success: false, error: 'Username atau Password salah!' });
  } catch (err: any) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan saat login.' });
  }
});

app.get('/api/auth/verify', authenticateAdmin, (req: any, res: any) => {
  res.json({ success: true, user: req.admin });
});

// ============================================
// FILE UPLOAD (Admin)
// ============================================

app.post('/api/upload', authenticateAdmin, async (req: any, res: any) => {
  const { fileName, fileData } = req.body;
  if (!fileName || !fileData) {
    return res.status(400).json({ success: false, error: 'Nama berkas dan data wajib diisi!' });
  }

  const fileExt = path.extname(fileName).toLowerCase();
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.gpx'];
  if (!allowed.includes(fileExt)) {
    return res.status(400).json({ success: false, error: 'Format berkas tidak diizinkan!' });
  }

  try {
    const base64Data = fileData.replace(/^data:.*;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Ukuran melebihi 10MB!' });
    }

    const baseName = path.basename(fileName, fileExt).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueFileName = `${baseName}_${Date.now()}${fileExt}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(`uploads/${uniqueFileName}`, buffer, { access: 'public' });
      res.json({ success: true, url: blob.url });
    } else {
      const filePath = path.join(uploadsDir, uniqueFileName);
      fs.writeFileSync(filePath, buffer);
      res.json({ success: true, url: `/uploads/${uniqueFileName}` });
    }
  } catch (err: any) {
    console.error('Error uploading file:', err);
    res.status(500).json({ success: false, error: 'Gagal mengunggah berkas.' });
  }
});

// ============================================
// PRODUCTION: Serve static files
// ============================================

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve('dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve('dist/index.html'));
  });
}

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🏔️ Basecamp Sumbing API running on http://localhost:${PORT}`);
  });
}

export default app;
