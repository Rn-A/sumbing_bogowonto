import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const routes = await prisma.route.findMany({
    include: {
      posts: true,
      gpx_files: true,
      segments: true,
    }
  });

  console.log('--- ROUTES ---');
  for (const r of routes) {
    console.log(`Route: ${r.nama_jalur} (ID: ${r.id})`);
    console.log(`Status: ${r.status}, Jarak: ${r.total_jarak_km}km, Elevasi: ${r.elevasi_start} - ${r.elevasi_puncak}`);
    console.log(`Map Center: Lat ${r.map_center_lat}, Lng ${r.map_center_lng}, Zoom ${r.map_zoom}`);
    
    console.log('--- POSTS ---');
    for (const p of r.posts) {
      console.log(`  Post: ${p.nama_pos} (Urutan: ${p.urutan})`);
      console.log(`  Elevasi: ${p.elevasi} mdpl, Lat: ${p.latitude}, Lng: ${p.longitude}`);
    }

    console.log('--- GPX FILES ---');
    for (const g of r.gpx_files) {
      console.log(`  GPX: ${g.nama_file} -> URL: ${g.file_url}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
