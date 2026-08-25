import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useMutation } from '@tanstack/react-query';
import { submitContact } from '../../services/api';
import L from 'leaflet';
import { MapPin, Phone, Mail, Clock, Send, Instagram, Facebook, Youtube, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

export default function KontakPage() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [subjek, setSubjek] = useState('');
  const [pesan, setPesan] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  // Initialize Map — Basecamp Bogowonto coordinates
  useEffect(() => {
    if (!mapRef.current) return;

    const lat = -7.399937;
    const lng = 110.032969;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        scrollWheelZoom: false,
      }).setView([lat, lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstance.current);

      const markerHtml = `
        <div class="w-8 h-8 rounded-full bg-[#0D5C3A] border-2 border-white flex items-center justify-center text-white shadow-lg animate-bounce">
          🏔️
        </div>
      `;
      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker-bc',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([lat, lng], { icon: customIcon })
        .bindPopup(`
          <div class="p-1 font-sans">
            <p class="font-bold text-xs text-slate-800 m-0">Basecamp Bogowonto</p>
            <p class="text-[10px] text-slate-500 mt-1 m-0">Sumbing Via Pencar</p>
            <p class="text-[10px] text-slate-500 m-0">Pencar Atas, Kwadungan, Kalikajar</p>
          </div>
        `)
        .addTo(mapInstance.current);
    }
  }, []);

  const contactMutation = useMutation({
    mutationFn: submitContact,
    onSuccess: (res) => {
      setFormMessage(res.message || 'Pesan Anda berhasil dikirim!');
      setNama('');
      setEmail('');
      setSubjek('');
      setPesan('');
    },
    onError: (err: any) => {
      setFormMessage(err.response?.data?.error || 'Gagal mengirim pesan.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !email || !pesan) {
      setFormMessage('Nama, email, dan pesan wajib diisi.');
      return;
    }
    contactMutation.mutate({ nama, email, subjek, pesan });
  };

  return (
    <div className="min-h-screen pt-[var(--header-height)] bg-[#FAF8F5] dark:bg-[#FAF8F5]">
      {/* Hero */}
      <section className="relative py-16 bg-sky-gradient overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container-app relative z-10 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[#0D5C3A] text-xs font-bold uppercase tracking-widest mb-3">Hubungi Kami</p>
            <h1 className="font-display font-black text-4xl sm:text-5xl mb-4">Kontak Bogowonto</h1>
            <p className="text-slate-200 text-sm max-w-xl mx-auto">
              Ada pertanyaan atau butuh informasi tentang pendakian Via Pencar? Jangan ragu untuk menghubungi pengelola basecamp kami.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-app">
          <div className="grid lg:grid-cols-5 gap-8">
            
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-[#FAF8F5] dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] dark:border-[#e7e5e4] p-8 shadow-lg">
                <h2 className="font-display font-black text-xl text-[#050505] dark:text-[#050505] mb-6">Kirim Pesan</h2>
                
                {contactMutation.isSuccess ? (
                  <div className="py-12 text-center space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-[#0D5C3A] mx-auto" />
                    <h3 className="font-display font-bold text-lg text-[#050505] dark:text-[#050505]">Pesan Terkirim!</h3>
                    <p className="text-xs text-[#292524] dark:text-[#292524] max-w-xs mx-auto">
                      Terima kasih telah menghubungi Basecamp Bogowonto. Kami akan merespon pesan Anda secepatnya.
                    </p>
                    <button 
                      onClick={() => contactMutation.reset()}
                      className="px-6 py-2.5 bg-[#F4F0E8] dark:bg-[#EBE7DF] hover:bg-[#EBE7DF] text-[#292524] dark:text-[#292524] text-xs font-bold rounded-xl transition-colors"
                    >
                      Kirim Pesan Baru
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#707070] mb-1.5 uppercase">Nama Lengkap *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Nama Anda" 
                          value={nama}
                          onChange={(e) => setNama(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#F4F0E8] dark:bg-[#EBE7DF] border border-[#e7e5e4] dark:border-[#e7e5e4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/30" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#707070] mb-1.5 uppercase">Email *</label>
                        <input 
                          type="email" 
                          required
                          placeholder="email@domain.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#F4F0E8] dark:bg-[#EBE7DF] border border-[#e7e5e4] dark:border-[#e7e5e4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/30" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707070] mb-1.5 uppercase">Subjek</label>
                      <input 
                        type="text" 
                        placeholder="Subjek pesan" 
                        value={subjek}
                        onChange={(e) => setSubjek(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F4F0E8] dark:bg-[#EBE7DF] border border-[#e7e5e4] dark:border-[#e7e5e4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/30" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#707070] mb-1.5 uppercase">Pesan *</label>
                      <textarea 
                        required
                        rows={5} 
                        placeholder="Tulis pertanyaan atau tanggapan Anda..." 
                        value={pesan}
                        onChange={(e) => setPesan(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F4F0E8] dark:bg-[#EBE7DF] border border-[#e7e5e4] dark:border-[#e7e5e4] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/30 resize-none" 
                      />
                    </div>

                    {formMessage && (
                      <p className="text-xs text-red-500 font-semibold">{formMessage}</p>
                    )}

                    <button 
                      type="submit" 
                      disabled={contactMutation.isPending}
                      className="group flex items-center justify-center gap-2 px-6 py-3 bg-[#0D5C3A] text-white text-xs font-bold rounded-xl hover:bg-[#0D5C3A] shadow-lg shadow-[#0D5C3A]/20 transition-all disabled:opacity-50"
                    >
                      {contactMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Kirim Pesan
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Info & Map */}
            <div className="lg:col-span-2 space-y-5">
              {[
                { icon: MapPin, label: 'Alamat Basecamp', value: 'Pencar Atas, Kwadungan, Kec. Kalikajar, Kab. Wonosobo, Jawa Tengah 56372', href: 'https://maps.app.goo.gl/6LkFqT31VEttVeym6' },
                { icon: Instagram, label: 'Instagram Resmi', value: '@sumbing_viapencar', href: 'https://www.instagram.com/sumbing_viapencar' },
                { icon: Mail, label: 'Email', value: 'basecampbogowonto@gmail.com', href: 'mailto:basecampbogowonto@gmail.com' },
                { icon: Clock, label: 'Jam Registrasi', value: 'Setiap hari, 08:00 – 04:00 WIB' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="p-5 bg-[#FAF8F5] dark:bg-[#F4F0E8] rounded-2xl border border-[#e7e5e4] dark:border-[#e7e5e4] shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#0D5C3A]/40 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#0D5C3A] dark:text-[#0D5C3A]" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#707070] mb-1">{item.label}</p>
                        {'href' in item && item.href ? (
                          <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#050505] dark:text-[#050505] leading-normal hover:text-[#0D5C3A] transition-colors">
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-xs font-bold text-[#050505] dark:text-[#050505] leading-normal">{item.value}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Google Maps Link */}
              <a 
                href="https://maps.app.goo.gl/6LkFqT31VEttVeym6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Buka di Google Maps
              </a>

              {/* Map Container */}
              <div className="bg-[#F4F0E8] dark:bg-[#F4F0E8] rounded-2xl p-2 border border-[#e7e5e4] dark:border-[#e7e5e4] h-64 relative overflow-hidden">
                <div ref={mapRef} className="w-full h-full rounded-xl" />
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
