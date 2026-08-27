import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot 
} from 'recharts';
import { 
  Mountain, MapPin, Tent, Droplets, Home, Flag, Download, 
  Clock, TrendingUp, Navigation, Sparkles, Layers, Info, CheckCircle2, ChevronRight
} from 'lucide-react';

// ============================================================================
// DATA SPECIFICATIONS FOR GUNUNG SUMBING VIA BASECAMP BOGOWONTO
// ============================================================================

export interface CheckpointData {
  id: string;
  code: string;
  name: string;
  subtitle?: string;
  elevation: number;
  distance: number;
  icon: string;
  type: 'basecamp' | 'pos' | 'camp' | 'summit';
  lat: number;
  lng: number;
  description: string;
  tip: string;
  estimatesFromPrev?: string;
}

export interface LandmarkData {
  id: string;
  name: string;
  elevation: number;
  distance: number;
  lat: number;
  lng: number;
  type?: 'water' | 'landmark';
  icon?: string;
}

export interface EstimateSegment {
  from: string;
  to: string;
  duration: string;
  icon: string;
}

export const CHECKPOINTS: CheckpointData[] = [
  {
    id: 'basecamp',
    code: 'S',
    name: 'Basecamp Bogowonto',
    elevation: 1450,
    distance: 0.0,
    icon: '🏠',
    type: 'basecamp',
    lat: -7.399557,
    lng: 110.033669,
    description: 'Titik awal pendaftaran SIMAKSI, tempat parkir 24 jam, mushola, toilet bersih, dan kantin logistik pendaki.',
    tip: 'Lakukan pemeriksaan perlengkapan wajib dan pastikan sudah registrasi kartu simaksi sebelum memulai pendakian.',
  },
  {
    id: 'pos1',
    code: '1',
    name: 'Pos 1 - Sikembang',
    elevation: 1816,
    distance: 2.07,
    icon: '🪧',
    type: 'pos',
    lat: -7.396464,
    lng: 110.045033,
    description: 'Gerbang hutan pinus Sikembang dengan jalur setapak tanah liat yang landai dan sejuk.',
    tip: 'Atur ritme jalan santai untuk penyesuaian napas awal. Area di sini cukup rimbun dan teduh.',
    estimatesFromPrev: '1 Jam',
  },
  {
    id: 'pos2',
    code: '2',
    name: 'Pos 2 - Kayu Bogel',
    subtitle: 'Galaran',
    elevation: 1974,
    distance: 3.0,
    icon: '🪧',
    type: 'pos',
    lat: -7.395681,
    lng: 110.048890,
    description: 'Pos istirahat di bawah naungan pohon kayu bogel. Jalur tanah mulai bertahap menanjak.',
    tip: 'Lokasi pas untuk minum dan istirahat 5-10 menit sebelum masuk kawasan hutan rimba.',
    estimatesFromPrev: '2 Jam',
  },
  {
    id: 'pos3',
    code: '3',
    name: 'Pos 3 - Watu Talang',
    elevation: 2334,
    distance: 4.17,
    icon: '🪧',
    type: 'pos',
    lat: -7.391807,
    lng: 110.056318,
    description: 'Batu alam besar berbentuk talang. Vegetasi mulai beralih dari pohon tinggi ke semak gunung.',
    tip: 'Jalur setelah Pos 3 mulai terasa terjal. Gunakan trekking pole jika membawa.',
    estimatesFromPrev: '2 Jam',
  },
  {
    id: 'pos4',
    code: '4',
    name: 'Pos 4 - Sabana I',
    subtitle: 'Sodong Celeng',
    elevation: 2539,
    distance: 4.68,
    icon: '🪧',
    type: 'pos',
    lat: -7.390779,
    lng: 110.060291,
    description: 'Awal hamparan sabana hijau luas. Terbuka dengan pemandangan lembah dan panorama perbukitan di bawah.',
    tip: 'Gunakan topi dan pemelihara kulit dari paparan sinar matahari langsung di area terbuka.',
    estimatesFromPrev: '45 Menit',
  },
  {
    id: 'pos5',
    code: '5',
    name: 'Pos 5 - Camp Area',
    elevation: 2766,
    distance: 5.21,
    icon: '⛺',
    type: 'camp',
    lat: -7.388451,
    lng: 110.063338,
    description: 'Area camping terfavorit dan aman terlindung tebing batu dari terpaan angin kencang.',
    tip: 'Tempat ideal untuk mendirikan tenda, masak malam, dan beristirahat sebelum jam summit attack.',
  },
  {
    id: 'pos6',
    code: '6',
    name: 'Pos 6 - Kayu Kuno',
    elevation: 3057,
    distance: 5.86,
    icon: '🪧',
    type: 'pos',
    lat: -7.386547,
    lng: 110.068024,
    description: 'Post terakhir di vegetasi batu cadas tinggi sebelum tanjakan akhir puncak.',
    tip: 'Persiapkan headlamp dan jaket windproof jika summit di pagi subuh.',
  },
  {
    id: 'summit',
    code: '🏔',
    name: 'Puncak Rajawali',
    subtitle: 'Puncak Tertinggi 3.371 mdpl',
    elevation: 3371,
    distance: 6.35,
    icon: '🏔',
    type: 'summit',
    lat: -7.385126,
    lng: 110.071737,
    description: 'Atap puncak tertinggi Gunung Sumbing dengan pemandangan 360 derajat kawah vulkanik dan samudera awan.',
    tip: 'Waktu terbaik tiba di puncak 05:30 - 08:00 WIB untuk menyaksikan sunrise dan lautan awan.',
    estimatesFromPrev: '30 Menit (dari Puncak Bogowonto)',
  },
];

export const LANDMARKS: LandmarkData[] = [
  { id: 'lm-1', name: 'Wisata Alam Tanggul Asri', elevation: 1682, distance: 1.31, lat: -7.398950, lng: 110.041643 },
  { id: 'lm-2', name: 'Selamat Datang', elevation: 1750, distance: 1.71, lat: -7.397541, lng: 110.043262 },
  { id: 'lm-3', name: 'Cemoro Pitu', elevation: 1900, distance: 2.62, lat: -7.396108, lng: 110.046860 },
  { id: 'lm-4', name: 'Hutan Rimba', elevation: 2085, distance: 3.37, lat: -7.394589, lng: 110.051251 },
  { id: 'lm-5', name: 'Ratan Tengah', elevation: 2479, distance: 4.53, lat: -7.390499, lng: 110.059117 },
  { id: 'lm-6', name: 'Mata Air', elevation: 2598, distance: 4.83, lat: -7.390539, lng: 110.061554, type: 'water', icon: '💧' },
  { id: 'lm-7', name: 'Watu Anak', elevation: 2669, distance: 5.00, lat: -7.389453, lng: 110.062191 },
  { id: 'lm-8', name: 'Sabana II', elevation: 2685, distance: 5.03, lat: -7.389366, lng: 110.062391 },
  { id: 'lm-9', name: 'Watu Edeg', elevation: 2888, distance: 5.55, lat: -7.387355, lng: 110.065557 },
  { id: 'lm-10', name: 'Watu Putih', elevation: 2944, distance: 5.66, lat: -7.387191, lng: 110.066443 },
  { id: 'lm-11', name: 'Puncak Bogowonto', elevation: 3271, distance: 6.25, lat: -7.385200, lng: 110.071200 },
  { id: 'lm-12', name: 'Watu Lawang', elevation: 3279, distance: 6.30, lat: -7.385150, lng: 110.071500 },
];

export const ESTIMATES_TABLE: EstimateSegment[] = [
  { from: 'Basecamp', to: 'Pos I (Sikembang)', duration: '1 Jam', icon: '🪧' },
  { from: 'Pos I', to: 'Pos II (Kayu Bogel)', duration: '2 Jam', icon: '🪧' },
  { from: 'Pos II', to: 'Pos III (Watu Talang)', duration: '2 Jam', icon: '🪧' },
  { from: 'Pos III', to: 'Pos IV (Sabana I)', duration: '45 Menit', icon: '🪧' },
  { from: 'Pos IV', to: 'Puncak Bogowonto', duration: '1 Jam', icon: '🏔' },
  { from: 'Puncak Bogowonto', to: 'Puncak Rajawali', duration: '30 Menit', icon: '🏔' },
];

// Elevation chart curve points
const CHART_DATA = [
  { km: 0.0, elevation: 1450, name: 'Basecamp Bogowonto', isCheckpoint: true, icon: '🏠' },
  { km: 1.31, elevation: 1682, name: 'Wisata Tanggul Asri', isCheckpoint: false },
  { km: 1.71, elevation: 1750, name: 'Selamat Datang', isCheckpoint: false },
  { km: 2.07, elevation: 1816, name: 'Pos 1 Sikembang', isCheckpoint: true, icon: '🪧' },
  { km: 2.62, elevation: 1900, name: 'Cemoro Pitu', isCheckpoint: false },
  { km: 3.0, elevation: 1974, name: 'Pos 2 Kayu Bogel', isCheckpoint: true, icon: '🪧' },
  { km: 3.37, elevation: 2085, name: 'Hutan Rimba', isCheckpoint: false },
  { km: 4.17, elevation: 2334, name: 'Pos 3 Watu Talang', isCheckpoint: true, icon: '🪧' },
  { km: 4.53, elevation: 2479, name: 'Ratan Tengah', isCheckpoint: false },
  { km: 4.68, elevation: 2539, name: 'Pos 4 Sabana I', isCheckpoint: true, icon: '🪧' },
  { km: 4.83, elevation: 2598, name: 'Mata Air 💧', isCheckpoint: false, type: 'water' },
  { km: 5.0, elevation: 2669, name: 'Watu Anak', isCheckpoint: false },
  { km: 5.03, elevation: 2685, name: 'Sabana II', isCheckpoint: false },
  { km: 5.21, elevation: 2766, name: 'Pos 5 Camp Area ⛺', isCheckpoint: true, icon: '⛺' },
  { km: 5.55, elevation: 2888, name: 'Watu Edeg', isCheckpoint: false },
  { km: 5.66, elevation: 2944, name: 'Watu Putih', isCheckpoint: false },
  { km: 5.86, elevation: 3057, name: 'Pos 6 Kayu Kuno', isCheckpoint: true, icon: '🪧' },
  { km: 6.25, elevation: 3271, name: 'Puncak Bogowonto', isCheckpoint: false },
  { km: 6.30, elevation: 3279, name: 'Watu Lawang', isCheckpoint: false },
  { km: 6.35, elevation: 3371, name: 'Puncak Rajawali 🏔', isCheckpoint: true, icon: '🏔' },
];

export default function HikingTrailMapApp() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<CheckpointData>(CHECKPOINTS[0]);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'street' | 'topo'>('satellite');
  const [activeTab, setActiveTab] = useState<'map' | 'profile' | 'timeline' | 'info'>('map');

  // Tile layer URLs
  const tileUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    street: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    topo: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
  };

  const tileAttribution = {
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    street: '&copy; OpenStreetMap contributors',
    topo: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center coordinates at Gunung Sumbing Bogowonto route midpoint
    const map = L.map(mapContainerRef.current, {
      center: [-7.391, 110.052],
      zoom: 14,
      zoomControl: false,
    });

    // Add Tile Layer
    const baseTileLayer = L.tileLayer(tileUrls[mapLayer], {
      attribution: tileAttribution[mapLayer],
      maxZoom: 18,
    }).addTo(map);

    // Custom Zoom Controls at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Build Polyline Trail through ALL points (checkpoints + landmarks) as initial fallback
    const allRoutePoints = [
      ...CHECKPOINTS.map(c => ({ lat: c.lat, lng: c.lng, distance: c.distance })),
      ...LANDMARKS.map(l => ({ lat: l.lat, lng: l.lng, distance: l.distance })),
    ].sort((a, b) => a.distance - b.distance);

    const fallbackPoints: L.LatLngExpression[] = allRoutePoints.map(p => [p.lat, p.lng] as [number, number]);

    // Orange glow polyline trail
    const shadowLine = L.polyline(fallbackPoints, {
      color: '#C2410C',
      weight: 10,
      opacity: 0.4,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    const mainLine = L.polyline(fallbackPoints, {
      color: '#F97316',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Fit map bounds to show complete trail
    map.fitBounds(mainLine.getBounds(), { padding: [40, 40] });

    // Fetch and parse exact GPX track from /gpx/ZeppWonosobo Lari trail.gpx
    fetch(encodeURI('/gpx/ZeppWonosobo Lari trail.gpx'))
      .then(res => res.text())
      .then(xmlText => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const trkpts = xmlDoc.getElementsByTagName('trkpt');
        const gpxCoords: [number, number][] = [];
        for (let i = 0; i < trkpts.length; i++) {
          const pt = trkpts[i];
          const lat = parseFloat(pt.getAttribute('lat') || '');
          const lon = parseFloat(pt.getAttribute('lon') || '');
          if (!isNaN(lat) && !isNaN(lon)) {
            gpxCoords.push([lat, lon]);
          }
        }
        if (gpxCoords.length > 0) {
          shadowLine.setLatLngs(gpxCoords as L.LatLngExpression[]);
          mainLine.setLatLngs(gpxCoords as L.LatLngExpression[]);
          map.fitBounds(mainLine.getBounds(), { padding: [40, 40] });
        }
      })
      .catch(err => {
        console.warn('Could not load GPX file for map, falling back to waypoint line:', err);
      });

    // Add Checkpoint Markers with elevation labels
    CHECKPOINTS.forEach((cp) => {
      const isSummit = cp.type === 'summit';
      const isBasecamp = cp.type === 'basecamp';
      const isCamp = cp.type === 'camp';

      // Marker circle colors
      const markerBg = isSummit 
        ? 'background:linear-gradient(135deg,#F59E0B,#D97706);color:#1a1a2e;border-color:#FCD34D;'
        : isBasecamp 
          ? 'background:linear-gradient(135deg,#059669,#047857);color:#fff;border-color:#6EE7B7;'
          : isCamp 
            ? 'background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;border-color:#C4B5FD;'
            : 'background:linear-gradient(135deg,#F97316,#EA580C);color:#fff;border-color:#FDBA74;';

      // Elevation badge color
      const elevBadgeBg = isSummit
        ? 'background:#78350F;color:#FDE68A;border-color:#B45309;'
        : isBasecamp
          ? 'background:#064E3B;color:#6EE7B7;border-color:#047857;'
          : 'background:#1E293B;color:#F1F5F9;border-color:#475569;';

      const iconHtml = `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
          <div style="width:36px;height:36px;border-radius:12px;${markerBg}border:2.5px solid;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;font-family:system-ui;transition:transform 0.2s;z-index:2;">
            ${isSummit ? '▲' : cp.code}
          </div>
          <div style="margin-top:2px;padding:1px 6px;border-radius:8px;${elevBadgeBg}border:1px solid;font-size:9px;font-weight:800;font-family:system-ui;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:1;">
            ${cp.elevation} m
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-checkpoint-marker',
        iconSize: [44, 56],
        iconAnchor: [22, 48],
      });

      const marker = L.marker([cp.lat, cp.lng], { icon: customIcon }).addTo(map);

      // Popup Content
      const popupContent = `
        <div class="p-2.5 max-w-xs font-sans text-slate-900">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">${cp.icon}</span>
            <div>
              <h4 class="font-black text-xs uppercase text-[#0D5C3A] tracking-wider">${cp.name}</h4>
              ${cp.subtitle ? `<p class="text-[10px] text-slate-500 font-semibold">${cp.subtitle}</p>` : ''}
            </div>
          </div>
          <div class="flex items-center gap-3 text-[11px] font-bold text-slate-700 my-1 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
            <span>⛰️ ${cp.elevation} mdpl</span>
            <span>📍 ${cp.distance} km</span>
          </div>
          <p class="text-[11px] text-slate-600 leading-tight mt-1.5">${cp.description}</p>
        </div>
      `;

      marker.bindPopup(popupContent, { offset: [0, -40] });
      marker.on('click', () => setSelectedCheckpoint(cp));
      markersRef.current[cp.id] = marker;
    });

    // Add Intermediate Landmark Markers with name + elevation labels
    LANDMARKS.forEach((lm) => {
      const isWater = lm.type === 'water';
      const isPuncakBogo = lm.name.includes('Puncak Bogowonto');

      // Marker circle styling
      const markerStyle = isWater
        ? 'background:linear-gradient(135deg,#06B6D4,#0891B2);color:#fff;border-color:#67E8F9;'
        : isPuncakBogo
          ? 'background:linear-gradient(135deg,#F59E0B,#D97706);color:#1a1a2e;border-color:#FCD34D;'
          : 'background:linear-gradient(135deg,#10B981,#059669);color:#fff;border-color:#6EE7B7;';

      const lmIcon = isWater ? '💧' : isPuncakBogo ? '▲' : '◆';

      const lmIconHtml = `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
          <div style="width:26px;height:26px;border-radius:50%;${markerStyle}border:2px solid;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;font-family:system-ui;z-index:2;">
            ${lmIcon}
          </div>
          <div style="margin-top:2px;padding:1px 5px;border-radius:6px;background:rgba(15,23,42,0.92);color:#E2E8F0;border:1px solid #475569;font-size:9px;font-weight:700;font-family:system-ui;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.4);z-index:1;text-align:center;line-height:1.3;">
            <span style="display:block;font-size:8px;color:#94A3B8;">${lm.name}</span>
            <span style="color:#FDE68A;font-weight:900;">${lm.elevation} m</span>
          </div>
        </div>
      `;

      const lmCustomIcon = L.divIcon({
        html: lmIconHtml,
        className: 'custom-landmark-marker',
        iconSize: [30, 52],
        iconAnchor: [15, 44],
      });

      const lmMarker = L.marker([lm.lat, lm.lng], { icon: lmCustomIcon }).addTo(map);

      const lmPopup = `
        <div class="p-2.5 font-sans max-w-[200px]">
          <div class="flex items-center gap-1.5 font-bold text-xs ${isWater ? 'text-cyan-700' : 'text-slate-800'}">
            <span>${isWater ? '💧' : '📍'}</span>
            <span>${lm.name}</span>
          </div>
          <div class="text-[10px] text-slate-500 font-medium mt-0.5">
            Elevasi: <span class="font-bold text-slate-700">${lm.elevation} mdpl</span> &bull; Jarak: <span class="font-bold text-slate-700">~${lm.distance} km</span>
          </div>
        </div>
      `;

      lmMarker.bindPopup(lmPopup, { offset: [0, -36] });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Center map when checkpoint is selected
  const handleSelectCheckpoint = (cp: CheckpointData) => {
    setSelectedCheckpoint(cp);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([cp.lat, cp.lng], 15, {
        duration: 1.2,
      });
      const targetMarker = markersRef.current[cp.id];
      if (targetMarker) {
        targetMarker.openPopup();
      }
    }
  };

  // Switch Map Layer
  const handleTileChange = (layer: 'satellite' | 'street' | 'topo') => {
    setMapLayer(layer);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.eachLayer((l) => {
        if (l instanceof L.TileLayer) {
          mapInstanceRef.current?.removeLayer(l);
        }
      });
      L.tileLayer(tileUrls[layer], {
        attribution: tileAttribution[layer],
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
    }
  };

  // GPX Download Action
  const handleDownloadGpx = () => {
    const link = document.createElement('a');
    link.href = encodeURI('/gpx/ZeppWonosobo Lari trail.gpx');
    link.download = 'Sumbing_Via_Basecamp_Bogowonto_Official_Trail.gpx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] text-slate-900 dark:bg-[#081C15] dark:text-slate-100 font-sans selection:bg-[#0D5C3A] selection:text-white pb-16">
      
      {/* Header Banner */}
      <div className="relative bg-gradient-to-br from-[#064E3B] via-[#0D5C3A] to-[#042F2E] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-800 shadow-xl overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Peta Interaktif Resmi &bull; Jawa Tengah, Indonesia</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                Jalur Pendakian Gunung Sumbing
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base mt-2 max-w-2xl font-medium leading-relaxed">
                Jalur resmi via <span className="font-bold text-amber-300">Basecamp Bogowonto</span> (Pencar). Panduan lengkap peta rute satellite, grafik elevasi mdpl, estimasi waktu, dan titik pos pendakian.
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadGpx}
                className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-amber-400/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Berkas GPX</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-emerald-700/50">
            <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block">Total Jarak</span>
              <span className="text-xl sm:text-2xl font-black text-white">6.35 km</span>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block">Elevasi Puncak</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300">3.371 mdpl</span>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block">Estimasi Waktu</span>
              <span className="text-xl sm:text-2xl font-black text-white">&plusmn;7.15 Jam</span>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block">Tingkat Kesulitan</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300">Sedang</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Trail Application Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Map Section Card */}
        <div className="bg-white dark:bg-[#0F291E] border border-slate-200 dark:border-emerald-900 rounded-3xl overflow-hidden shadow-xl">
          
          {/* Map Controls Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-black uppercase tracking-wider">Peta Rute Satelit Interaktif</h2>
            </div>

            {/* Layer Toggles & Legend */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold hidden sm:inline">Map Style:</span>
              <div className="inline-flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                {(['satellite', 'street', 'topo'] as const).map((layer) => (
                  <button
                    key={layer}
                    onClick={() => handleTileChange(layer)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      mapLayer === layer 
                        ? 'bg-[#0D5C3A] text-white shadow-md' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {layer === 'satellite' ? 'Satelit 🛰️' : layer === 'street' ? 'Jalan 🗺️' : 'Topo ⛰️'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map View Container */}
          <div className="relative w-full h-[450px] sm:h-[550px] bg-slate-950">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/90 backdrop-blur-md text-white p-3 sm:p-4 rounded-2xl border border-emerald-800/80 shadow-2xl max-w-[220px] sm:max-w-xs text-xs space-y-2">
              <div className="font-black text-[11px] uppercase tracking-wider text-emerald-400 flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span>Legend / Ikon Peta</span>
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] font-semibold text-slate-200">
                <div className="flex items-center gap-1.5"><span>🏠</span> <span>Basecamp</span></div>
                <div className="flex items-center gap-1.5"><span>🪧</span> <span>Pos Utama</span></div>
                <div className="flex items-center gap-1.5"><span>⛺</span> <span>Camp Area</span></div>
                <div className="flex items-center gap-1.5"><span>💧</span> <span>Mata Air</span></div>
                <div className="flex items-center gap-1.5"><span>🏔</span> <span>Puncak</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-1 bg-orange-500 rounded-full"></span> <span>Jalur Pendakian</span></div>
              </div>
            </div>
          </div>

          {/* Active Selected Checkpoint Banner */}
          <div className="p-4 bg-emerald-950 text-white border-t border-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-black shrink-0">
                {selectedCheckpoint.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full">
                    {selectedCheckpoint.code}
                  </span>
                  <h3 className="text-base font-black text-white">{selectedCheckpoint.name}</h3>
                </div>
                <p className="text-xs text-emerald-200 mt-0.5">{selectedCheckpoint.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-emerald-300 shrink-0 self-end sm:self-auto">
              <span className="px-3 py-1.5 bg-emerald-900/80 rounded-xl border border-emerald-700">
                ⛰️ {selectedCheckpoint.elevation} mdpl
              </span>
              <span className="px-3 py-1.5 bg-emerald-900/80 rounded-xl border border-emerald-700">
                📍 {selectedCheckpoint.distance} km dari BC
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Elevation Profile Chart */}
        <div className="bg-white dark:bg-[#0F291E] border border-slate-200 dark:border-emerald-900 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-emerald-900/60">
            <div>
              <div className="flex items-center gap-2 text-[#0D5C3A] dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Profil Ketinggian Jalur (Elevation Profile)</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Grafik Kontur Elevasi (1.450 mdpl &rarr; 3.371 mdpl)
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-emerald-300">
              Sumbu X: Jarak (km) &bull; Sumbu Y: Ketinggian (mdpl)
            </span>
          </div>

          {/* Recharts Elevation Line Chart */}
          <div className="w-full h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#042F2E" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="km" 
                  unit=" km" 
                  stroke="#64748B" 
                  tick={{ fontSize: 11, fontWeight: 700 }}
                />
                <YAxis 
                  domain={[1400, 3400]} 
                  unit="m" 
                  stroke="#64748B" 
                  tick={{ fontSize: 11, fontWeight: 700 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 text-white p-3 rounded-2xl border border-emerald-700 shadow-xl text-xs space-y-1">
                          <p className="font-black text-emerald-400">{data.name}</p>
                          <p className="text-slate-300">Elevasi: <span className="font-bold text-amber-300">{data.elevation} mdpl</span></p>
                          <p className="text-slate-300">Jarak: <span className="font-bold text-white">{data.km} km</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="elevation" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#elevationGradient)" 
                />
                {CHECKPOINTS.map((cp) => (
                  <ReferenceDot 
                    key={cp.id}
                    x={cp.distance} 
                    y={cp.elevation} 
                    r={6} 
                    fill={cp.type === 'summit' ? '#F59E0B' : '#10B981'} 
                    stroke="#FFFFFF" 
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 3: Hiking Time Estimates Panel */}
        <div className="bg-white dark:bg-[#0F291E] border border-slate-200 dark:border-emerald-900 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-emerald-900/60">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0D5C3A] dark:text-emerald-400" />
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Estimasi Waktu Tempuh Pendakian</h3>
                <p className="text-xs text-slate-500 dark:text-emerald-300">Durasi rata-rata berjalan normal dari Basecamp hingga Puncak Sumbing</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-black text-[#0D5C3A] dark:text-emerald-300">
              <span>Total Tempuh: &plusmn;7 Jam 15 Menit</span>
            </div>
          </div>

          {/* Timeline Table Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ESTIMATES_TABLE.map((seg, idx) => (
              <div 
                key={idx}
                className="bg-[#FAF8F5] dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0D5C3A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{seg.from} &rarr; {seg.to}</h4>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-emerald-300">Estimasi Jalan Normal</span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-900 dark:text-amber-300 text-xs font-black rounded-xl">
                  {seg.duration}
                </div>
              </div>
            ))}
          </div>

          {/* Total Summary Footer */}
          <div className="p-4 rounded-2xl bg-[#064E3B] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
              <span className="font-medium">Total perkiraan waktu naik dari Basecamp Bogowonto sampai Puncak Rajawali:</span>
            </div>
            <span className="px-4 py-2 bg-amber-400 text-slate-950 font-black rounded-xl text-sm">
              &plusmn;7 Jam 15 Menit
            </span>
          </div>
        </div>

        {/* Section 4: Interactive Checkpoint Cards Grid */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Daftar Titik Pos Pendakian (Checkpoints)</h3>
              <p className="text-xs text-slate-500 dark:text-emerald-300">Klik kartu pos untuk meninjau detail dan mengarahkan peta otomatis ke lokasi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CHECKPOINTS.map((cp) => {
              const isSelected = selectedCheckpoint.id === cp.id;
              return (
                <motion.div
                  key={cp.id}
                  whileHover={{ y: -4 }}
                  onClick={() => handleSelectCheckpoint(cp)}
                  className={`cursor-pointer p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden ${
                    isSelected 
                      ? 'bg-white dark:bg-[#0F291E] border-[#0D5C3A] dark:border-emerald-400 ring-2 ring-[#0D5C3A]/30 shadow-xl' 
                      : 'bg-white dark:bg-[#0F291E]/80 border-slate-200 dark:border-emerald-900/80 hover:border-emerald-400 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#0D5C3A] text-white font-black text-base flex items-center justify-center shadow-md">
                        {cp.code}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{cp.name}</h4>
                        {cp.subtitle && <span className="text-[10px] text-slate-500 dark:text-emerald-300 font-bold block">{cp.subtitle}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-emerald-200 mb-3 bg-[#FAF8F5] dark:bg-emerald-950/60 p-2 rounded-xl border border-slate-100 dark:border-emerald-900">
                    <span>⛰️ {cp.elevation} mdpl</span>
                    <span>📍 {cp.distance} km</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {cp.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-emerald-900/60 flex items-center justify-between text-[11px] font-bold text-[#0D5C3A] dark:text-emerald-400">
                    <span>Lihat di Peta</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
