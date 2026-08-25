import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBookings() {
  const allBookings = await prisma.booking.findMany({
    include: { members: true, payment: true }
  });
  console.log('Total bookings in DB:', allBookings.length);
  allBookings.forEach((b, i) => {
    console.log(`Booking #${i + 1}: code=${b.kode_booking}, status=${b.status}, naik=${b.tanggal_naik}, turun=${b.tanggal_turun}, participants=${b.jumlah_peserta}, members=${b.members?.length}`);
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  console.log('Today range:', todayStart.toISOString(), 'to', todayEnd.toISOString());

  const activeToday = await prisma.booking.findMany({
    where: {
      tanggal_naik: { lte: todayEnd },
      tanggal_turun: { gte: todayStart }
    }
  });
  console.log('Active bookings in today range:', activeToday.length);
  
  // Total hikers from all valid bookings
  const totalHikersAllTime = allBookings
    .filter(b => b.status === 'Confirmed' || b.status === 'Paid' || b.status === 'CheckedIn' || b.status === 'CheckedOut')
    .reduce((sum, b) => sum + (b.jumlah_peserta || 1), 0);
  console.log('Total valid hikers all time in DB:', totalHikersAllTime);
}

checkBookings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
