import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Ambil rute Kalikajar (Wonosobo)
  const route = await prisma.route.findFirst({
    where: { slug: 'jalur-kalikajar' }
  });

  if (!route) {
    console.error("Route Jalur Kalikajar not found");
    return;
  }

  console.log(`Updating route details for: ${route.nama_jalur}`);
  await prisma.route.update({
    where: { id: route.id },
    data: {
      total_jarak_km: 6.35,
      elevasi_start: 1450,
      elevasi_puncak: 3269,
      map_center_lat: -7.385,
      map_center_lng: 110.05,
      map_zoom: 13
    }
  });

  // 2. Ambil atau buat data GPX untuk rute ini
  const gpx = await prisma.routeGpx.findFirst({
    where: { route_id: route.id }
  });

  if (gpx) {
    console.log(`Updating GPX record with ID: ${gpx.id}`);
    await prisma.routeGpx.update({
      where: { id: gpx.id },
      data: {
        nama_file: 'ZeppWonosobo Lari trail.gpx',
        file_url: '/gpx/ZeppWonosobo Lari trail.gpx',
        total_jarak_km: 6.35,
        elevasi_gain: 1820,
        elevasi_min: 1450,
        elevasi_max: 3269,
        total_waypoints: 2789,
        deskripsi: 'Track resmi GPX Wonosobo Lari Trail'
      }
    });
  } else {
    console.log(`Creating new GPX record for route: ${route.id}`);
    await prisma.routeGpx.create({
      data: {
        route_id: route.id,
        nama_file: 'ZeppWonosobo Lari trail.gpx',
        file_url: '/gpx/ZeppWonosobo Lari trail.gpx',
        total_jarak_km: 6.35,
        elevasi_gain: 1820,
        elevasi_min: 1450,
        elevasi_max: 3269,
        total_waypoints: 2789,
        deskripsi: 'Track resmi GPX Wonosobo Lari Trail'
      }
    });
  }

  // 3. Update segment data in the database if necessary to align with the GPX
  console.log("GPX database update completed!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
