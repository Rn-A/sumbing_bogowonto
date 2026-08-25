/**
 * gpx-to-json.js
 * ──────────────────────────────────────────────────────────────
 * Standalone Node.js script to parse a GPX file and produce a
 * JSON data object (embedded directly in the HTML template).
 *
 * Usage:
 *   node gpx-to-json.js <path-to-gpx> [segment-interval-km]
 *
 * Example:
 *   node gpx-to-json.js "./public/gpx/ZeppWonosobo Lari trail.gpx" 1
 *
 * Output: writes route_data.json next to the script.
 * ──────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

// ─── CONFIG ─────────────────────────────────────────────────
const SEGMENT_INTERVAL_KM = parseFloat(process.argv[3]) || 1.0;
const FINISH_SKIP_THRESHOLD_KM = 0.3; // skip a checkpoint if < 300 m from finish
const ROUTE_NAME = 'Pendakian Gunung Sumbing — Jalur Pencar (Bogowonto)';
const START_NAME = 'Basecamp Bogowonto';
const FINISH_NAME = 'Puncak Sumbing (Rajawali)';

// ─── HAVERSINE ──────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in metres
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // metres
}

// ─── PARSE GPX XML (simple regex, no deps) ──────────────────
function parseGpx(xml) {
  const points = [];
  const re = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>\s*<ele>([^<]+)<\/ele>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    points.push({
      lat: parseFloat(m[1]),
      lon: parseFloat(m[2]),
      ele: parseFloat(m[3]),
    });
  }
  return points;
}

// ─── COMPUTE TRACK WITH CUMULATIVE DISTANCE ─────────────────
function computeTrack(rawPoints) {
  let cumDist = 0;
  let elevGain = 0;
  let elevMin = Infinity;
  let elevMax = -Infinity;

  const track = rawPoints.map((pt, i) => {
    if (i > 0) {
      const prev = rawPoints[i - 1];
      cumDist += haversine(prev.lat, prev.lon, pt.lat, pt.lon);
      const diff = pt.ele - prev.ele;
      if (diff > 0) elevGain += diff;
    }
    if (pt.ele < elevMin) elevMin = pt.ele;
    if (pt.ele > elevMax) elevMax = pt.ele;
    return [pt.lat, pt.lon, Math.round(pt.ele * 100) / 100, Math.round((cumDist / 1000) * 1000) / 1000];
  });

  return {
    track,
    totalKm: Math.round((cumDist / 1000) * 100) / 100,
    elevMin: Math.round(elevMin),
    elevMax: Math.round(elevMax),
    elevGain: Math.round(elevGain),
  };
}

// ─── AUTO-GENERATE SEGMENTS (checkpoints every N km) ────────
function generateSegments(track, totalKm, intervalKm) {
  const segments = [];

  // Start point
  const first = track[0];
  segments.push({
    name: START_NAME,
    km: 0,
    lat: first[0],
    lon: first[1],
    ele: first[2],
  });

  // Intermediate checkpoints
  let nextKm = intervalKm;
  let posNum = 1;
  while (nextKm < totalKm) {
    // Skip if remainder to finish is less than threshold
    if (totalKm - nextKm < FINISH_SKIP_THRESHOLD_KM) break;

    // Find closest track point to this cumulative distance
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < track.length; i++) {
      const diff = Math.abs(track[i][3] - nextKm);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    const pt = track[bestIdx];
    segments.push({
      name: `Pos ${posNum}`,
      km: Math.round(nextKm * 100) / 100,
      lat: pt[0],
      lon: pt[1],
      ele: pt[2],
    });
    posNum++;
    nextKm += intervalKm;
  }

  // Finish / summit point
  const last = track[track.length - 1];
  segments.push({
    name: FINISH_NAME,
    km: totalKm,
    lat: last[0],
    lon: last[1],
    ele: last[2],
  });

  return segments;
}

// ─── MAIN ───────────────────────────────────────────────────
const gpxPath = process.argv[2];
if (!gpxPath) {
  console.error('Usage: node gpx-to-json.js <path-to-gpx> [segment-interval-km]');
  process.exit(1);
}

const xml = fs.readFileSync(gpxPath, 'utf-8');
const rawPoints = parseGpx(xml);
console.log(`Parsed ${rawPoints.length} trackpoints from GPX.`);

const { track, totalKm, elevMin, elevMax, elevGain } = computeTrack(rawPoints);
const segments = generateSegments(track, totalKm, SEGMENT_INTERVAL_KM);

const data = {
  routeName: ROUTE_NAME,
  startName: START_NAME,
  finishName: FINISH_NAME,
  totalKm,
  elevMin,
  elevMax,
  elevGain,
  segmentCount: segments.length,
  segments,
  track, // [[lat, lon, ele, cumKm], ...]
};

const outPath = path.join(path.dirname(gpxPath), '..', '..', 'route_data.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`✓ Wrote route_data.json (${segments.length} segments, ${track.length} trackpoints)`);
console.log(`  Total: ${totalKm} km | Gain: +${elevGain} m | Elev: ${elevMin}–${elevMax} m`);
// Also print the JSON to stdout for convenience
console.log('\n--- JSON preview (segments only) ---');
console.log(JSON.stringify(segments, null, 2));
