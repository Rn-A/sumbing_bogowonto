/**
 * segmentUtils.ts
 * 
 * Utility untuk menghasilkan data segmentasi rute pendakian secara otomatis
 * dari data checkpoint dan track GPX. Setiap segmen adalah ruas antara dua
 * checkpoint berurutan.
 * 
 * Fungsi ini bersifat generik dan dapat dipanggil ulang untuk file GPX / 
 * rute lain — segmentasi otomatis ter-generate dari checkpoint yang ada.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Difficulty thresholds — easily configurable constants
// ──────────────────────────────────────────────────────────────────────────────
const GRADIENT_EASY = 20;   // < 20% → Landai (hijau)
const GRADIENT_MEDIUM = 35; // 20–35% → Sedang (oranye)
                             // > 35% → Terjal (merah)

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
export interface Checkpoint {
  name: string;
  km: number;
  lat: number;
  lon: number;
  ele: number;
}

/** Raw track point from route_data.json: [lat, lon, elevation, distanceKm] */
export type RawTrackPoint = [number, number, number, number];

export type Difficulty = 'Landai' | 'Sedang' | 'Terjal';

export interface SegmentData {
  index: number;
  label: string;
  from_checkpoint: string;
  to_checkpoint: string;
  from_km: number;
  to_km: number;
  distance_km: number;
  elevation_start_m: number;
  elevation_end_m: number;
  elevation_gain_m: number;
  elevation_loss_m: number;
  avg_gradient_pct: number;
  min_elevation_m: number;
  max_elevation_m: number;
  track_index_start: number;
  track_index_end: number;
  difficulty: Difficulty;
  difficulty_color: string;
  /** Estimated travel time in minutes using modified Naismith's Rule */
  estimated_time_min: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Find the index of the closest track point to a given lat/lon coordinate.
 * Uses squared Euclidean distance (no sqrt needed for comparison).
 */
function findClosestTrackIndex(
  track: RawTrackPoint[],
  targetLat: number,
  targetLon: number,
): number {
  let minDist = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < track.length; i++) {
    const [lat, lon] = track[i];
    const d = (lat - targetLat) ** 2 + (lon - targetLon) ** 2;
    if (d < minDist) {
      minDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Classify difficulty based on average gradient percentage.
 */
function classifyDifficulty(gradientPct: number): {
  difficulty: Difficulty;
  color: string;
} {
  if (gradientPct < GRADIENT_EASY) {
    return { difficulty: 'Landai', color: 'emerald' };
  } else if (gradientPct < GRADIENT_MEDIUM) {
    return { difficulty: 'Sedang', color: 'amber' };
  } else {
    return { difficulty: 'Terjal', color: 'rose' };
  }
}

/**
 * Estimate travel time using modified Naismith's Rule.
 * 
 * Formula: waktu_jam = (jarak_km / 4) + (elevation_gain_m / 300)
 * 
 * This is a generic formula without personal parameters (body weight, load,
 * speed). It can be extended/personalized in future iterations by adding
 * user input multipliers.
 * 
 * @returns estimated time in minutes
 */
function estimateTimeNaismith(distanceKm: number, elevationGainM: number): number {
  const hours = (distanceKm / 4) + (elevationGainM / 300);
  return Math.round(hours * 60);
}

/**
 * Format minutes into "X jam Y menit" string.
 */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} menit`;
  if (m === 0) return `${h} jam`;
  return `${h} jam ${m} menit`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main generator function
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Generate an array of SegmentData from checkpoints and GPX track points.
 * Each segment is the section between two consecutive checkpoints.
 * 
 * @param checkpoints - Array of checkpoint objects (name, km, lat, lon, ele)
 * @param track - Raw GPX track points: [lat, lon, elevation, distanceKm][]
 * @returns Array of SegmentData, one per consecutive checkpoint pair
 */
export function generateSegments(
  checkpoints: Checkpoint[],
  track: RawTrackPoint[],
): SegmentData[] {
  if (checkpoints.length < 2 || track.length < 2) return [];

  const segments: SegmentData[] = [];

  for (let i = 0; i < checkpoints.length - 1; i++) {
    const from = checkpoints[i];
    const to = checkpoints[i + 1];

    // Find closest track indices for start and end checkpoint
    const idxStart = findClosestTrackIndex(track, from.lat, from.lon);
    const idxEnd = findClosestTrackIndex(track, to.lat, to.lon);

    // Ensure correct ordering
    const startIdx = Math.min(idxStart, idxEnd);
    const endIdx = Math.max(idxStart, idxEnd);

    // Calculate elevation metrics by iterating through track points
    let elevGain = 0;
    let elevLoss = 0;
    let minElev = track[startIdx][2];
    let maxElev = track[startIdx][2];

    for (let j = startIdx; j <= endIdx; j++) {
      const elev = track[j][2];
      if (elev < minElev) minElev = elev;
      if (elev > maxElev) maxElev = elev;

      if (j > startIdx) {
        const diff = elev - track[j - 1][2];
        if (diff > 0) elevGain += diff;
        else elevLoss += Math.abs(diff);
      }
    }

    const elevStart = Math.round(track[startIdx][2]);
    const elevEnd = Math.round(track[endIdx][2]);
    const distKm = parseFloat((track[endIdx][3] - track[startIdx][3]).toFixed(3));
    const distKmSafe = Math.max(distKm, 0.001); // prevent division by zero

    const avgGradient = parseFloat(
      (Math.abs(elevEnd - elevStart) / (distKmSafe * 1000) * 100).toFixed(1)
    );

    const { difficulty, color } = classifyDifficulty(avgGradient);

    segments.push({
      index: i,
      label: `${from.name} → ${to.name}`,
      from_checkpoint: from.name,
      to_checkpoint: to.name,
      from_km: parseFloat(track[startIdx][3].toFixed(3)),
      to_km: parseFloat(track[endIdx][3].toFixed(3)),
      distance_km: parseFloat(distKmSafe.toFixed(3)),
      elevation_start_m: elevStart,
      elevation_end_m: elevEnd,
      elevation_gain_m: Math.round(elevGain),
      elevation_loss_m: Math.round(elevLoss),
      avg_gradient_pct: avgGradient,
      min_elevation_m: Math.round(minElev),
      max_elevation_m: Math.round(maxElev),
      track_index_start: startIdx,
      track_index_end: endIdx,
      difficulty,
      difficulty_color: color,
      estimated_time_min: estimateTimeNaismith(distKmSafe, elevGain),
    });
  }

  return segments;
}

/**
 * Calculate total route statistics from all segments.
 */
export function getTotalStats(segments: SegmentData[]) {
  const totalDistance = segments.reduce((sum, s) => sum + s.distance_km, 0);
  const totalGain = segments.reduce((sum, s) => sum + s.elevation_gain_m, 0);
  const totalLoss = segments.reduce((sum, s) => sum + s.elevation_loss_m, 0);
  const totalTimeMin = segments.reduce((sum, s) => sum + s.estimated_time_min, 0);
  const elevStart = segments.length > 0 ? segments[0].elevation_start_m : 0;
  const elevEnd = segments.length > 0 ? segments[segments.length - 1].elevation_end_m : 0;

  return {
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    totalGain,
    totalLoss,
    totalTimeMin,
    elevStart,
    elevEnd,
  };
}
