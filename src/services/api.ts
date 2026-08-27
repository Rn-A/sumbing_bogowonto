import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('bc_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    if (!isLoginEndpoint && (error.response?.status === 401 || error.response?.status === 403)) {
      // Token expired or invalid — clear session
      sessionStorage.removeItem('bc_admin_token');
      sessionStorage.removeItem('bc_admin_session');
      window.dispatchEvent(new Event('bc_admin_logout'));
    }
    return Promise.reject(error);
  },
);

export default api;

// ========================================
// API Service Functions
// ========================================

// --- Public Data ---
export const fetchAllPublicData = () => api.get('/public/all-data').then(r => r.data);
export const fetchArticles = (params?: Record<string, string>) => api.get('/articles', { params }).then(r => r.data);
export const fetchArticleBySlug = (slug: string) => api.get(`/articles/${slug}`).then(r => r.data);
export const fetchRoutes = () => api.get('/routes').then(r => r.data);
export const fetchRouteBySlug = (slug: string) => api.get(`/routes/${slug}`).then(r => r.data);
export const fetchProducts = (params?: Record<string, string>) => api.get('/products', { params }).then(r => r.data);
export const fetchGallery = (params?: Record<string, string>) => api.get('/gallery', { params }).then(r => r.data);
export const fetchReviews = () => api.get('/reviews').then(r => r.data);
export const fetchWeather = () => api.get('/weather').then(r => r.data);
export const fetchBookingPackages = () => api.get('/booking-packages').then(r => r.data);

// --- GPX ---
export const fetchGpxData = (routeId: string) => api.get(`/routes/${routeId}/gpx`).then(r => r.data);
export const downloadGpxFile = (gpxId: string) => api.get(`/gpx/${gpxId}/download`, { responseType: 'blob' }).then(r => r.data);

// --- Contact ---
export const submitContact = (data: { nama: string; email: string; subjek?: string; pesan: string }) =>
  api.post('/contact', data).then(r => r.data);

// --- Booking & Payment ---
export const createBooking = (data: Record<string, unknown>) => api.post('/bookings', data).then(r => r.data);
export const getBookingByCode = (kode: string) => api.get(`/bookings/check/${kode}`).then(r => r.data);
export const fetchPaymentStatus = (bookingId: string) => api.get(`/bookings/${bookingId}/payment-status`).then(r => r.data);
export const fetchMidtransClientKey = () => api.get('/midtrans/client-key').then(r => r.data);
export const simulatePayment = (bookingId: string) => api.post(`/bookings/${bookingId}/pay-simulate`).then(r => r.data);

// --- Review ---
export const submitReview = (data: { nama: string; email?: string; rating: number; komentar: string }) =>
  api.post('/reviews', data).then(r => r.data);

// --- Auth ---
export const loginAdmin = (data: { username: string; password: string }) => api.post('/auth/login', data).then(r => r.data);
export const verifyToken = () => api.get('/auth/verify').then(r => r.data);

// --- Admin Upload ---
export const uploadFile = (data: { fileName: string; fileData: string }) => api.post('/upload', data).then(r => r.data);

// --- Admin APIs ---
export const fetchAdminStats = () => api.get('/admin/stats').then(r => r.data);
export const fetchAdminBookings = () => api.get('/admin/bookings').then(r => r.data);
export const updateBookingStatus = (id: string, status: string) => api.put(`/admin/bookings/${id}/status`, { status }).then(r => r.data);
export const fetchAdminReviews = () => api.get('/admin/reviews').then(r => r.data);
export const approveReview = (id: string, is_approved: boolean) => api.put(`/admin/reviews/${id}/approve`, { is_approved }).then(r => r.data);
export const deleteReview = (id: string) => api.delete(`/admin/reviews/${id}`).then(r => r.data);
export const updateRouteStatus = (id: string, status: string) => api.put(`/admin/routes/${id}/status`, { status }).then(r => r.data);
export const updateRouteDetails = (id: string, data: Record<string, unknown>) => api.put(`/admin/routes/${id}`, data).then(r => r.data);

// --- Admin CMS: Articles ---
export const fetchAdminArticles = () => api.get('/admin/articles').then(r => r.data);
export const createArticle = (data: Record<string, unknown>) => api.post('/admin/articles', data).then(r => r.data);
export const updateArticle = (id: string, data: Record<string, unknown>) => api.put(`/admin/articles/${id}`, data).then(r => r.data);
export const deleteArticle = (id: string) => api.delete(`/admin/articles/${id}`).then(r => r.data);

// --- Admin CMS: Galleries ---
export const fetchAdminGalleries = () => api.get('/admin/galleries').then(r => r.data);
export const createGallery = (data: Record<string, unknown>) => api.post('/admin/galleries', data).then(r => r.data);
export const updateGallery = (id: string, data: Record<string, unknown>) => api.put(`/admin/galleries/${id}`, data).then(r => r.data);
export const deleteGallery = (id: string) => api.delete(`/admin/galleries/${id}`).then(r => r.data);

// --- Admin CMS: Packages / SIMAKSI Pricing ---
export const updateBookingPackage = (id: string, data: Record<string, unknown>) => api.put(`/admin/packages/${id}`, data).then(r => r.data);

// --- Admin CMS: Segments (Segmentasi Rute) ---
export const createSegment = (routeId: string, data: Record<string, unknown>) => api.post(`/admin/routes/${routeId}/segments`, data).then(r => r.data);
export const updateSegment = (id: string, data: Record<string, unknown>) => api.put(`/admin/segments/${id}`, data).then(r => r.data);
export const deleteSegment = (id: string) => api.delete(`/admin/segments/${id}`).then(r => r.data);

// --- Admin CMS: Posts (Pos Pendakian & Checkpoints) ---
export const createPost = (routeId: string, data: Record<string, unknown>) => api.post(`/admin/routes/${routeId}/posts`, data).then(r => r.data);
export const updatePost = (id: string, data: Record<string, unknown>) => api.put(`/admin/posts/${id}`, data).then(r => r.data);
export const deletePost = (id: string) => api.delete(`/admin/posts/${id}`).then(r => r.data);

// --- Admin CMS: GPX Track Data ---
export const createGpx = (routeId: string, data: Record<string, unknown>) => api.post(`/admin/routes/${routeId}/gpx`, data).then(r => r.data);
export const updateGpx = (id: string, data: Record<string, unknown>) => api.put(`/admin/gpx/${id}`, data).then(r => r.data);
export const deleteGpx = (id: string) => api.delete(`/admin/gpx/${id}`).then(r => r.data);

// --- Admin CMS: Global / Home Settings ---
export const fetchSettings = () => api.get('/settings').then(r => r.data);
export const updateSettings = (settings: Record<string, unknown>) => api.put('/admin/settings', { settings }).then(r => r.data);



