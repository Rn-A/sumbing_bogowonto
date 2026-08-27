import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllPublicData, submitReview } from '../../services/api';
import HikingTrailMapApp from '../../components/trail/HikingTrailMapApp';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Mountain, MapPin, Tent, Droplets, Shield, TreePine, 
  HelpCircle, Star, Download, ChevronDown, Clock, 
  TrendingUp, Navigation, Calculator, Plus, Minus, 
  AlertTriangle, Send, Loader2, ChevronRight, Ticket, Users, Coffee,
  Flame, Route as RouteIcon, Info, CloudSun, Lock, Sliders, User
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import routeData from '../../../route_data.json';
import { generateSegments, getTotalStats, formatTime, type SegmentData, type RawTrackPoint, type Checkpoint } from './segmentUtils';
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
};

const downsamplePoints = (points: any[], maxPoints: number) => {
  if (points.length <= maxPoints) return points;
  const result = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    result.push(points[Math.round(i * step)]);
  }
  return result;
};


const FACILITIES = [
  { icon: Tent, name: 'Area Camping', desc: 'Lahan camping datar dan aman' },
  { icon: Droplets, name: 'Sumber Air', desc: 'Air bersih tersedia di basecamp' },
  { icon: MapPin, name: 'Parking Area', desc: 'Lahan parkir luas & aman 24 jam' },
  { icon: Shield, name: 'Pos Keamanan', desc: 'Petugas keamanan berjaga' },
  { icon: Mountain, name: 'Mushola', desc: 'Mushola bersih untuk ibadah' },
  { icon: Coffee, name: 'Warung', desc: 'Warung makan & minum lengkap' },
];

const FAQ_ITEMS = [
  { q: 'Berapa biaya pendakian Via Pencar?', a: 'Biaya tiket masuk pendakian berkisar Rp 25.000 â€“ Rp 35.000/orang. Sewa perlengkapan, homestay, atau porter dikenakan biaya tambahan sesuai katalog Bogowonto.' },
  { q: 'Apakah harus booking online terlebih dahulu?', a: 'Sangat disarankan. Booking online membantu pendataan kuota pendaki harian dan mempermudah check-in menggunakan kode QR di Basecamp Bogowonto.' },
  { q: 'Bagaimana kondisi sinyal telekomunikasi di jalur?', a: 'Sinyal 4G (Telkomsel/Indosat) cukup kuat di area Basecamp Bogowonto hingga Pos 1. Di Pos 2-3 sinyal mulai tidak stabil/hilang, dan kadang muncul kembali di area puncak.' },
  { q: 'Berapa lama estimasi waktu pendakian Via Pencar?', a: 'Untuk jalur Via Pencar dari Basecamp Bogowonto, waktu tempuh rata-rata naik adalah 6-8 jam tergantung stamina fisik pendaki, dan waktu turun sekitar 4-5 jam.' },
  { q: 'Apakah pemula boleh mendaki via jalur ini?', a: 'Boleh, namun sangat disarankan menggunakan jasa guide pendamping dan melakukan persiapan fisik (jogging/cardio) minimal 2 minggu sebelum pendakian.' },
];

const HIKING_RULES = [
  { title: 'Wajib SIMAKSI', desc: 'Setiap pendaki wajib memiliki izin resmi SIMAKSI sebelum naik.' },
  { title: 'Bawa Sampah Turun', desc: 'Semua sampah logistik wajib dibawa turun kembali. Petugas akan mencocokkan checklist sampah saat check-out.' },
  { title: 'Dilarang Merusak Alam', desc: 'Dilarang keras memotong pohon, memetik edelweiss, atau mencorat-coret batu/pohon.' },
  { title: 'Peralatan Standar', desc: 'Wajib membawa perlengkapan minimal: jaket gunung, tenda dome, matras, sleeping bag, senter/headlamp, dan logistik yang cukup.' },
  { title: 'Batas Summit Jam 10 Pagi', desc: 'Disarankan untuk turun dari puncak maksimal pukul 10:00 WIB demi menghindari kabut tebal dan gas beracun.' },
];

interface WeatherForecast {
  dayName: string;
  dateStr: string;
  time: string;
  desc: string;
  temp: number;
  windSpeed: number;
  iconType: 'clear' | 'partly-cloudy' | 'cloudy';
}

const getNextDays = (hour: string) => {
  const days = [];
  const optionsDay: Intl.DateTimeFormatOptions = { weekday: 'long' };
  const optionsDate: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString('id-ID', optionsDay);
    const dateStr = d.toLocaleDateString('id-ID', optionsDate);
    days.push({
      dayName,
      dateStr,
      time: hour
    });
  }
  return days;
};

const generateWeather = (posElevasi: number, hour: string): WeatherForecast[] => {
  const days = getNextDays(hour);
  
  // Base temperatures for different hours of the day
  let baseTemp = 25; 
  if (hour === '07:00') baseTemp = 18;
  else if (hour === '10:00') baseTemp = 22;
  else if (hour === '13:00') baseTemp = 24;
  else if (hour === '16:00') baseTemp = 21;
  else if (hour === '19:00') baseTemp = 15;
  
  // Lapse rate: ~0.65C per 100m elevation above base level (1500m)
  const elevDifference = Math.max(0, posElevasi - 1540);
  const tempDrop = (elevDifference / 100) * 0.65;
  
  return days.map((day, idx) => {
    const dayVariation = idx === 0 ? 0 : idx === 1 ? 1.5 : -1.0;
    const finalTemp = Math.round(baseTemp - tempDrop + dayVariation);
    
    let desc = 'Cerah Berawan';
    let iconType: 'clear' | 'partly-cloudy' | 'cloudy' = 'partly-cloudy';
    let windSpeed = Math.round((4.2 + idx * 0.6) * 10) / 10;
    
    if (idx === 2) {
      desc = 'Berawan';
      iconType = 'cloudy';
      windSpeed = Math.round((windSpeed + 0.8) * 10) / 10;
    } else if (hour === '07:00') {
      desc = idx === 0 ? 'Cerah' : 'Cerah Berawan';
      iconType = idx === 0 ? 'clear' : 'partly-cloudy';
    } else if (hour === '19:00') {
      desc = idx === 0 ? 'Berawan' : 'Kabut Tebal';
      iconType = 'cloudy';
      windSpeed = Math.round((windSpeed + 1.2) * 10) / 10;
    }
    
    return {
      ...day,
      desc,
      temp: finalTemp,
      windSpeed,
      iconType
    };
  });
};

const SEGMENT_POINTS = routeData.segments.map(seg => ({
  name: seg.name,
  lat: seg.lat,
  lng: seg.lon,
  elevasi: Math.round(seg.ele)
}));

// Auto-generated segments from checkpoint + GPX track data
const CHECKPOINTS: Checkpoint[] = routeData.segments as Checkpoint[];
const TRACK_POINTS: RawTrackPoint[] = routeData.track as RawTrackPoint[];
const AUTO_SEGMENTS: SegmentData[] = generateSegments(CHECKPOINTS, TRACK_POINTS);
const TOTAL_STATS = getTotalStats(AUTO_SEGMENTS);

const mapStylesList = {
  streets: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
  topo: 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
};

const DEFAULT_ROUTE = {
  id: 'default-route-1',
  nama_jalur: routeData.routeName || 'Jalur Pendakian Gunung Sumbing Via Pencar',
  slug: 'sumbing-via-pencar',
  deskripsi: 'Jalur pendakian Gunung Sumbing via Pencar (Basecamp Bogowonto) menawarkan pemandangan alam yang asri, melintasi perkebunan warga, hutan pinus, hingga area sabana berbatu menjelang puncak.',
  tingkat_kesulitan: 'Sedang',
  total_jarak_km: routeData.totalKm,
  estimasi_jam: 7,
  elevasi_start: routeData.elevMin,
  elevasi_puncak: routeData.elevMax,
  status: 'Buka',
  map_center_lat: routeData.segments[0].lat,
  map_center_lng: routeData.segments[0].lon,
  map_zoom: 13,
  posts: routeData.segments.map((seg, i) => ({
    id: `p-${i}`,
    nama_pos: seg.name,
    elevasi: Math.round(seg.ele),
    urutan: i + 1,
    latitude: seg.lat,
    longitude: seg.lon,
    deskripsi: i === 0 
      ? 'Basecamp utama pendakian.' 
      : i === routeData.segments.length - 1 
        ? 'Puncak tertinggi Sumbing.' 
        : `Pos istirahat ke-${i}.`
  })),
  gpx_files: [
    {
      id: 'gpx-zepp',
      nama_file: 'ZeppWonosobo Lari trail.gpx',
      file_url: '/gpx/ZeppWonosobo Lari trail.gpx',
    }
  ]
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ['publicAllData'],
    queryFn: fetchAllPublicData,
    retry: 1,
  });

  const routes = apiResponse?.data?.routes || [];
  const reviews = apiResponse?.data?.reviews || [];

  // Gunakan data rute pertama dari database atau fallback ke default
  const dbRoute = (routes.length > 0 ? routes[0] : null) || DEFAULT_ROUTE;
  
  // Override activeRoute details dynamically using routeData
  const activeRoute = {
    ...dbRoute,
    nama_jalur: routeData.routeName || dbRoute.nama_jalur,
    total_jarak_km: routeData.totalKm || dbRoute.total_jarak_km,
    elevasi_start: routeData.elevMin || dbRoute.elevasi_start,
    elevasi_puncak: routeData.elevMax || dbRoute.elevasi_puncak,
    posts: routeData.segments.map((seg, i) => ({
      id: `p-${i}`,
      nama_pos: seg.name,
      elevasi: Math.round(seg.ele),
      urutan: i + 1,
      latitude: seg.lat,
      longitude: seg.lon,
      deskripsi: i === 0 
        ? 'Basecamp utama pendakian.' 
        : i === routeData.segments.length - 1 
          ? 'Puncak tertinggi Sumbing.' 
          : `Pos istirahat ke-${i}.`
    })),
    gpx_files: [
      {
        id: 'gpx-zepp',
        nama_file: 'ZeppWonosobo Lari trail.gpx',
        file_url: '/gpx/ZeppWonosobo Lari trail.gpx',
      }
    ]
  };
  
  // Sort and select the latest uploaded GPX file
  const latestGpx = (() => {
    const gpxFiles = activeRoute?.gpx_files || [];
    if (gpxFiles.length === 0) return null;
    const sorted = [...gpxFiles].sort((a: any, b: any) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
    return sorted[0];
  })();

  const elevationGain = activeRoute ? (activeRoute.elevasi_puncak - activeRoute.elevasi_start) : 0;
  const calories = activeRoute ? Math.round(activeRoute.total_jarak_km * 400 + elevationGain * 0.8) : 0;

  const [hikerCount, setHikerCount] = useState<number>(3);
  const [durationDays, setDurationDays] = useState<number>(2);
  const [selectedPosIndex, setSelectedPosIndex] = useState<number>(0);
  const [selectedHour, setSelectedHour] = useState<string>('13:00');
  const [infoTab, setInfoTab] = useState<'info' | 'rules'>('info');
  const [currentPage, setCurrentPage] = useState<number>(1);
  // activeSegmentIndex: null = "Seluruh Rute" overview, 0..N-1 = segmen terpilih
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [showSegmentDetails, setShowSegmentDetails] = useState<boolean>(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain' | 'topo'>('topo');

  const handleCheckpointClick = (lat: number, lng: number, name: string) => {
    if (mapInstance.current) {
      mapInstance.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1200
      });
    }
  };

  // Derived: active segment data
  const activeSegment: SegmentData | null = activeSegmentIndex !== null ? AUTO_SEGMENTS[activeSegmentIndex] : null;

  const posts = activeRoute?.posts || [];
  const sortedPosts = [...posts].sort((a: any, b: any) => a.urutan - b.urutan);
  const selectedPos = sortedPosts[selectedPosIndex] || { elevasi: 1540, nama_pos: 'Basecamp' };

  // Merge API reviews with fallback reviews matching user screenshot
  const fallbackReviews = [
    {
      id: -1,
      name: 'Bjjjk Wkwk',
      username: 'user_693aa8eb13750',
      comment: 'wahhhhh kerennnn webnyaaa, gunungnyaa jugaaa pemandanganya indahh',
      created_at: '2025-12-11T00:00:00.000Z'
    },
    {
      id: -2,
      name: 'Az Zindani',
      username: 'user_693834bfbfdd7',
      comment: 'Perlu menyiapkan perbedaan air yang lumayan karna ada sedikit mata air',
      created_at: '2025-12-09T00:00:00.000Z'
    },
    {
      id: -3,
      name: 'Abdul Rohim',
      username: 'user_69382a75929f2',
      comment: 'Siapkan fisik yang maksimal karan dari sundres camp ke punack itu lumayan berat',
      created_at: '2025-12-09T00:00:00.000Z'
    }
  ];
  
  const displayReviews = [...reviews];
  fallbackReviews.forEach(fr => {
    if (!displayReviews.some(r => r.name === fr.name)) {
      displayReviews.push(fr);
    }
  });

  // Form review state
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');

  // GPX Coordinates state & fetcher initialized synchronously from routeData.track
  const initialGpxCoords = routeData?.track 
    ? routeData.track.map((t: any) => [t[1], t[0]] as [number, number]) 
    : [];
  
  interface GpxTrackpoint {
    lat: number;
    lng: number;
    elevation: number;
    distanceKm: number;
  }

  const initialGpxTrackpoints = routeData?.track 
    ? routeData.track.map((t: any) => ({
        lat: t[0],
        lng: t[1],
        elevation: Math.round(t[2]),
        distanceKm: t[3]
      })) 
    : [];

  const [gpxCoords, setGpxCoords] = useState<[number, number][]>(initialGpxCoords);
  const [gpxTrackpoints, setGpxTrackpoints] = useState<GpxTrackpoint[]>(
    downsamplePoints(initialGpxTrackpoints, 150)
  );
  const [hoveredPoint, setHoveredPoint] = useState<GpxTrackpoint | null>(null);
  const hoverMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Map DOM element reference
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!latestGpx || !latestGpx.file_url) {
      setGpxCoords([]);
      return;
    }

    const fetchGpxData = async () => {
      try {
        const response = await fetch(latestGpx.file_url);
        if (!response.ok) throw new Error('GPX fetch failed');
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const trkpts = xmlDoc.getElementsByTagName('trkpt');
        const points: [number, number][] = [];
        const trackpoints: GpxTrackpoint[] = [];
        let cumulativeDistance = 0;
        let prevLat: number | null = null;
        let prevLon: number | null = null;

        for (let i = 0; i < trkpts.length; i++) {
          const pt = trkpts[i];
          const lat = parseFloat(pt.getAttribute('lat') || '0');
          const lon = parseFloat(pt.getAttribute('lon') || '0');
          
          const eleEl = pt.getElementsByTagName('ele')[0];
          const elevation = eleEl ? parseFloat(eleEl.textContent || '0') : 0;

          if (!isNaN(lat) && !isNaN(lon)) {
            points.push([lon, lat]);

            if (prevLat !== null && prevLon !== null) {
              const dist = getDistance(prevLat, prevLon, lat, lon); // in meters
              cumulativeDistance += dist;
            }

            trackpoints.push({
              lat,
              lng: lon,
              elevation: Math.round(elevation),
              distanceKm: parseFloat((cumulativeDistance / 1000).toFixed(3))
            });

            prevLat = lat;
            prevLon = lon;
          }
        }
        setGpxCoords(points);
        // Downsample for rendering performance in chart
        const downsampled = downsamplePoints(trackpoints, 150);
        setGpxTrackpoints(downsampled);
      } catch (err) {
        console.error('Error fetching/parsing GPX track for map, falling back to static json:', err);
        setGpxCoords(initialGpxCoords);
        setGpxTrackpoints(downsamplePoints(initialGpxTrackpoints, 150));
      }
    };

    fetchGpxData();
  }, [activeRoute, latestGpx]);

  // MapLibre Map initialization, style updates, and drawing unified
  useEffect(() => {
    if (!mapRef.current || !activeRoute) return;

    const centerLat = activeRoute.map_center_lat || -7.3833;
    const centerLng = activeRoute.map_center_lng || 110.0667;
    const zoom = activeRoute.map_zoom || 13;

    // 1. Initialize MapLibre GL Map if not done
    let map: maplibregl.Map;
    if (!mapInstance.current) {
      map = new maplibregl.Map({
        container: mapRef.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: [
                mapStylesList[mapStyle].replace('{s}', 'a')
              ],
              tileSize: 256,
              attribution: mapStyle === 'satellite' ? 'Â© Esri, Maxar' : 'Â© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [centerLng, centerLat],
        zoom: zoom,
        scrollZoom: false,
      });
      mapInstance.current = map;
      
      // Add navigation controls (zoom, etc)
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      
      // Recalculate container dimensions to avoid blank map box
      map.once('load', () => {
        map.resize();
      });
    } else {
      map = mapInstance.current;
      if (!showSegmentDetails) {
        map.setCenter([centerLng, centerLat]);
        map.setZoom(zoom);
      }
    }

    const updateMapSource = () => {
      try {
        const sourceId = 'osm';
        const layerId = 'osm-tiles';

        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        let tileUrl = mapStylesList[mapStyle];
        tileUrl = tileUrl.replace('{s}', 'a');

        map.addSource(sourceId, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          attribution: mapStyle === 'satellite' ? 'Â© Esri, Maxar' : 'Â© OpenStreetMap contributors'
        });

        let routeLayerId: string | undefined = undefined;
        if (map.getLayer('route')) routeLayerId = 'route';
        else if (map.getLayer('route-overview')) routeLayerId = 'route-overview';
        else if (map.getLayer('route-active')) routeLayerId = 'route-active';

        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          minzoom: 0,
          maxzoom: 19
        }, routeLayerId);
      } catch (e) {
        console.warn('Failed to update MapLibre tile style:', e);
      }
    };

    const drawRouteAndMarkers = () => {
      try {
        // Clean up markers and popups on the map
        const activeMarkers = document.querySelectorAll('.custom-maplibre-marker');
        activeMarkers.forEach(m => m.remove());

        // Remove any existing route layers/sources
        if (map.getLayer('route-overview')) map.removeLayer('route-overview');
        if (map.getSource('route-overview')) map.removeSource('route-overview');
        if (map.getLayer('route-active-dash')) map.removeLayer('route-active-dash');
        if (map.getLayer('route-active')) map.removeLayer('route-active');
        if (map.getSource('route-active')) map.removeSource('route-active');
        if (map.getLayer('route-dash')) map.removeLayer('route-dash');
        if (map.getLayer('route')) map.removeLayer('route');
        if (map.getSource('route')) map.removeSource('route');

        const staticTrackCoords: [number, number][] = routeData.track.map((t: any) => [t[1], t[0]] as [number, number]);
        const routeCoordinates = gpxCoords.length > 0 ? gpxCoords : staticTrackCoords;

        if (activeSegmentIndex === null) {
          // ══════════ OVERVIEW MODE ══════════
          // Draw all markers for every checkpoint
          const postsList = activeRoute.posts || [];
          const sortedPostsList = [...postsList].sort((a: any, b: any) => a.urutan - b.urutan);

          sortedPostsList.forEach((post: any, i: number) => {
            const lat = post.latitude || centerLat + (post.urutan * 0.005);
            const lng = post.longitude || centerLng + (post.urutan * 0.003);

            const isStart = i === 0;
            const markerLabel = isStart ? 'S' : String(i);
            const bgColor = isStart ? 'bg-[#16a34a]' : 'bg-[#ea580c]';

            const el = document.createElement('div');
            el.className = 'custom-maplibre-marker';
            el.innerHTML = `
              <div class="w-7 h-7 rounded-full ${bgColor} border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md cursor-pointer">
                ${markerLabel}
              </div>
            `;

            const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div class="p-1 font-sans text-slate-800">
                <p class="font-bold text-xs m-0">${post.nama_pos}</p>
                <p class="text-[10px] text-slate-500 m-0.5">Ketinggian: ${post.elevasi} mdpl</p>
                <p class="text-[10px] text-slate-650 mt-1 leading-normal">${post.deskripsi || ''}</p>
              </div>
            `);

            new maplibregl.Marker({ element: el })
              .setLngLat([lng, lat])
              .setPopup(popup)
              .addTo(map);
          });

          // ══════════ LANDMARK MARKERS ══════════
          // Add markers for all intermediate trail landmarks with GPX-precise coordinates
          const TRAIL_LANDMARKS = [
            { name: 'Wisata Alam Tanggul Asri', elevation: 1682, lat: -7.398950, lng: 110.041643, icon: '📍' },
            { name: 'Selamat Datang', elevation: 1750, lat: -7.397541, lng: 110.043262, icon: '📍' },
            { name: 'Cemoro Pitu', elevation: 1900, lat: -7.396108, lng: 110.046860, icon: '🌲' },
            { name: 'Hutan Rimba', elevation: 2085, lat: -7.394589, lng: 110.051251, icon: '🌳' },
            { name: 'Ratan Tengah', elevation: 2479, lat: -7.390499, lng: 110.059117, icon: '📍' },
            { name: 'Mata Air', elevation: 2598, lat: -7.390539, lng: 110.061554, icon: '💧', type: 'water' },
            { name: 'Watu Anak', elevation: 2669, lat: -7.389453, lng: 110.062191, icon: '🪨' },
            { name: 'Sabana II', elevation: 2685, lat: -7.389366, lng: 110.062391, icon: '🏕️' },
            { name: 'Watu Edeg', elevation: 2888, lat: -7.387355, lng: 110.065557, icon: '🪨' },
            { name: 'Watu Putih', elevation: 2944, lat: -7.387191, lng: 110.066443, icon: '🪨' },
            { name: 'Puncak Bogowonto', elevation: 3271, lat: -7.385200, lng: 110.071200, icon: '⛰️', type: 'summit' },
            { name: 'Watu Lawang', elevation: 3279, lat: -7.385150, lng: 110.071500, icon: '🪨' },
          ];

          TRAIL_LANDMARKS.forEach((lm) => {
            const isWater = lm.type === 'water';
            const isSummitLm = lm.type === 'summit';
            const bgClass = isWater
              ? 'bg-[#0891b2] border-[#67e8f9]'
              : isSummitLm
                ? 'bg-[#d97706] border-[#fcd34d]'
                : 'bg-[#059669] border-[#6ee7b7]';

            const lmEl = document.createElement('div');
            lmEl.className = 'custom-maplibre-marker';
            lmEl.innerHTML = `
              <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
                <div class="w-5 h-5 rounded-full ${bgClass} border-[1.5px] text-white flex items-center justify-center shadow-md" style="font-size:10px;">
                  ${lm.icon}
                </div>
                <div style="margin-top:1px;padding:0 4px;border-radius:5px;background:rgba(15,23,42,0.88);color:#e2e8f0;font-size:8px;font-weight:700;font-family:system-ui;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);text-align:center;line-height:1.3;">
                  <span style="display:block;font-size:7px;color:#94a3b8;">${lm.name}</span>
                  <span style="color:#fde68a;font-weight:800;">${lm.elevation.toLocaleString('id-ID')} m</span>
                </div>
              </div>
            `;

            const lmPopup = new maplibregl.Popup({ offset: 20 }).setHTML(`
              <div class="p-1.5 font-sans text-slate-800">
                <p class="font-bold text-xs m-0">${lm.icon} ${lm.name}</p>
                <p class="text-[10px] text-slate-500 m-0.5">Ketinggian: ${lm.elevation.toLocaleString('id-ID')} mdpl</p>
              </div>
            `);

            new maplibregl.Marker({ element: lmEl })
              .setLngLat([lm.lng, lm.lat])
              .setPopup(lmPopup)
              .addTo(map);
          });

          // Draw full polyline with trail styling (orange base + white dashed line)
          if (routeCoordinates.length > 1) {
            map.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: routeCoordinates },
              },
            });

            map.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#ea580c', 'line-width': 7, 'line-opacity': 0.95 },
            });

            map.addLayer({
              id: 'route-dash',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#ffffff', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.95 },
            });

            if (map.getLayer('route')) map.moveLayer('route');
            if (map.getLayer('route-dash')) map.moveLayer('route-dash');

            const bounds = routeCoordinates.reduce(
              (acc, coord) => acc.extend(coord),
              new maplibregl.LngLatBounds(routeCoordinates[0], routeCoordinates[0])
            );
            map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
          }
        } else {
          // ══════════ SEGMENT MODE ══════════
          const seg = AUTO_SEGMENTS[activeSegmentIndex];
          if (!seg) return;

          const fromPoint = SEGMENT_POINTS[seg.index];
          const toPoint = SEGMENT_POINTS[seg.index + 1];

          // 1. Draw dimmed full route overview (grey, transparent)
          if (routeCoordinates.length > 1) {
            map.addSource('route-overview', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: routeCoordinates },
              },
            });

            map.addLayer({
              id: 'route-overview',
              type: 'line',
              source: 'route-overview',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#94a3b8', 'line-width': 3, 'line-opacity': 0.35 },
            });

            if (map.getLayer('osm-tiles') && map.getLayer('route-overview')) {
              map.moveLayer('osm-tiles', 'route-overview');
            }
          }

          // 2. Extract and draw active segment coordinates from static track matching seg indices
          let activeCoords: [number, number][] = [];
          if (staticTrackCoords.length > 0) {
            const startIdx = Math.min(seg.track_index_start, seg.track_index_end);
            const endIdx = Math.max(seg.track_index_start, seg.track_index_end);
            activeCoords = staticTrackCoords.slice(startIdx, endIdx + 1);
          }

          if (activeCoords.length < 2) {
            activeCoords = [
              [fromPoint.lng, fromPoint.lat],
              [toPoint.lng, toPoint.lat]
            ];
          }

          map.addSource('route-active', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: activeCoords },
            },
          });

          // Outer thick orange line
          map.addLayer({
            id: 'route-active',
            type: 'line',
            source: 'route-active',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#ea580c', 'line-width': 8, 'line-opacity': 0.95 },
          });

          // Inner dashed white line for trail effect (muncak.id style)
          map.addLayer({
            id: 'route-active-dash',
            type: 'line',
            source: 'route-active',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#ffffff', 'line-width': 2.5, 'line-dasharray': [2, 2], 'line-opacity': 0.95 },
          });

          if (map.getLayer('route-overview')) map.moveLayer('route-overview');
          if (map.getLayer('route-active')) map.moveLayer('route-active');
          if (map.getLayer('route-active-dash')) map.moveLayer('route-active-dash');

          // 3. Render ALL checkpoint markers (S, 1..N-1, Peak) with active segment endpoints highlighted
          SEGMENT_POINTS.forEach((point, idx) => {
            const isStart = idx === 0;
            const isPeak = idx === SEGMENT_POINTS.length - 1;
            const isSegmentEndpoint = idx === seg.index || idx === seg.index + 1;

            let bgColor = 'bg-[#ea580c]';
            let labelHtml = `<span>${idx}</span>`;
            let sizeClass = isSegmentEndpoint ? 'w-8 h-8 text-xs ring-4 ring-orange-500/30 font-black' : 'w-7 h-7 text-xs opacity-90 font-bold';

            if (isStart) {
              bgColor = 'bg-[#16a34a]';
              labelHtml = '<span>S</span>';
            } else if (isPeak) {
              bgColor = 'bg-[#0b1a2d]';
              labelHtml = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 21h20L12 3z"/></svg>';
            }

            const el = document.createElement('div');
            el.className = 'custom-maplibre-marker';
            el.innerHTML = `
              <div class="${sizeClass} rounded-full ${bgColor} border-2 border-white text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all duration-300">
                ${labelHtml}
              </div>
            `;

            const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div class="p-1.5 font-sans text-slate-800">
                <p class="font-bold text-xs m-0">${point.name}</p>
                <p class="text-[10px] text-slate-500 m-0.5">Ketinggian: ${point.elevasi} mdpl</p>
              </div>
            `);

            new maplibregl.Marker({ element: el })
              .setLngLat([point.lng, point.lat])
              .setPopup(popup)
              .addTo(map);
          });

          // 4. Fit bounds to active segment coordinates only
          if (activeCoords.length > 1) {
            const bounds = activeCoords.reduce(
              (acc, coord) => acc.extend(coord),
              new maplibregl.LngLatBounds(activeCoords[0], activeCoords[0])
            );
            map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
          }
        }
      } catch (e) {
        console.warn('Failed to draw route map:', e);
      }
    };

    const runUpdateAndDraw = () => {
      updateMapSource();
      drawRouteAndMarkers();
    };

    if (map.loaded()) {
      runUpdateAndDraw();
    } else {
      map.once('load', runUpdateAndDraw);
    }
  }, [activeRoute, activeSegmentIndex, gpxCoords, mapStyle]);

  // Synchronize chart hovered point to a map cursor marker
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (hoveredPoint) {
      if (!hoverMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'gpx-hover-marker';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-5 h-5 rounded-full bg-[#ea580c]/30 animate-ping"></div>
            <div class="w-3.5 h-3.5 rounded-full bg-[#ea580c] border-2 border-white shadow-md"></div>
          </div>
        `;
        hoverMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([hoveredPoint.lng, hoveredPoint.lat])
          .addTo(map);
      } else {
        hoverMarkerRef.current.setLngLat([hoveredPoint.lng, hoveredPoint.lat]);
      }
    } else {
      if (hoverMarkerRef.current) {
        hoverMarkerRef.current.remove();
        hoverMarkerRef.current = null;
      }
    }

    return () => {
      if (hoverMarkerRef.current) {
        hoverMarkerRef.current.remove();
        hoverMarkerRef.current = null;
      }
    };
  }, [hoveredPoint]);

  // Handle Review Submission
  const reviewMutation = useMutation({
    mutationFn: submitReview,
    onSuccess: (res) => {
      setReviewMessage(res.message || 'Review berhasil terkirim!');
      setReviewName('');
      setReviewEmail('');
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
    },
    onError: (err: any) => {
      setReviewMessage(err.response?.data?.error || 'Gagal mengirim review.');
    }
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      setReviewMessage('Nama dan komentar wajib diisi.');
      return;
    }
    reviewMutation.mutate({
      nama: reviewName,
      email: reviewEmail,
      rating: reviewRating,
      komentar: reviewComment
    });
  };

  const calcWaterLiters = hikerCount * durationDays * 3;
  const calcMealsCount = hikerCount * durationDays * 3;
  const calcTrashBags = Math.ceil((hikerCount * durationDays) / 3);

  const chartData = activeRoute?.posts
    ? [...activeRoute.posts]
        .sort((a: any, b: any) => a.urutan - b.urutan)
        .map((p: any) => ({
          name: p.nama_pos.replace('Pos ', 'P'),
          ketinggian: p.elevasi,
        }))
    : [];

  if (isLoading && !apiResponse && !activeRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#FAF8F5] font-sans">
        <Loader2 className="w-10 h-10 text-[#0D5C3A] animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500 dark:text-[#707070] tracking-wider animate-pulse uppercase">
          Memuat Profil Bogowonto...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[var(--header-height)] bg-[#FAF8F5] dark:bg-[#FAF8F5]">
      {/* ===== INTERACTIVE HIKING TRAIL MAP APP ===== */}
      <HikingTrailMapApp />

      {/* ===== MAIN CONTENT - MUNCAK.ID STYLE ===== */}
      <section className="section-padding">
        <div className="container-app max-w-6xl">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] text-slate-500 mb-8 font-semibold uppercase tracking-wider">
            <Link to="/" className="hover:text-[#0D5C3A]">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Jalur Pendakian</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#0D5C3A]">Sumbing Via Pencar</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* LEFT COLUMN: Main Information */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Overview & Quick Info */}
              <div>
                <h2 className="font-display font-black text-3xl text-slate-900 dark:text-[#050505] mb-4">
                  {activeRoute.nama_jalur}
                </h2>
                <div className="prose prose-sm text-slate-600 dark:text-[#292524] mb-8 leading-relaxed">
                  <p>{activeRoute.deskripsi || 'Jalur pendakian Gunung Sumbing via Pencar menawarkan pemandangan alam yang asri, melintasi perkebunan warga, hutan pinus, hingga area sabana berbatu menjelang puncak.'}</p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-4 border border-slate-100 dark:border-[#e7e5e4] text-center shadow-sm">
                    <TrendingUp className="w-5 h-5 text-[#0D5C3A] mx-auto mb-2" />
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ketinggian</p>
                    <p className="text-sm font-black text-slate-800 dark:text-[#050505] mt-1">{activeRoute.elevasi_puncak} mdpl</p>
                  </div>
                  <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-4 border border-slate-100 dark:border-[#e7e5e4] text-center shadow-sm">
                    <Clock className="w-5 h-5 text-[#0D5C3A] mx-auto mb-2" />
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Durasi (Naik)</p>
                    <p className="text-sm font-black text-slate-800 dark:text-[#050505] mt-1">{activeRoute.estimasi_jam} Jam</p>
                  </div>
                  <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-4 border border-slate-100 dark:border-[#e7e5e4] text-center shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-[#0D5C3A] mx-auto mb-2" />
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tingkat Kesulitan</p>
                    <p className="text-sm font-black text-slate-800 dark:text-[#050505] mt-1">{activeRoute.tingkat_kesulitan}</p>
                  </div>
                  <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-4 border border-slate-100 dark:border-[#e7e5e4] text-center shadow-sm">
                    <MapPin className="w-5 h-5 text-[#0D5C3A] mx-auto mb-2" />
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Jumlah Pos</p>
                    <p className="text-sm font-black text-slate-800 dark:text-[#050505] mt-1">{activeRoute.posts?.length || 0} Pos Utama</p>
                  </div>
                </div>
              </div>

              {/* Fasilitas Basecamp Section */}
              <div>
                <h3 className="font-display font-black text-xl text-slate-900 dark:text-[#050505] mb-4 flex items-center gap-2">
                  <Tent className="w-5 h-5 text-[#0D5C3A]" />
                  Fasilitas Basecamp Bogowonto
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {FACILITIES.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white dark:bg-[#F4F0E8] rounded-xl border border-slate-100 dark:border-[#e7e5e4]">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#0D5C3A]/10 flex items-center justify-center flex-shrink-0">
                        <f.icon className="w-4 h-4 text-[#0D5C3A]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-[#050505]">{f.name}</h4>
                        <p className="text-[10px] text-slate-500 leading-normal">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather Forecast Widget */}
              <div className="space-y-6 pt-10 border-t border-slate-200 dark:border-[#e7e5e4]">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-[#ea580c] uppercase">Kondisi Cuaca</p>
                  <h3 className="font-display font-black text-3xl text-slate-900 dark:text-[#050505] mt-1">
                    Prakiraan di titik resmi
                  </h3>
                </div>

                <div className="bg-white dark:bg-[#F4F0E8] rounded-2xl p-4 border border-slate-200 dark:border-[#e7e5e4] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Left side: Pos selection */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-[#0D5C3A]/10 flex items-center justify-center text-[#0D5C3A]">
                      <CloudSun className="w-5 h-5" />
                    </div>
                    <div>
                      <select 
                        value={selectedPosIndex} 
                        onChange={(e) => setSelectedPosIndex(Number(e.target.value))}
                        className="bg-transparent font-display font-bold text-sm text-slate-800 dark:text-[#050505] focus:outline-none cursor-pointer border-b border-transparent hover:border-[#0D5C3A] pr-2"
                      >
                        {sortedPosts.map((post: any, idx: number) => (
                          <option key={post.id} value={idx}>
                            {post.nama_pos}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-0.5">{selectedPos.elevasi.toLocaleString('id-ID')} m</p>
                    </div>
                  </div>
                  
                  {/* Right side: Hour selection */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jam:</span>
                    <select 
                      value={selectedHour} 
                      onChange={(e) => setSelectedHour(e.target.value)}
                      className="bg-white dark:bg-[#FAF8F5] px-3 py-1.5 border border-slate-200 dark:border-[#e7e5e4] rounded-xl text-xs font-bold text-slate-700 dark:text-[#050505] focus:outline-none focus:ring-1 focus:ring-[#0D5C3A]/30 cursor-pointer shadow-sm"
                    >
                      <option value="07:00">07:00</option>
                      <option value="10:00">10:00</option>
                      <option value="13:00">13:00</option>
                      <option value="16:00">16:00</option>
                      <option value="19:00">19:00</option>
                    </select>
                  </div>
                </div>

                {/* 3-Day Forecast Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                  {generateWeather(selectedPos.elevasi, selectedHour).map((fc, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#F4F0E8] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#e7e5e4] shadow-sm flex flex-col">
                      {/* Card Header */}
                      <div className="bg-[#1e293b] dark:bg-[#2b3543] px-4 py-2.5 text-white flex justify-between items-center">
                        <span className="text-xs font-bold">{fc.dayName}</span>
                        <span className="text-[10px] text-slate-350">{fc.dateStr.replace(' Agustus', '')} &bull; {fc.time}</span>
                      </div>
                      
                      {/* Card Body */}
                      <div className="p-4 flex items-center justify-between flex-1">
                        {/* Weather Icon */}
                        <div className="w-16 h-16 flex items-center justify-center">
                          {fc.iconType === 'clear' && (
                            <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                            </svg>
                          )}
                          {fc.iconType === 'partly-cloudy' && (
                            <div className="relative w-12 h-12">
                              <svg className="absolute top-0 right-0 w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                              </svg>
                              <svg className="absolute bottom-0 left-0 w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                              </svg>
                            </div>
                          )}
                          {fc.iconType === 'cloudy' && (
                            <svg className="w-12 h-12 text-slate-450" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                            </svg>
                          )}
                        </div>
                        
                        {/* Weather Info */}
                        <div className="text-right">
                          <p className="text-[10px] text-slate-450 font-bold tracking-wide">{fc.desc}</p>
                          <p className="text-3xl font-black text-slate-800 dark:text-[#050505] mt-1">{fc.temp}Â°C</p>
                          <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1.5 font-bold">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <span>{fc.windSpeed} km/j</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Disclaimer & Prediksi 7 hari */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-2">
                  <div className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-slate-350" />
                    <span>Kondisi cuaca di atas merupakan data dari Open Meteo</span>
                  </div>
                  <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0D5C3A] flex items-center gap-0.5 transition-colors">
                    Lihat prediksi 7 hari —
                  </a>
                </div>
              </div>

              {/* Detailed Info Section (Detil yang perlu kamu tahu) */}
              <div className="space-y-6 pt-10 border-t border-slate-200 dark:border-[#e7e5e4]">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-[#ea580c] uppercase">Informasi</p>
                  <h3 className="font-display font-black text-3xl text-slate-900 dark:text-[#050505] mt-1">
                    Detil yang perlu kamu tahu
                  </h3>
                </div>

                {/* Info Tabs */}
                <div className="flex border-b border-slate-200 dark:border-[#e7e5e4] gap-6 text-sm font-bold">
                  <button 
                    onClick={() => setInfoTab('info')}
                    className={`pb-3 transition-colors border-b-2 relative ${infoTab === 'info' ? 'border-[#ea580c] text-[#ea580c]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    Informasi
                  </button>
                  <button 
                    onClick={() => setInfoTab('rules')}
                    className={`pb-3 transition-colors border-b-2 relative ${infoTab === 'rules' ? 'border-[#ea580c] text-[#ea580c]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    Aturan dan Larangan
                  </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-4 text-sm leading-relaxed text-slate-650 dark:text-slate-600">
                  {infoTab === 'info' ? (
                    <ul className="list-disc pl-5 space-y-3.5">
                      <li>
                        <strong>Status jalur pendakian : DIBUKA</strong>
                      </li>
                      <li>
                        <strong>Per-hari ini tidak ada informasi baru tentang aktifitas pendakian dan vulkanik melalui jalur ini (08-05-26)</strong>
                      </li>
                      <li>
                        Mata air hanya tersedia di Pos 1 (Â±1.800 mdpl), sehingga pendaki disarankan membawa 3â€“4 liter air per orang.
                      </li>
                      <li>
                        Jalur bervariasi, mulai dari hutan tropis yang teduh di awal hingga medan berpasir dan berbatu menjelang puncak.
                      </li>
                      <li>
                        Persiapkan fisik, perlengkapan, dan jadwal mendaki pagi untuk menghindari kabut tebal di siang hari.
                      </li>
                      <li>
                        Ada warung makan di Pos 1 ojek dan Pos 2 yang rutin buka meskipun bukan akhir pekan.
                      </li>
                      <li>
                        Warung makan di Pos 3 umumnya buka hanya di akhir pekan.
                      </li>
                      <li>
                        Pada jalur pendakian Gunung Sumbing via Pencar, sumber air umumnya tersedia di area basecamp dan beberapa titik tertentu di jalur bawah, sehingga pendaki disarankan mengisi penuh persediaan air sebelum melanjutkan pendakian ke puncak.
                      </li>
                    </ul>
                  ) : (
                    <ul className="list-disc pl-5 space-y-3.5">
                      <li>
                        <strong>Per-hari ini tidak ada larangan baru yang berhubungan dengan aktifitas pendakian dan vulkanik melalui jalur ini (08-05-26)</strong>
                      </li>
                      <li>
                        Dilarang membawa tisu basah.
                      </li>
                      <li>
                        Wajib membawa makanan besar untuk yang melakukan pendakian <em>direct</em> tanpa menginap.
                      </li>
                      <li>
                        Tidak membuang sisa makanan secara terbuka di Sunrise Camp untuk menghindari datangnya babi hutan.
                      </li>
                    </ul>
                  )}
                </div>

                {/* Disclaimer / Date updated */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold pt-2">
                  <Info className="w-3.5 h-3.5 text-slate-350" />
                  <span>Terakhir diperbarui pada Jumat, 3 Juli 2026</span>
                </div>
              </div>

              {/* Reviews Section (Ulasan Pendaki / Cerita dari pendaki lain) */}
              <div className="space-y-6 pt-10 border-t border-slate-200 dark:border-[#e7e5e4]">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-[#ea580c] uppercase">Ulasan Pendaki</p>
                  <h3 className="font-display font-black text-3xl text-slate-900 dark:text-[#050505] mt-1">
                    Cerita dari pendaki lain
                  </h3>
                </div>

                {/* Gallery Images */}
                <div className="grid grid-cols-3 gap-4">
                  <img 
                    src="https://images.unsplash.com/photo-1551632879-6df7a118d0af?q=80&w=600&auto=format&fit=crop" 
                    className="w-full h-28 object-cover rounded-2xl shadow-sm" 
                    alt="Hutan Sumbing" 
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop" 
                    className="w-full h-28 object-cover rounded-2xl shadow-sm" 
                    alt="Trek Pisang Sumbing" 
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1527004013197-933c4bb611b3?q=80&w=600&auto=format&fit=crop" 
                    className="w-full h-28 object-cover rounded-2xl shadow-sm" 
                    alt="Puncak Sumbing" 
                  />
                </div>

                {/* Rating Summary Card */}
                <div className="bg-white dark:bg-[#F4F0E8] rounded-2xl border border-slate-200 dark:border-[#e7e5e4] shadow-sm overflow-hidden">
                  <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-[#e7e5e4]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-800 dark:text-[#050505]">100%</span>
                      <span className="text-xs font-bold text-slate-500">merekomendasikan &bull; {displayReviews.length} pendaki</span>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button className="bg-[#0D5C3A] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#09442a] transition-colors shadow-sm">
                        <Send className="w-3.5 h-3.5" /> Masuk untuk menulis ulasan
                      </button>
                      
                      <select className="bg-white dark:bg-[#FAF8F5] px-3 py-2 border border-slate-200 dark:border-[#e7e5e4] rounded-xl text-xs font-bold text-slate-700 dark:text-[#050505] focus:outline-none cursor-pointer shadow-sm">
                        <option>Terbaru</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Categorized Empty States */}
                  <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-[#e7e5e4]">
                    <div className="p-4 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Prakiraan Cuaca</p>
                      <div className="w-4 h-0.5 bg-slate-200 mx-auto my-2"></div>
                      <p className="text-xs font-bold text-slate-400">Belum ada data</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Info Jalur</p>
                      <div className="w-4 h-0.5 bg-slate-200 mx-auto my-2"></div>
                      <p className="text-xs font-bold text-slate-400">Belum ada data</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sumber Air</p>
                      <div className="w-4 h-0.5 bg-slate-200 mx-auto my-2"></div>
                      <p className="text-xs font-bold text-slate-400">Belum ada data</p>
                    </div>
                  </div>
                </div>

                {/* Review Items List */}
                <div className="space-y-6">
                  {displayReviews.slice((currentPage - 1) * 3, (currentPage - 1) * 3 + 3).map((rev: any) => {
                    const initials = rev.name ? rev.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
                    const colors = ['bg-orange-500', 'bg-purple-500', 'bg-rose-500', 'bg-blue-500', 'bg-emerald-500'];
                    const colorClass = colors[Math.abs(rev.id) % colors.length] || 'bg-slate-500';
                    
                    return (
                      <div key={rev.id} className="flex gap-4 items-start pt-6 border-t border-slate-150 dark:border-[#e7e5e4]/65">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs ${colorClass} shrink-0 shadow-sm`}>
                          {initials}
                        </div>
                        
                        {/* Review Details */}
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-baseline">
                            <div>
                              <h5 className="font-display font-bold text-sm text-slate-800 dark:text-[#050505]">
                                {rev.name}
                              </h5>
                              <p className="text-[10px] text-slate-400">@{rev.username || `user_${Math.abs(rev.id).toString(16)}`}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {new Date(rev.created_at || Date.now()).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <div className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-[#0D5C3A]/10 text-[#0D5C3A] px-2 py-0.5 rounded text-[10px] font-bold">
                            Merekomendasikan
                          </div>
                          
                          <p className="text-xs text-slate-650 dark:text-[#707070] pt-1.5 leading-relaxed">
                            {rev.comment}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reviews Pagination / Slide Control */}
                {displayReviews.length > 3 && (
                  <div className="flex justify-center pt-8">
                    <div className="inline-flex rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-[#e7e5e4] h-10">
                      {/* Prev Button */}
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 bg-slate-100 dark:bg-[#EBE7DF] text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-[#dfdad1] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center font-display text-sm font-black"
                        title="Halaman Sebelumnya"
                      >
                        &laquo;
                      </button>
                      
                      {/* Active Page Number */}
                      <div className="px-6 bg-[#0D5C3A] text-white flex items-center justify-center font-display font-black text-sm select-none">
                        {currentPage}
                      </div>
                      
                      {/* Next Button */}
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(displayReviews.length / 3), prev + 1))}
                        disabled={currentPage === Math.ceil(displayReviews.length / 3)}
                        className="px-4 bg-slate-100 dark:bg-[#EBE7DF] text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-[#dfdad1] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center font-display text-sm font-black"
                        title="Halaman Selanjutnya"
                      >
                        &raquo;
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Sidebar (Widgets) */}
            <div className="space-y-6">
              
              {/* Statistik Card */}
              <div className="bg-white dark:bg-[#F4F0E8] rounded-2xl p-6 border border-[#e7e5e4] shadow-sm">
                <h4 className="font-display text-xs font-bold tracking-widest text-[#0D5C3A] dark:text-[#0D5C3A] uppercase mb-6">
                  Statistik
                </h4>
                
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  {/* Elevation Gain */}
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500 text-[10px] font-bold tracking-wider uppercase">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0D5C3A]" />
                      <span>Penambahan Elevasi</span>
                    </div>
                    <div className="mt-2 flex items-baseline">
                      <span className="text-3xl font-black text-slate-800 dark:text-[#050505]">
                        {elevationGain}
                      </span>
                      <span className="text-xs font-bold text-slate-400 ml-1">m</span>
                    </div>
                  </div>

                  {/* Total Distance */}
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500 text-[10px] font-bold tracking-wider uppercase">
                      <RouteIcon className="w-3.5 h-3.5 text-[#0D5C3A]" />
                      <span>Jarak Total</span>
                      <span title="Total jarak pendakian" className="inline-flex items-center">
                        <Info className="w-3 h-3 text-slate-450 cursor-pointer inline-block ml-0.5" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline">
                      <span className="text-3xl font-black text-slate-800 dark:text-[#050505]">
                        {activeRoute.total_jarak_km}
                      </span>
                      <span className="text-xs font-bold text-slate-450 ml-1">km</span>
                    </div>
                  </div>

                  {/* Hiking Duration */}
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500 text-[10px] font-bold tracking-wider uppercase">
                      <Clock className="w-3.5 h-3.5 text-[#0D5C3A]" />
                      <span>Waktu Tempuh</span>
                      <span title="Estimasi waktu pendakian" className="inline-flex items-center">
                        <Info className="w-3 h-3 text-slate-450 cursor-pointer inline-block ml-0.5" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline">
                      <span className="text-3xl font-black text-slate-800 dark:text-[#050505]">
                        {activeRoute.estimasi_jam}
                      </span>
                      <span className="text-xs font-bold text-slate-450 ml-1">jam</span>
                    </div>
                  </div>

                  {/* Calories Burned */}
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500 text-[10px] font-bold tracking-wider uppercase">
                      <Flame className="w-3.5 h-3.5 text-[#0D5C3A]" />
                      <span>Kalori</span>
                      <span title="Perkiraan kalori yang dibakar" className="inline-flex items-center">
                        <Info className="w-3 h-3 text-slate-450 cursor-pointer inline-block ml-0.5" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline">
                      <span className="text-3xl font-black text-slate-800 dark:text-[#050505]">
                        {calories}
                      </span>
                      <span className="text-xs font-bold text-slate-450 ml-1">kkal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Elevation Profile Widget */}
              {chartData.length > 0 && (
                <div className="bg-white dark:bg-[#F4F0E8] rounded-2xl p-5 border border-[#e7e5e4] shadow-sm">
                  <h4 className="font-display font-bold text-xs uppercase text-slate-500 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#0D5C3A]" /> Profil Elevasi
                  </h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorEle" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0D5C3A" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#0D5C3A" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#a8a29e" fontSize={9} tickLine={false} />
                        <YAxis stroke="#a8a29e" fontSize={9} domain={[1200, 3500]} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: 'none', background: '#050505', color: '#fff' }} />
                        <Area type="monotone" dataKey="ketinggian" stroke="#0D5C3A" strokeWidth={2} fillOpacity={1} fill="url(#colorEle)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ===== LOGISTICS CALCULATOR & REVIEWS ROW ===== */}
      <section className="section-padding bg-[#F4F0E8]/50 dark:bg-[#F4F0E8]/30 border-t border-[#e7e5e4]">
        <div className="container-app max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10">
            
            {/* Kalkulator Logistik Mini */}
            <div className="bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-sm">
              <h3 className="font-display font-black text-xl text-slate-900 dark:text-[#050505] mb-2 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#0D5C3A]" /> Kalkulator Logistik
              </h3>
              <p className="text-xs text-slate-500 mb-6">Hitung perkiraan logistik untuk regu Anda.</p>
              
              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#EBE7DF] p-3 rounded-xl border border-slate-100 dark:border-[#e7e5e4] mb-3">
                <span className="text-xs font-bold text-slate-700">Jumlah Pendaki</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setHikerCount(prev => Math.max(1, prev - 1))} className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-black w-4 text-center">{hikerCount}</span>
                  <button onClick={() => setHikerCount(prev => prev + 1)} className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#EBE7DF] p-3 rounded-xl border border-slate-100 dark:border-[#e7e5e4] mb-5">
                <span className="text-xs font-bold text-slate-700">Durasi (Hari)</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setDurationDays(prev => Math.max(1, prev - 1))} className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-black w-4 text-center">{durationDays}</span>
                  <button onClick={() => setDurationDays(prev => prev + 1)} className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600"><Plus className="w-3 h-3" /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#e8f5e9] dark:bg-[#0D5C3A]/10 rounded-xl border border-[#0D5C3A]/20">
                  <p className="text-[10px] text-[#0D5C3A]">Kebutuhan Air</p>
                  <p className="text-base font-black text-[#0D5C3A]">{calcWaterLiters} Liter</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200/50">
                  <p className="text-[10px] text-amber-700 dark:text-amber-600">Porsi Makan</p>
                  <p className="text-base font-black text-amber-700 dark:text-amber-600">{calcMealsCount} Porsi</p>
                </div>
              </div>
            </div>

            {/* Aturan & FAQ */}
            <div className="space-y-4">
              <h3 className="font-display font-black text-xl text-slate-900 dark:text-[#050505] flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#0D5C3A]" /> Tanya Jawab & Aturan
              </h3>
              {FAQ_ITEMS.slice(0, 3).map((faq, i) => (
                <details key={i} className="group bg-white dark:bg-[#F4F0E8] rounded-xl border border-slate-100 dark:border-[#e7e5e4] overflow-hidden">
                  <summary className="flex items-center justify-between p-3.5 cursor-pointer list-none text-xs font-bold text-slate-800 dark:text-[#050505] hover:text-[#0D5C3A] transition-colors">
                    {faq.q}
                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-3.5 pb-3.5 text-[11px] text-slate-500 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
