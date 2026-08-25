import { motion } from 'motion/react';
import { MapPin, Mail } from 'lucide-react';

interface AboutMuncakSectionProps {
  badge?: string;
  title?: string;
  desc1?: React.ReactNode | string;
  desc2?: string;
  developerText?: string;
  contactEmail?: string;
  images?: {
    tall: string;
    topRight: string;
    bottomRight: string;
  };
}

export default function AboutMuncakSection({
  badge = 'TENTANG MUNCAK.ID',
  title = 'Riset publik, untuk pendaki publik.',
  desc1 = 'muncak.id merupakan aplikasi yang dirancang untuk membantu pendaki dengan memberikan panduan mendaki gunung maupun pegunungan yang komprehensif dan terstruktur, sehingga setiap langkah perjalanan dapat direncanakan dengan cermat.',
  desc2 = 'Selain itu, aplikasi ini menyajikan informasi terintegrasi bagi para pendaki yang menginginkan kemudahan dalam merencanakan pendakian gunung dan penjelajahan pegunungan di Indonesia dan luar negeri. Dengan akses ke berbagai informasi penting, pengguna dapat lebih siap dan percaya diri dalam menghadapi tantangan alam.',
  developerText = 'Pusat Pengembangan Teknologi Petualangan Tropis. Laboratorium Teknik Industri, Teknik Geologi dan Informatika Universitas Jenderal Soedirman.',
  contactEmail = 'laboratoriumindustri@unsoed.ac.id',
  images = {
    tall: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
    topRight: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    bottomRight: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  },
}: AboutMuncakSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-[#FAF8F5] dark:bg-[#FAF8F5] overflow-hidden">
      <div className="container-app">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: 3 Images Mosaic */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="grid grid-cols-12 gap-4 items-stretch">
              
              {/* Tall Image (Left) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="col-span-7 h-[360px] sm:h-[440px] md:h-[480px] rounded-3xl overflow-hidden shadow-sm group"
              >
                <img
                  src={images.tall}
                  alt="Pendaki di Jalur Pegunungan"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              </motion.div>

              {/* Two Stacked Images (Right) */}
              <div className="col-span-5 flex flex-col gap-4 justify-between h-[360px] sm:h-[440px] md:h-[480px]">
                <motion.div
                  initial={{ opacity: 0, y: -15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="flex-1 rounded-3xl overflow-hidden shadow-sm group"
                >
                  <img
                    src={images.topRight}
                    alt="Pemandangan Puncak Gunung"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex-1 rounded-3xl overflow-hidden shadow-sm group"
                >
                  <img
                    src={images.bottomRight}
                    alt="Lanskap Perbukitan dan Pesisir"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                </motion.div>
              </div>

            </div>
          </div>

          {/* Right Column: Text Content & Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center"
          >
            {/* Overline Badge */}
            <span className="text-[#D94826] font-bold text-xs sm:text-[13px] tracking-widest uppercase mb-3 inline-block">
              {badge}
            </span>

            {/* Big Serif Heading */}
            <h2 
              className="text-[#0f172a] text-3xl sm:text-4xl lg:text-[44px] font-black leading-[1.15] tracking-tight mb-6"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
            >
              {title}
            </h2>

            {/* Body Paragraphs */}
            <div className="space-y-4 text-[#475569] text-sm sm:text-[15px] leading-relaxed mb-8">
              <p>{desc1}</p>
              <p>{desc2}</p>
            </div>

            {/* Bottom 2 Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Pengembang */}
              <div className="bg-white/80 dark:bg-white/90 rounded-2xl p-4 border border-[#e2e8f0] shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-[#D94826]/10 flex items-center justify-center text-[#D94826]">
                    <MapPin className="w-3.5 h-3.5 fill-[#D94826] text-[#D94826]" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#475569]">
                    PENGEMBANG
                  </span>
                </div>
                <p className="text-xs text-[#334155] leading-snug">
                  {developerText}
                </p>
              </div>

              {/* Card 2: Kontak */}
              <div className="bg-white/80 dark:bg-white/90 rounded-2xl p-4 border border-[#e2e8f0] shadow-2xs flex flex-col justify-start">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-[#D94826]/10 flex items-center justify-center text-[#D94826]">
                    <Mail className="w-3.5 h-3.5 fill-[#D94826] text-white" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#475569]">
                    KONTAK
                  </span>
                </div>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-xs text-[#334155] hover:text-[#D94826] transition-colors break-all leading-snug block font-medium"
                >
                  {contactEmail}
                </a>
              </div>

            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
}
