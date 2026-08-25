const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/Rendra Aji Syaputra/Downloads/bc_sumbing/src/features/profile/ProfilePage.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Replace corrupted encoding characters across the entire file
code = code.replace(/Â·/g, '·');
code = code.replace(/â†’/g, '→');
code = code.replace(/â•â•â•â•â•â•â•â•â•/g, '══════════');
code = code.replace(/â”€â”€â”€/g, '───');
code = code.replace(/â”€â”€/g, '──');
code = code.replace(/â†/g, '');

// 2. Define the new drawRouteAndMarkers code with trail line styling & muncak.id markers
const newDrawFunction = `    const drawRouteAndMarkers = () => {
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

        const routeCoordinates = gpxCoords.length > 0 ? gpxCoords : SEGMENT_POINTS.map(p => [p.lng, p.lat] as [number, number]);

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
            el.innerHTML = \`
              <div class="w-7 h-7 rounded-full \${bgColor} border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md cursor-pointer">
                \${markerLabel}
              </div>
            \`;

            const popup = new maplibregl.Popup({ offset: 25 }).setHTML(\`
              <div class="p-1 font-sans text-slate-800">
                <p class="font-bold text-xs m-0">\${post.nama_pos}</p>
                <p class="text-[10px] text-slate-500 m-0.5">Ketinggian: \${post.elevasi} mdpl</p>
                <p class="text-[10px] text-slate-650 mt-1 leading-normal">\${post.deskripsi || ''}</p>
              </div>
            \`);

            new maplibregl.Marker({ element: el })
              .setLngLat([lng, lat])
              .setPopup(popup)
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

            if (map.getLayer('osm-tiles') && map.getLayer('route')) {
              map.moveLayer('osm-tiles', 'route');
            }

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

          // 2. Extract and draw active segment coordinates from GPX track
          let activeCoords: [number, number][] = [];
          if (gpxCoords.length > 0) {
            const startIdx = seg.track_index_start;
            const endIdx = seg.track_index_end;
            activeCoords = gpxCoords.slice(startIdx, endIdx + 1);
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

          if (map.getLayer('osm-tiles') && map.getLayer('route-active')) {
            map.moveLayer('osm-tiles', 'route-active');
          }
          if (map.getLayer('route-overview') && map.getLayer('route-active')) {
            map.moveLayer('route-overview', 'route-active');
          }
          if (map.getLayer('route-active') && map.getLayer('route-active-dash')) {
            map.moveLayer('route-active', 'route-active-dash');
          }

          // 3. Draw markers for segment endpoints (muncak.id style: S for Basecamp, 1, 2, 3 for checkpoints)
          const endpointMarkers = [
            {
              point: fromPoint,
              label: seg.index === 0 ? 'S' : String(seg.index),
              isStart: seg.index === 0
            },
            {
              point: toPoint,
              label: String(seg.index + 1),
              isStart: false
            }
          ];

          endpointMarkers.forEach((item) => {
            const el = document.createElement('div');
            el.className = 'custom-maplibre-marker';
            const bgColor = item.isStart ? 'bg-[#16a34a]' : 'bg-[#ea580c]';
            el.innerHTML = \`
              <div class="w-8 h-8 rounded-full \${bgColor} border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-lg cursor-pointer hover:scale-110 transition-all duration-300">
                \${item.label}
              </div>
            \`;

            const popup = new maplibregl.Popup({ offset: 25 }).setHTML(\`
              <div class="p-1.5 font-sans text-slate-800">
                <p class="font-bold text-xs m-0">\${item.point.name}</p>
                <p class="text-[10px] text-slate-500 m-0.5">Ketinggian: \${item.point.elevasi} mdpl</p>
              </div>
            \`);

            new maplibregl.Marker({ element: el })
              .setLngLat([item.point.lng, item.point.lat])
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
    };`;

const startFuncStr = 'const drawRouteAndMarkers = () => {';
const endFuncStr = '}, [activeRoute, activeSegmentIndex, gpxCoords, mapStyle]);';

const startIdx = code.indexOf(startFuncStr);
const endIdx = code.indexOf(endFuncStr);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + newDrawFunction.trim() + '\n  ' + code.substring(endIdx);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully updated ProfilePage.tsx');
} else {
  console.error('Could not find function bounds in ProfilePage.tsx');
}
