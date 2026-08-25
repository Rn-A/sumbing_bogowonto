# Basecamp Gunung Sumbing — Portal Digital Resmi

Portal digital Basecamp Gunung Sumbing yang mengintegrasikan reservasi pendakian online, informasi jalur & cuaca, marketplace katalog, berita, galeri, dan dashboard administrasi.

## 🏔️ Fitur Utama

- **Home**: Hero section, status gunung, cuaca real-time, paket populer, berita terbaru, galeri, review
- **Profile**: Tentang basecamp, fasilitas, rute interaktif (Leaflet), segmentasi jalur, pos pendakian, download GPX, kalkulator logistik, live cuaca, FAQ, review
- **Katalog**: Marketplace — Paket Pendakian, Sewa Alat, Homestay, Porter & Guide, Merchandise, Warung, UMKM Lokal
- **Berita**: Kategori — Pendakian, Pengumuman, Cuaca, Event, Konservasi, Wisata
- **Reservasi**: Booking flow multi-step — Tanggal → Jalur → Paket → Biodata → Anggota → Upload ID → Checkout → Payment → QR Ticket
- **Galeri**: Foto & video dokumentasi pendakian
- **Kontak**: Form pesan, peta lokasi, info kontak
- **Dashboard Admin**: CRUD lengkap untuk semua data

## 🛠️ Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **React Router** — client-side routing
- **TanStack Query** — server-state management
- **Axios** — HTTP client
- **Tailwind CSS v4** — styling
- **Motion (Framer Motion)** — animations
- **React Hook Form** + **Zod** — form validation
- **Leaflet** + **React-Leaflet** — interactive maps
- **Recharts** — elevation charts
- **Lucide React** — icons

### Backend
- **Express.js** + **TypeScript**
- **Prisma ORM** — database access
- **JWT** — authentication
- **Sharp** — image processing
- **Nodemailer** — email
- **node-cron** — scheduled tasks
- **Vercel Blob** — file storage

### Database
- **TiDB Serverless** (MySQL compatible)

## 📦 Struktur Proyek

```text
basecamp-sumbing/
├── prisma/
│   └── schema.prisma         # Database models (24+ tabel)
├── server/
│   └── index.ts              # Express API server
├── src/
│   ├── components/
│   │   └── layout/            # Header, Footer
│   ├── features/
│   │   ├── home/              # Home page
│   │   ├── profile/           # Profile page
│   │   ├── katalog/           # Katalog/Marketplace page
│   │   ├── berita/            # Berita/News page
│   │   ├── reservasi/         # Reservasi/Booking page
│   │   ├── galeri/            # Galeri page
│   │   └── kontak/            # Kontak page
│   ├── services/
│   │   └── api.ts             # Axios API service
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── App.tsx                # Route definitions & layout
│   ├── main.tsx               # Entry point (Router + QueryClient)
│   └── index.css              # Design system & global styles
├── package.json
├── vite.config.ts
├── tsconfig.json
└── vercel.json
```

## ⚙️ Cara Menjalankan

### Prasyarat
- **Node.js** v18+
- **Database** TiDB / MySQL

### Langkah
1. Clone repository & install dependencies:
   ```bash
   npm install
   ```

2. Copy dan isi environment variables:
   ```bash
   cp .env.example .env
   ```

3. Generate Prisma client & push schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Jalankan development server:
   ```bash
   npm run dev:all
   ```

5. Buka [http://localhost:3000](http://localhost:3000)

## 🏗️ Build untuk Produksi

```bash
npm run build
```

Hasil build di folder `/dist`.
