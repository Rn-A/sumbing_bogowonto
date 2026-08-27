import fs from 'fs';

const xmlText = fs.readFileSync('c:/Users/Rendra Aji Syaputra/Downloads/bc_sumbing/public/gpx/ZeppWonosobo Lari trail.gpx', 'utf8');

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)">[\s\S]*?<ele>([^<]+)<\/ele>[\s\S]*?<\/trkpt>/g;

let match;
let cumDist = 0;
let prevLat: number | null = null;
let prevLon: number | null = null;

const points: { lat: number, lon: number, ele: number, distKm: number }[] = [];

while ((match = trkptRegex.exec(xmlText)) !== null) {
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);
  const ele = parseFloat(match[3]);

  if (prevLat !== null && prevLon !== null) {
    cumDist += getDistance(prevLat, prevLon, lat, lon);
  }
  prevLat = lat;
  prevLon = lon;

  points.push({ lat, lon, ele: Math.round(ele), distKm: parseFloat((cumDist / 1000).toFixed(2)) });
}

// All 20 items in chronological order from bottom to top
const items = [
  { id: 'basecamp', code: 'S', name: 'Basecamp Bogowonto', elevation: 1450, icon: '🏠', type: 'basecamp' },
  { id: 'lm-1', name: 'Wisata Alam Tanggul Asri', elevation: 1682, icon: '📍', type: 'landmark' },
  { id: 'pos1', code: '1', name: 'Pos 1 - Sikembang', elevation: 1816, icon: '🪧', type: 'pos' },
  { id: 'lm-2', name: 'Selamat Datang', elevation: 1750, icon: '📍', type: 'landmark' },
  { id: 'lm-3', name: 'Cemoro Pitu', elevation: 1900, icon: '🌲', type: 'landmark' },
  { id: 'pos2', code: '2', name: 'Pos 2 - Kayu Bogel / Galaran', elevation: 1974, icon: '🪧', type: 'pos' },
  { id: 'lm-4', name: 'Hutan Rimba', elevation: 2085, icon: '🌳', type: 'landmark' },
  { id: 'pos3', code: '3', name: 'Pos 3 - Watu Talang', elevation: 2334, icon: '🪧', type: 'pos' },
  { id: 'lm-5', name: 'Ratan Tengah', elevation: 2479, icon: '📍', type: 'landmark' },
  { id: 'pos4', code: '4', name: 'Pos 4 - Sabana I / Sodong Celeng', elevation: 2539, icon: '🪧', type: 'pos' },
  { id: 'lm-6', name: 'Mata Air', elevation: 2598, icon: '💧', type: 'water' },
  { id: 'lm-7', name: 'Watu Anak', elevation: 2669, icon: '🪨', type: 'landmark' },
  { id: 'lm-8', name: 'Sabana II', elevation: 2685, icon: '🏕️', type: 'landmark' },
  { id: 'pos5', code: '5', name: 'Pos 5 - Camp Area', elevation: 2766, icon: '⛺', type: 'camp' },
  { id: 'lm-9', name: 'Watu Edeg', elevation: 2888, icon: '🪨', type: 'landmark' },
  { id: 'lm-10', name: 'Watu Putih', elevation: 2944, icon: '🪨', type: 'landmark' },
  { id: 'pos6', code: '6', name: 'Pos 6 - Kayu Kuno', elevation: 3057, icon: '🪧', type: 'pos' },
  { id: 'lm-11', name: 'Puncak Bogowonto', elevation: 3271, icon: '⛰️', type: 'landmark' },
  { id: 'lm-12', name: 'Watu Lawang', elevation: 3279, icon: '🪨', type: 'landmark' },
  { id: 'summit', code: '🏔', name: 'Puncak Rajawali', elevation: 3371, icon: '🏔', type: 'summit' },
];

let lastIdx = 0;
const results = items.map((item) => {
  let bestIdx = lastIdx;
  let minDiff = 99999;
  
  // Look forward from lastIdx to ensure monotonic progress along the trail
  for (let i = lastIdx; i < points.length; i++) {
    const diff = Math.abs(points[i].ele - item.elevation);
    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = i;
    }
  }
  // Ensure we don't go backwards
  if (bestIdx < lastIdx) bestIdx = lastIdx;
  lastIdx = bestIdx;

  const pt = points[bestIdx];
  return {
    ...item,
    distance: pt.distKm,
    lat: parseFloat(pt.lat.toFixed(6)),
    lng: parseFloat(pt.lon.toFixed(6))
  };
});

console.log(JSON.stringify(results, null, 2));
