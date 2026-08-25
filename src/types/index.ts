// =============================================
// Basecamp Gunung Sumbing — TypeScript Types
// =============================================

// --- Auth & Users ---
export interface User {
  id: string;
  username: string;
  email: string;
  nama_lengkap: string;
  phone?: string;
  avatar?: string;
  role_id: string;
  role?: Role;
  is_active: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

// --- Articles / Berita ---
export type ArticleStatus = 'Draft' | 'Terbit';

export interface ArticleCategory {
  id: string;
  nama_kategori: string;
  slug: string;
  icon?: string;
  urutan: number;
}

export interface Article {
  id: string;
  author_id: string;
  category_id: string;
  judul: string;
  slug: string;
  ringkasan?: string;
  konten: string;
  foto_sampul?: string;
  status: ArticleStatus;
  is_featured: boolean;
  views: number;
  tanggal_terbit?: string;
  created_at: string;
  updated_at: string;
  author?: User;
  category?: ArticleCategory;
}

// --- Gallery ---
export type MediaType = 'image' | 'video';

export interface GalleryCategory {
  id: string;
  nama_kategori: string;
  slug: string;
  urutan: number;
}

export interface GalleryItem {
  id: string;
  category_id: string;
  judul: string;
  deskripsi?: string;
  url_media: string;
  media_type: MediaType;
  is_featured: boolean;
  urutan: number;
  created_at: string;
  category?: GalleryCategory;
}

// --- Routes / Jalur Pendakian ---
export type RouteStatus = 'Buka' | 'Tutup' | 'Maintenance';
export type DifficultyLevel = 'Mudah' | 'Sedang' | 'Sulit' | 'Sangat Sulit';

export interface HikingRoute {
  id: string;
  nama_jalur: string;
  slug: string;
  deskripsi?: string;
  tingkat_kesulitan: DifficultyLevel;
  total_jarak_km: number;
  estimasi_jam: number;
  elevasi_start: number;
  elevasi_puncak: number;
  status: RouteStatus;
  foto_sampul?: string;
  map_center_lat?: number;
  map_center_lng?: number;
  map_zoom?: number;
  is_active: boolean;
  segments?: RouteSegment[];
  posts?: HikingPost[];
  gpx_files?: RouteGpxFile[];
  booking_packages?: BookingPackage[];
}

export interface RouteSegment {
  id: string;
  route_id: string;
  nama_segmen: string;
  deskripsi?: string;
  jarak_km: number;
  estimasi_menit: number;
  elevasi_naik: number;
  elevasi_turun: number;
  tingkat_kesulitan: DifficultyLevel;
  urutan: number;
}

export interface HikingPost {
  id: string;
  route_id: string;
  nama_pos: string;
  deskripsi?: string;
  elevasi: number;
  latitude?: number;
  longitude?: number;
  fasilitas?: string[];
  foto?: string;
  urutan: number;
}

export interface RouteGpxFile {
  id: string;
  route_id: string;
  nama_file: string;
  file_url: string;
  total_jarak_km?: number;
  elevasi_gain?: number;
  elevasi_loss?: number;
  elevasi_min?: number;
  elevasi_max?: number;
  total_waypoints?: number;
  deskripsi?: string;
  download_count: number;
  created_at: string;
}

// GPX parsed data for preview
export interface GpxTrackPoint {
  lat: number;
  lon: number;
  ele: number;
  time?: string;
  distance?: number; // cumulative distance in km
}

export interface GpxParsedData {
  name?: string;
  description?: string;
  points: GpxTrackPoint[];
  totalDistance: number;
  elevationGain: number;
  elevationLoss: number;
  minElevation: number;
  maxElevation: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

// --- Weather ---
export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  description: string;
  icon: string;
  visibility: number;
  pressure: number;
  clouds: number;
  rain?: number;
  uvi?: number;
  fetched_at: string;
}

export interface WeatherForecast {
  current: WeatherData;
  hourly?: WeatherData[];
  daily?: DailyForecast[];
}

export interface DailyForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string;
  rain_chance: number;
}

// --- Reviews ---
export interface Review {
  id: string;
  user_id?: string;
  nama: string;
  email?: string;
  rating: number;
  komentar: string;
  foto?: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  user?: User;
}

// --- Products / Catalog ---
export type ProductType = 'produk' | 'sewa' | 'homestay' | 'porter' | 'guide' | 'merchandise' | 'warung' | 'umkm';

export interface ProductCategory {
  id: string;
  nama_kategori: string;
  slug: string;
  tipe: ProductType;
  icon?: string;
  urutan: number;
}

export interface Product {
  id: string;
  category_id: string;
  nama_produk: string;
  slug: string;
  deskripsi?: string;
  harga: number;
  harga_diskon?: number;
  satuan?: string;
  foto?: string;
  foto_gallery?: string[];
  stok?: number;
  rating?: number;
  is_available: boolean;
  is_featured: boolean;
  kontak_wa?: string;
  lokasi?: string;
  fasilitas?: string[];
  created_at: string;
  category?: ProductCategory;
}

// --- Booking / Reservasi ---
export type BookingStatus = 'Pending' | 'Confirmed' | 'Paid' | 'CheckedIn' | 'CheckedOut' | 'Cancelled' | 'Expired';

export interface BookingPackage {
  id: string;
  route_id: string;
  nama_paket: string;
  slug: string;
  deskripsi?: string;
  harga_per_orang: number;
  min_peserta: number;
  max_peserta: number;
  durasi_hari: number;
  include?: string[];
  exclude?: string[];
  foto?: string;
  is_available: boolean;
  is_featured: boolean;
  urutan: number;
  route?: HikingRoute;
}

export interface Booking {
  id: string;
  user_id?: string;
  package_id: string;
  kode_booking: string;
  nama_ketua: string;
  email: string;
  no_hp: string;
  alamat?: string;
  tanggal_naik: string;
  tanggal_turun: string;
  jumlah_peserta: number;
  total_harga: number;
  catatan?: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  package?: BookingPackage;
  members?: BookingMember[];
  payment?: Payment;
  ticket?: Ticket;
}

export interface BookingMember {
  id: string;
  booking_id: string;
  nama_lengkap: string;
  nik?: string;
  jenis_kelamin?: 'L' | 'P';
  umur?: number;
  no_hp?: string;
  foto_identitas?: string;
  is_ketua: boolean;
}

// --- Payment ---
export type PaymentStatus = 'Unpaid' | 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'Expired';

export interface Payment {
  id: string;
  booking_id: string;
  metode?: string;
  gateway?: string;
  gateway_trx_id?: string;
  jumlah: number;
  biaya_admin: number;
  total: number;
  status: PaymentStatus;
  paid_at?: string;
  expired_at?: string;
  snap_token?: string;
  snap_url?: string;
}

// --- Ticket ---
export type TicketStatus = 'Active' | 'Used' | 'Expired' | 'Cancelled';

export interface Ticket {
  id: string;
  booking_id: string;
  kode_tiket: string;
  qr_code_url?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  status: TicketStatus;
}

// --- Notification ---
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  user_id?: string;
  judul: string;
  pesan: string;
  tipe: NotificationType;
  is_read: boolean;
  link?: string;
  created_at: string;
}

// --- Contact ---
export interface Contact {
  id: string;
  nama: string;
  email: string;
  subjek?: string;
  pesan: string;
  is_read: boolean;
  is_replied: boolean;
  created_at: string;
}

// --- Settings ---
export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  group: string;
}

// --- Activity Log ---
export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  user?: User;
}

// --- API Response ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- Mountain Status Widget ---
export interface MountainStatus {
  gunung_status: 'Buka' | 'Tutup' | 'Siaga';
  jalur_aktif: number;
  jalur_total: number;
  pendaki_hari_ini: number;
  cuaca: WeatherData;
}
