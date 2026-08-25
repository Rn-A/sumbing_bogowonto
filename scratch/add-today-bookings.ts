import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTodayBookings() {
  console.log('Seeding active bookings for today...');

  const pkg = await prisma.bookingPackage.findFirst();
  if (!pkg) {
    console.error('No booking package found!');
    return;
  }

  const todayStart = new Date();
  todayStart.setHours(8, 0, 0, 0);

  const tomorrowEnd = new Date();
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  tomorrowEnd.setHours(17, 0, 0, 0);

  // Group 1: 4 pendaki
  await prisma.booking.upsert({
    where: { kode_booking: 'SMB-TODAY-001' },
    update: {
      tanggal_naik: todayStart,
      tanggal_turun: tomorrowEnd,
      status: 'CheckedIn',
      jumlah_peserta: 4
    },
    create: {
      package_id: pkg.id,
      kode_booking: 'SMB-TODAY-001',
      nama_ketua: 'Rizky Pratama',
      email: 'rizky.today@gmail.com',
      no_hp: '081299887766',
      tanggal_naik: todayStart,
      tanggal_turun: tomorrowEnd,
      jumlah_peserta: 4,
      total_harga: pkg.harga_per_orang * 4,
      status: 'CheckedIn'
    }
  });

  // Group 2: 6 pendaki
  await prisma.booking.upsert({
    where: { kode_booking: 'SMB-TODAY-002' },
    update: {
      tanggal_naik: todayStart,
      tanggal_turun: tomorrowEnd,
      status: 'Paid',
      jumlah_peserta: 6
    },
    create: {
      package_id: pkg.id,
      kode_booking: 'SMB-TODAY-002',
      nama_ketua: 'Dewi Lestari',
      email: 'dewi.today@gmail.com',
      no_hp: '081377665544',
      tanggal_naik: todayStart,
      tanggal_turun: tomorrowEnd,
      jumlah_peserta: 6,
      total_harga: pkg.harga_per_orang * 6,
      status: 'Paid'
    }
  });

  // Group 3: 5 pendaki
  await prisma.booking.upsert({
    where: { kode_booking: 'SMB-TODAY-003' },
    update: {
      tanggal_naik: todayStart,
      tanggal_turun: tomorrowEnd,
      status: 'Paid',
      jumlah_peserta: 5
    },
    create: {
      package_id: pkg.id,
      kode_booking: 'SMB-TODAY-003',
      nama_ketua: 'Agus Setiawan',
      email: 'agus.today@gmail.com',
      no_hp: '081544332211',
      tanggal_naik: todayStart,
      tanggal_turun: tomorrowEnd,
      jumlah_peserta: 5,
      total_harga: pkg.harga_per_orang * 5,
      status: 'Paid'
    }
  });

  console.log('Successfully updated active bookings for today to Paid / CheckedIn');
}

addTodayBookings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
