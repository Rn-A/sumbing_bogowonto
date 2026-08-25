import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const routes = await prisma.route.findMany({
    include: {
      gpx_files: true
    }
  });

  console.log("=== DB DUMP ===");
  for (const r of routes) {
    console.log(`Route: ${r.nama_jalur} (ID: ${r.id})`);
    for (const g of r.gpx_files) {
      console.log(`  GPX: id=${g.id}, nama_file=${g.nama_file}, file_url=${g.file_url}, created_at=${g.created_at}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
