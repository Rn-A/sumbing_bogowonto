import routeData from '../route_data.json';

const SEGMENT_POINTS = routeData.segments.map(seg => ({
  name: seg.name,
  lat: seg.lat,
  lng: seg.lon,
  elevasi: Math.round(seg.ele)
}));

const gpxCoords = routeData.track.map((t: any) => [t[1], t[0]] as [number, number]);

const findClosestGpxIndex = (targetLat: number, targetLng: number) => {
  let minDistance = Infinity;
  let closestIndex = -1;
  for (let i = 0; i < gpxCoords.length; i++) {
    const [lon, lat] = gpxCoords[i];
    const dist = Math.pow(lat - targetLat, 2) + Math.pow(lon - targetLng, 2);
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }
  return closestIndex;
};

console.log('SEGMENT_POINTS length:', SEGMENT_POINTS.length);
console.log('gpxCoords length:', gpxCoords.length);

for (let segmentNum = 1; segmentNum < SEGMENT_POINTS.length; segmentNum++) {
  const fromPoint = SEGMENT_POINTS[segmentNum - 1];
  const toPoint = SEGMENT_POINTS[segmentNum];
  
  const fromIdx = findClosestGpxIndex(fromPoint.lat, fromPoint.lng);
  const toIdx = findClosestGpxIndex(toPoint.lat, toPoint.lng);
  
  console.log(`Segment ${segmentNum} (${fromPoint.name} -> ${toPoint.name}):`);
  console.log(`  fromIdx: ${fromIdx}, coordinates: ${gpxCoords[fromIdx]}`);
  console.log(`  toIdx: ${toIdx}, coordinates: ${gpxCoords[toIdx]}`);
  
  const startIdx = Math.min(fromIdx, toIdx);
  const endIdx = Math.max(fromIdx, toIdx);
  const activeCoordinates = gpxCoords.slice(startIdx, endIdx + 1);
  console.log(`  activeCoordinates length: ${activeCoordinates.length}`);
}
