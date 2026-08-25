/**
 * build-route-page.cjs
 * ─────────────────────────────────────────────────────────
 * Reads route_data.json and produces a self-contained HTML
 * file with embedded data, Leaflet map, Chart.js elevation
 * profile, and all styling inline.
 *
 * Usage:  node build-route-page.cjs
 * Output: public/route-map.html
 * ─────────────────────────────────────────────────────────
 */
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'route_data.json'), 'utf-8'));

// Minify track array (reduce decimals for smaller file)
const trackCompact = data.track.map(p => [
  Math.round(p[0] * 1e6) / 1e6,
  Math.round(p[1] * 1e6) / 1e6,
  Math.round(p[2] * 10) / 10,
  Math.round(p[3] * 1000) / 1000,
]);

const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.routeName} — Peta Rute Interaktif</title>
<meta name="description" content="Peta rute interaktif ${data.routeName}. Total jarak ${data.totalKm} km, elevation gain +${data.elevGain} m. Dilengkapi profil elevasi dan checkpoint pos pendakian.">

<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<style>
/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS
   ══════════════════════════════════════════════════════════ */
:root {
  /* Forest / Moss Greens */
  --forest-900: #0b3d1e;
  --forest-800: #0d4f26;
  --forest-700: #11632f;
  --forest-600: #177a3b;
  --forest-500: #1e9149;
  --forest-400: #3aab65;
  --forest-100: #d4f0df;

  /* Ember / Terracotta accents */
  --ember-700: #9a3412;
  --ember-600: #c2410c;
  --ember-500: #ea580c;
  --ember-400: #f97316;
  --ember-300: #fdba74;
  --ember-100: #fff7ed;

  /* Neutrals */
  --stone-950: #0c0a09;
  --stone-900: #1c1917;
  --stone-800: #292524;
  --stone-700: #44403c;
  --stone-600: #57534e;
  --stone-500: #78716c;
  --stone-400: #a8a29e;
  --stone-300: #d6d3d1;
  --stone-200: #e7e5e4;
  --stone-100: #f5f5f4;
  --stone-50:  #fafaf9;

  /* Summit marker */
  --summit: #1e293b;

  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --radius: 16px;
  --radius-sm: 10px;
}

/* ══════════════════════════════════════════════════════════
   RESET & BASE
   ══════════════════════════════════════════════════════════ */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-body);
  background: var(--stone-100);
  color: var(--stone-900);
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;
}

/* ══════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════ */
.header {
  background: linear-gradient(135deg, var(--forest-900) 0%, var(--forest-800) 40%, var(--forest-700) 100%);
  color: #fff;
  padding: 2.5rem 1.5rem 2rem;
  position: relative;
  overflow: hidden;
}
.header::before {
  content: '';
  position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 60H0z' fill='%23fff' fill-opacity='0.018'/%3E%3C/svg%3E") repeat;
  pointer-events: none;
}
.header-inner {
  max-width: 1100px; margin: 0 auto;
  position: relative; z-index: 1;
}
.header-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.1); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 999px; padding: 5px 14px;
  font-size: 0.65rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--forest-100); margin-bottom: 1rem;
}
.header-badge svg { width: 14px; height: 14px; }
.header h1 {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 4vw, 2.4rem);
  font-weight: 700; line-height: 1.15;
  margin-bottom: 0.35rem;
}
.header p {
  font-size: 0.85rem; color: rgba(255,255,255,0.7);
  font-weight: 500; max-width: 600px;
}

/* ══════════════════════════════════════════════════════════
   STAT BAR
   ══════════════════════════════════════════════════════════ */
.stat-bar {
  background: var(--stone-950);
  border-bottom: 3px solid var(--forest-600);
}
.stat-bar-inner {
  max-width: 1100px; margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
}
.stat-item {
  padding: 1rem 1.25rem;
  border-right: 1px solid rgba(255,255,255,0.06);
  text-align: center;
}
.stat-item:last-child { border-right: none; }
.stat-label {
  font-size: 0.55rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--stone-400); margin-bottom: 4px;
}
.stat-value {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  font-weight: 700; color: #fff;
}
.stat-unit {
  font-size: 0.65rem; font-weight: 600;
  color: var(--forest-400); margin-left: 3px;
}

/* ══════════════════════════════════════════════════════════
   MAIN CARD
   ══════════════════════════════════════════════════════════ */
.main-wrapper {
  max-width: 1100px; margin: -1.5rem auto 2rem;
  padding: 0 1rem; position: relative; z-index: 2;
}
.main-card {
  background: #fff;
  border-radius: var(--radius);
  box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  overflow: hidden;
  border: 1px solid var(--stone-200);
}

/* ── Layer Switcher Toolbar ── */
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--stone-200);
  background: var(--stone-50);
  flex-wrap: wrap; gap: 0.5rem;
}
.toolbar-label {
  font-size: 0.65rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--stone-500);
}
.layer-group {
  display: flex; gap: 0; border-radius: var(--radius-sm); overflow: hidden;
  border: 1px solid var(--stone-200);
}
.layer-btn {
  padding: 6px 14px; border: none; cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.7rem; font-weight: 700;
  background: #fff; color: var(--stone-600);
  border-right: 1px solid var(--stone-200);
  transition: all 0.15s ease;
}
.layer-btn:last-child { border-right: none; }
.layer-btn:hover { background: var(--stone-100); }
.layer-btn.active {
  background: var(--forest-800); color: #fff;
}

.download-gpx-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: var(--radius-sm);
  border: 1px solid var(--forest-600);
  background: var(--forest-700); color: #fff;
  font-family: var(--font-body);
  font-size: 0.7rem; font-weight: 700;
  cursor: pointer; transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.download-gpx-btn:hover {
  background: var(--forest-600); border-color: var(--forest-500);
}
.download-gpx-btn svg { flex-shrink: 0; }

/* ── Map ── */
#map {
  width: 100%; height: 500px;
  background: var(--stone-200);
}

/* ── Elevation Chart ── */
.chart-container {
  padding: 1rem 1rem 0.75rem;
  border-top: 1px solid var(--stone-200);
  position: relative;
}
.chart-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.5rem;
  flex-wrap: wrap; gap: 0.5rem;
}
.chart-title {
  font-family: var(--font-display);
  font-size: 0.8rem; font-weight: 700;
  color: var(--stone-800);
}
.chart-hover-info {
  font-size: 0.7rem; font-weight: 600;
  color: var(--ember-600);
  min-height: 1.2em;
  font-family: var(--font-display);
}
.chart-wrapper {
  position: relative;
  height: 200px;
  width: 100%;
}
#elevChart {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

/* ── Checkpoint Legend ── */
.legend {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--stone-200);
  background: var(--stone-50);
}
.legend-title {
  font-size: 0.6rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--stone-400); margin-bottom: 0.5rem;
}
.legend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.4rem;
}
.legend-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.7rem; font-weight: 600;
  color: var(--stone-700);
  background: #fff;
  border: 1px solid var(--stone-200);
  cursor: pointer;
  transition: all 0.15s ease;
}
.legend-item:hover {
  border-color: var(--forest-500);
  background: var(--forest-100);
  color: var(--forest-800);
}
.legend-dot {
  width: 10px; height: 10px;
  border-radius: 50%; flex-shrink: 0;
}
.legend-km {
  margin-left: auto;
  font-family: var(--font-display);
  font-size: 0.65rem; font-weight: 700;
  color: var(--stone-400);
}

/* ── Custom Leaflet Markers ── */
.marker-start, .marker-pos, .marker-finish {
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-weight: 700; font-size: 11px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: transform 0.2s ease;
}
.marker-start {
  width: 30px; height: 30px;
  background: var(--forest-700);
  color: #fff;
  border: 3px solid #fff;
}
.marker-pos {
  width: 26px; height: 26px;
  background: var(--ember-500);
  color: #fff;
  border: 2.5px solid #fff;
  font-size: 10px;
}
.marker-finish {
  width: 32px; height: 32px;
  background: var(--summit);
  color: #fff;
  border: 3px solid #fff;
  font-size: 13px;
  line-height: 1;
}

/* ── Leaflet Popup Override ── */
.leaflet-popup-content-wrapper {
  border-radius: 12px !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
  padding: 0 !important;
}
.leaflet-popup-content {
  margin: 0 !important;
  font-family: var(--font-body) !important;
}
.popup-inner {
  padding: 12px 16px;
}
.popup-name {
  font-family: var(--font-display);
  font-weight: 700; font-size: 0.85rem;
  color: var(--stone-900);
  margin-bottom: 4px;
}
.popup-stats {
  display: flex; gap: 12px;
  font-size: 0.7rem; font-weight: 600;
  color: var(--stone-500);
}
.popup-stats span { color: var(--forest-700); font-weight: 700; }

/* ── Hover Circle Marker on Map ── */
.hover-pulse {
  width: 14px; height: 14px;
  background: var(--ember-500);
  border: 2.5px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(234,88,12,0.25), 0 2px 8px rgba(0,0,0,0.2);
  animation: pulse-ring 1.2s ease-out infinite;
}
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(234,88,12,0.4), 0 2px 8px rgba(0,0,0,0.2); }
  70% { box-shadow: 0 0 0 10px rgba(234,88,12,0), 0 2px 8px rgba(0,0,0,0.2); }
  100% { box-shadow: 0 0 0 0 rgba(234,88,12,0), 0 2px 8px rgba(0,0,0,0.2); }
}

/* ══════════════════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════════════════ */
.footer {
  text-align: center;
  padding: 1.5rem; color: var(--stone-400);
  font-size: 0.65rem; font-weight: 600;
}

/* ══════════════════════════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════════════════════════ */
@media (max-width: 640px) {
  .header { padding: 1.5rem 1rem 1.25rem; }
  .stat-bar-inner {
    grid-template-columns: repeat(3, 1fr);
  }
  .stat-item:nth-child(4), .stat-item:nth-child(5) {
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  #map { height: 350px; }
  #elevChart { height: 160px; }
  .layer-btn { padding: 5px 10px; font-size: 0.6rem; }
  .legend-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 400px) {
  .stat-bar-inner { grid-template-columns: repeat(2, 1fr); }
}

/* ── Embed Mode overrides ── */
body.is-embedded {
  background: transparent !important;
}
body.is-embedded .header,
body.is-embedded .stat-bar,
body.is-embedded .footer {
  display: none !important;
}
body.is-embedded .main-wrapper {
  margin: 0 auto !important;
  padding: 0 !important;
  max-width: 100% !important;
}
body.is-embedded .main-card {
  box-shadow: none !important;
  border: none !important;
  border-radius: 0 !important;
}
</style>
</head>
<body>

<!-- ═══════════ HEADER ═══════════ -->
<header class="header">
  <div class="header-inner">
    <div class="header-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 22h20L12 2z"/></svg>
      Peta Rute Interaktif
    </div>
    <h1>${data.routeName}</h1>
    <p>Basecamp Bogowonto, Kecamatan Kalikajar, Wonosobo — Jawa Tengah</p>
  </div>
</header>

<!-- ═══════════ STAT BAR ═══════════ -->
<div class="stat-bar">
  <div class="stat-bar-inner">
    <div class="stat-item">
      <div class="stat-label">Total Jarak</div>
      <div class="stat-value">${data.totalKm}<span class="stat-unit">km</span></div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Elevation Gain</div>
      <div class="stat-value">+${data.elevGain}<span class="stat-unit">m</span></div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Elevasi Start</div>
      <div class="stat-value">${data.elevMin}<span class="stat-unit">mdpl</span></div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Elevasi Puncak</div>
      <div class="stat-value">${data.elevMax}<span class="stat-unit">mdpl</span></div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Jumlah Pos</div>
      <div class="stat-value">${data.segmentCount}</div>
    </div>
  </div>
</div>

<!-- ═══════════ MAP + CHART CARD ═══════════ -->
<div class="main-wrapper">
  <div class="main-card">

    <!-- Layer Switcher Toolbar -->
    <div class="toolbar" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <span class="toolbar-label">Peta Dasar</span>
        <div class="layer-group">
          <button class="layer-btn" data-layer="streets" id="btn-streets">Streets</button>
          <button class="layer-btn active" data-layer="satellite" id="btn-satellite">Satellite</button>
          <button class="layer-btn" data-layer="terrain" id="btn-terrain">Terrain</button>
          <button class="layer-btn" data-layer="topo" id="btn-topo">Topo</button>
        </div>
      </div>
      <button class="download-gpx-btn" id="btn-download-gpx">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 13px; height: 13px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Unduh Rute GPX
      </button>
    </div>

    <!-- Leaflet Map -->
    <div id="map"></div>

    <!-- Elevation Chart -->
    <div class="chart-container">
      <div class="chart-header">
        <span class="chart-title">Profil Elevasi</span>
        <span class="chart-hover-info" id="hoverInfo">Geser kursor di grafik untuk melihat posisi</span>
      </div>
      <div class="chart-wrapper">
        <canvas id="elevChart"></canvas>
      </div>
    </div>

    <!-- Checkpoint Legend -->
    <div class="legend">
      <div class="legend-title">Checkpoint & Pos Pendakian</div>
      <div class="legend-grid" id="legendGrid"></div>
    </div>

  </div>
</div>

<div class="footer">
  Data rute diolah dari file GPX Zepp GPS &bull; Haversine distance &bull; ${trackCompact.length} trackpoints
</div>

<!-- ═══════════ LIBRARIES ═══════════ -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"><\/script>

<script>
/* ══════════════════════════════════════════════════════════
   ROUTE DATA (generated from GPX via gpx-to-json.cjs)
   ══════════════════════════════════════════════════════════ */
const ROUTE = {
  name: ${JSON.stringify(data.routeName)},
  totalKm: ${data.totalKm},
  elevMin: ${data.elevMin},
  elevMax: ${data.elevMax},
  elevGain: ${data.elevGain},

  /* Segments: easily rename by editing the "name" field below */
  segments: ${JSON.stringify(data.segments)},

  /* Track: [lat, lon, ele_m, cumulative_km] */
  track: ${JSON.stringify(trackCompact)}
};

/* ══════════════════════════════════════════════════════════
   TILE LAYER DEFINITIONS (all free, no API key)
   ══════════════════════════════════════════════════════════ */
const TILES = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri, Maxar, Earthstar Geographics'
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri, USGS, NOAA'
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>, <a href="https://osm.org">OSM</a>'
  }
};

/* ══════════════════════════════════════════════════════════
   LEAFLET MAP SETUP
   ══════════════════════════════════════════════════════════ */
const map = L.map('map', {
  scrollWheelZoom: false,  // prevent accidental scroll-zoom
  zoomControl: true,
});

// Start with Satellite layer
let activeLayer = L.tileLayer(TILES.satellite.url, {
  attribution: TILES.satellite.attr,
  maxZoom: 18,
}).addTo(map);

/* ── Layer Switcher ── */
document.querySelectorAll('.layer-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.layer;
    document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    map.removeLayer(activeLayer);
    activeLayer = L.tileLayer(TILES[key].url, {
      attribution: TILES[key].attr,
      maxZoom: 18,
    }).addTo(map);
  });
});

/* ── Route Polyline (dual layer for visibility) ── */
const trackLatLngs = ROUTE.track.map(p => [p[0], p[1]]);

// Background glow line
L.polyline(trackLatLngs, {
  color: '#fff',
  weight: 6,
  opacity: 0.5,
  lineCap: 'round', lineJoin: 'round',
}).addTo(map);

// Main solid line
L.polyline(trackLatLngs, {
  color: '#ea580c',
  weight: 3.5,
  opacity: 0.9,
  lineCap: 'round', lineJoin: 'round',
}).addTo(map);

// Dashed overlay for contrast on satellite
L.polyline(trackLatLngs, {
  color: '#fff',
  weight: 1.5,
  opacity: 0.45,
  dashArray: '6 8',
  lineCap: 'round', lineJoin: 'round',
}).addTo(map);

/* ── Fit map to route bounds ── */
map.fitBounds(L.latLngBounds(trackLatLngs).pad(0.08));

/* ── Markers ── */
const segments = ROUTE.segments;
const legendGrid = document.getElementById('legendGrid');

segments.forEach((seg, i) => {
  const isStart = (i === 0);
  const isFinish = (i === segments.length - 1);
  let markerEl;

  if (isStart) {
    markerEl = document.createElement('div');
    markerEl.className = 'marker-start';
    markerEl.textContent = 'S';
  } else if (isFinish) {
    markerEl = document.createElement('div');
    markerEl.className = 'marker-finish';
    markerEl.textContent = '▲';
  } else {
    markerEl = document.createElement('div');
    markerEl.className = 'marker-pos';
    markerEl.textContent = i;
  }

  const icon = L.divIcon({
    html: markerEl.outerHTML,
    className: '', // clear default leaflet-div-icon styling
    iconSize: isFinish ? [32, 32] : isStart ? [30, 30] : [26, 26],
    iconAnchor: isFinish ? [16, 16] : isStart ? [15, 15] : [13, 13],
  });

  const marker = L.marker([seg.lat, seg.lon], { icon }).addTo(map);

  // Popup
  marker.bindPopup(
    '<div class="popup-inner">' +
      '<div class="popup-name">' + seg.name + '</div>' +
      '<div class="popup-stats">' +
        'Jarak: <span>' + seg.km + ' km</span>&emsp;' +
        'Elevasi: <span>' + Math.round(seg.ele) + ' m</span>' +
      '</div>' +
    '</div>',
    { closeButton: false, offset: [0, -8] }
  );

  // Legend item
  const dot = document.createElement('div');
  dot.className = 'legend-item';
  dot.innerHTML =
    '<div class="legend-dot" style="background:' +
      (isStart ? 'var(--forest-700)' : isFinish ? 'var(--summit)' : 'var(--ember-500)') +
    '"></div>' +
    '<span>' + seg.name + ' (' + Math.round(seg.ele) + ' m)</span>' +
    '<span class="legend-km">' + seg.km + ' km</span>';
  dot.addEventListener('click', () => {
    map.flyTo([seg.lat, seg.lon], 15, { duration: 0.8 });
    marker.openPopup();
  });
  legendGrid.appendChild(dot);
});

/* ══════════════════════════════════════════════════════════
   CHART.JS ELEVATION PROFILE
   ══════════════════════════════════════════════════════════ */
const ctx = document.getElementById('elevChart').getContext('2d');
const chartData = ROUTE.track; // [lat, lon, ele, km]

/* ── Hover marker on map (synced with chart) ── */
let hoverMarker = null;
const hoverInfo = document.getElementById('hoverInfo');

const elevChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: chartData.map(p => p[3]), // km
    datasets: [{
      data: chartData.map(p => p[2]),   // ele
      fill: true,
      backgroundColor: (ctx2) => {
        const gradient = ctx2.chart.ctx.createLinearGradient(0, 0, 0, ctx2.chart.height);
        gradient.addColorStop(0, 'rgba(17, 99, 47, 0.35)');
        gradient.addColorStop(0.6, 'rgba(17, 99, 47, 0.08)');
        gradient.addColorStop(1, 'rgba(17, 99, 47, 0.0)');
        return gradient;
      },
      borderColor: '#11632f',
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#ea580c',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2.5,
      tension: 0.3,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(12, 10, 9, 0.92)',
        titleFont: { family: "'Space Grotesk', sans-serif", weight: 700, size: 12 },
        bodyFont: { family: "'Inter', sans-serif", size: 11 },
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          title: (items) => 'Km ' + items[0].label,
          label: (item) => 'Elevasi: ' + Math.round(item.raw) + ' mdpl',
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Jarak (km)', font: { size: 10, weight: 600 }, color: '#78716c' },
        ticks: { 
          font: { size: 9 }, 
          color: '#a8a29e', 
          maxTicksLimit: 12, 
          callback: function(val) {
            const actualValue = parseFloat(this.getLabelForValue(val));
            return (isNaN(actualValue) ? val : actualValue.toFixed(2)) + ' km';
          } 
        },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      y: {
        title: { display: true, text: 'Elevasi (m)', font: { size: 10, weight: 600 }, color: '#78716c' },
        ticks: { font: { size: 9 }, color: '#a8a29e', callback: v => v + 'm' },
        grid: { color: 'rgba(0,0,0,0.04)' },
        beginAtZero: false,
      }
    },
    /* ── Hover sync: chart → map ── */
    onHover: (event, elements, chart) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        const pt = chartData[idx];
        const km = pt[3];
        const ele = Math.round(pt[2]);
        hoverInfo.textContent = 'Km ' + km + '  •  ' + ele + ' mdpl';

        // Move/create marker on map
        if (hoverMarker) {
          hoverMarker.setLatLng([pt[0], pt[1]]);
        } else {
          const el = document.createElement('div');
          el.className = 'hover-pulse';
          hoverMarker = L.marker([pt[0], pt[1]], {
            icon: L.divIcon({
              html: el.outerHTML,
              className: '',
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            }),
            zIndexOffset: 1000,
          }).addTo(map);
        }
      } else {
        // Mouse left chart area
        if (hoverMarker) {
          map.removeLayer(hoverMarker);
          hoverMarker = null;
        }
        hoverInfo.textContent = 'Geser kursor di grafik untuk melihat posisi';
      }
    }
  }
});

/* Remove hover marker when mouse leaves the chart canvas */
document.getElementById('elevChart').addEventListener('mouseleave', () => {
  if (hoverMarker) {
    map.removeLayer(hoverMarker);
    hoverMarker = null;
  }
  hoverInfo.textContent = 'Geser kursor di grafik untuk melihat posisi';
});

/* Handle GPX file download */
document.getElementById('btn-download-gpx').addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = '/gpx/ZeppWonosobo Lari trail.gpx';
  link.download = 'ZeppWonosobo Lari trail.gpx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

/* Check and apply embed mode styles */
if (window.location.search.includes('embed=true')) {
  document.body.classList.add('is-embedded');
}
</script>
</body>
</html>`;

// Write output
const outPath = path.join(__dirname, 'public', 'route-map.html');
fs.writeFileSync(outPath, html);
console.log(`✓ Built ${outPath} (${Math.round(html.length / 1024)} KB)`);
