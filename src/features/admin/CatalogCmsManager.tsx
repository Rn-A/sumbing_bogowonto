import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllPublicData, updateBookingPackage, updateSettings, uploadFile } from '../../services/api';
import { 
  ShoppingBag, Package, Tent, Home as HomeIcon, Shield, MapPin, Plus, Trash2, Edit3, Save, 
  Loader2, CheckCircle2, DollarSign, Image as ImageIcon, Sparkles, Upload
} from 'lucide-react';

export default function CatalogCmsManager() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'packages' | 'sewa' | 'homestay' | 'porter' | 'umkm'>('packages');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Fetch all public data (which includes bookingPackages, products, settings)
  const { data: publicRes, isLoading } = useQuery({
    queryKey: ['publicAllData'],
    queryFn: fetchAllPublicData,
  });

  const packages = publicRes?.data?.bookingPackages || [];
  const settings = publicRes?.data?.settings || {};
  const catalogCustomData = settings.catalog_cms_data || {
    sewaItems: [
      { id: 'sw-1', nama: 'Tenda Kapasitas 4 Orang', harga: 60000, satuan: '/hari', stok: 15, gambar: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80', deskripsi: 'Tenda double layer waterproof tahan angin badai.' },
      { id: 'sw-2', nama: 'Carrier 60L - 70L', harga: 35000, satuan: '/hari', stok: 20, gambar: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', deskripsi: 'Tas kerir nyaman dengan hipbelt tebal.' },
      { id: 'sw-3', nama: 'Sleeping Bag Warm -5°C', harga: 20000, satuan: '/hari', stok: 30, gambar: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80', deskripsi: 'Sleeping bag bulu hangat untuk suhu dingin puncak.' },
    ],
    homestayItems: [
      { id: 'hm-1', nama: 'Homestay Bogowonto Asri 1', harga: 150000, satuan: '/malam', kapasitas: '4-6 Orang', gambar: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80', deskripsi: 'Kamar luas dekat basecamp dengan kamar mandi dalam & air hangat.' },
      { id: 'hm-2', nama: 'Homestay Pendaki Sumbing 2', harga: 200000, satuan: '/malam', kapasitas: '6-8 Orang', gambar: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80', deskripsi: 'Satu rumah sewa full furnishing cocok untuk rombongan.' },
    ],
    porterItems: [
      { id: 'pr-1', nama: 'Jasa Porter Kategori Standar (Bawa 20kg)', harga: 400000, satuan: '/hari', gambar: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=80', deskripsi: 'Membawa barang perlengkapan pendaki maksimal 20 kg sampai ke camp zone.' },
      { id: 'pr-2', nama: 'Jasa Guide / Pemandu Jalur Resmi', harga: 500000, satuan: '/hari', gambar: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', deskripsi: 'Pemandu lokal berpengalaman dan bersertifikasi navigasi keselamatan.' },
    ],
    umkmItems: [
      { id: 'um-1', nama: 'Kopi Arabika Lereng Sumbing 250g', harga: 50000, satuan: '/pack', gambar: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80', deskripsi: 'Kopi racikan asli khas petani lokal Kalikajar Wonosobo.' },
      { id: 'um-2', nama: 'Kaos Merchandise Official Via Pencar', harga: 110000, satuan: '/pcs', gambar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', deskripsi: 'Kaos bahan cotton combed 30s berkualitas tinggi.' },
    ]
  };

  // State for Catalog Settings
  const [catalogData, setCatalogData] = useState<any>(catalogCustomData);

  // Package Modal State
  const [editingPkg, setEditingPkg] = useState<any | null>(null);
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);

  // Custom Item Modal State
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemCategory, setItemCategory] = useState<'sewa' | 'homestay' | 'porter' | 'umkm'>('sewa');

  const pkgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => updateBookingPackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      setSaveSuccessMsg('Paket pendakian berhasil diperbarui!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  });

  const settingsMutation = useMutation({
    mutationFn: (newCatalogData: any) => updateSettings({ catalog_cms_data: newCatalogData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicAllData'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccessMsg('Katalog produk berhasil diperbarui!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, onSuccess: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await uploadFile({ fileName: file.name, fileData: base64Data });
          if (res.success && res.url) {
            onSuccess(res.url);
          } else {
            onSuccess(base64Data);
          }
        } catch {
          onSuccess(base64Data);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg) return;
    pkgMutation.mutate({
      id: editingPkg.id,
      data: {
        nama_paket: editingPkg.nama_paket,
        harga_per_orang: parseFloat(editingPkg.harga_per_orang),
        deskripsi: editingPkg.deskripsi,
        is_popular: editingPkg.is_popular,
      }
    });
    setIsPkgModalOpen(false);
  };

  const handleSaveItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const listKey = `${itemCategory}Items`;
    let items = [...(catalogData[listKey] || [])];

    if (editingItem.id) {
      items = items.map(it => it.id === editingItem.id ? editingItem : it);
    } else {
      items.push({ ...editingItem, id: `${itemCategory.slice(0, 2)}-${Date.now()}` });
    }

    const updatedData = { ...catalogData, [listKey]: items };
    setCatalogData(updatedData);
    settingsMutation.mutate(updatedData);
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (category: string, id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini dari katalog?')) {
      const listKey = `${category}Items`;
      const items = (catalogData[listKey] || []).filter((it: any) => it.id !== id);
      const updatedData = { ...catalogData, [listKey]: items };
      setCatalogData(updatedData);
      settingsMutation.mutate(updatedData);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D5C3A] mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider">Memuat Katalog Produk...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* CMS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#F4F0E8] p-6 rounded-3xl border border-[#e7e5e4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#0D5C3A] text-xs font-black uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4" />
            <span>CMS Kelola Halaman Katalog</span>
          </div>
          <h1 className="text-2xl font-black text-[#050505] mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Editor Katalog & Paket Pendakian
          </h1>
          <p className="text-xs text-[#707070] mt-1">
            Kelola paket pendakian resmi, persewaan peralatan camping, homestay, porter & guide, serta UMKM produk lokal.
          </p>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700">
        {[
          { id: 'packages', label: '1. Paket Pendakian SIMAKSI', icon: Package },
          { id: 'sewa', label: '2. Sewa Peralatan Camping', icon: Tent },
          { id: 'homestay', label: '3. Homestay Basecamp', icon: HomeIcon },
          { id: 'porter', label: '4. Porter & Guide', icon: Shield },
          { id: 'umkm', label: '5. UMKM & Merchandise', icon: MapPin },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#0D5C3A] text-[#050505] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* 1. PAKET PENDAKIAN */}
      {/* ============================================================ */}
      {subTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#050505]">Paket Tiket & SIMAKSI Pendakian</h3>
              <p className="text-xs text-[#707070]">Kelola daftar paket pendakian dan tarif tiket per orang.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg: any) => (
              <div key={pkg.id} className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#0D5C3A] bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      {pkg.kode_paket || 'PAKET'}
                    </span>
                    {pkg.is_popular && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Populer
                      </span>
                    )}
                  </div>

                  <h4 className="font-display font-black text-lg text-[#050505]">{pkg.nama_paket}</h4>
                  <p className="text-xl font-black text-[#0D5C3A]">
                    Rp {pkg.harga_per_orang?.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">/ orang</span>
                  </p>
                  <p className="text-xs text-[#707070] line-clamp-3 leading-relaxed">{pkg.deskripsi}</p>
                </div>

                <div className="pt-3 border-t border-[#e7e5e4] flex justify-end">
                  <button
                    onClick={() => {
                      setEditingPkg(pkg);
                      setIsPkgModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Tarif & Paket</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2 - 5. CUSTOM PRODUCTS (SEWA, HOMESTAY, PORTER, UMKM) */}
      {/* ============================================================ */}
      {subTab !== 'packages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#050505] capitalize">Katalog {subTab}</h3>
              <p className="text-xs text-[#707070]">Kelola daftar items produk {subTab} yang dapat diakses oleh pendaki.</p>
            </div>

            <button
              onClick={() => {
                setItemCategory(subTab);
                setEditingItem({
                  nama: '',
                  harga: 50000,
                  satuan: subTab === 'homestay' ? '/malam' : subTab === 'sewa' ? '/hari' : '/pcs',
                  gambar: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80',
                  deskripsi: ''
                });
                setIsItemModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#050505] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-black transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah {subTab.toUpperCase()} Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {((catalogData[`${subTab}Items`] || [])).map((item: any, i: number) => (
              <div key={item.id || i} className="bg-white dark:bg-[#F4F0E8] rounded-3xl border border-[#e7e5e4] p-4 shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="relative h-36 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                    <img src={item.gambar} alt={item.nama} className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#050505]">{item.nama}</h4>
                    <p className="text-sm font-black text-[#0D5C3A] mt-0.5">
                      Rp {item.harga?.toLocaleString('id-ID')} <span className="text-[11px] font-normal text-slate-500">{item.satuan}</span>
                    </p>
                    <p className="text-xs text-[#707070] line-clamp-2 mt-1">{item.deskripsi}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e7e5e4]">
                  <button
                    onClick={() => {
                      setItemCategory(subTab);
                      setEditingItem(item);
                      setIsItemModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(subTab, item.id)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT PAKET */}
      {isPkgModalOpen && editingPkg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#F4F0E8] w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#050505]">Edit Paket Pendakian</h3>
              <button onClick={() => setIsPkgModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSavePackageSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Paket</label>
                <input
                  type="text"
                  required
                  value={editingPkg.nama_paket || ''}
                  onChange={(e) => setEditingPkg({ ...editingPkg, nama_paket: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Harga Per Orang (Rp)</label>
                <input
                  type="number"
                  required
                  value={editingPkg.harga_per_orang || 0}
                  onChange={(e) => setEditingPkg({ ...editingPkg, harga_per_orang: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold text-[#0D5C3A] rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Paket</label>
                <textarea
                  rows={3}
                  value={editingPkg.deskripsi || ''}
                  onChange={(e) => setEditingPkg({ ...editingPkg, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsPkgModalOpen(false)} className="px-4 py-2 text-xs text-slate-600">Batal</button>
                <button type="submit" className="px-5 py-2 bg-[#0D5C3A] text-white text-xs font-bold rounded-xl">Simpan Paket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CUSTOM ITEM */}
      {isItemModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#F4F0E8] w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#050505]">
                {editingItem.id ? 'Edit Item Katalog' : `Tambah Item ${itemCategory.toUpperCase()}`}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveItemSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk / Layanan</label>
                <input
                  type="text"
                  required
                  value={editingItem.nama || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingItem.harga || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, harga: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-bold text-[#0D5C3A] rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Teks</label>
                  <input
                    type="text"
                    required
                    value={editingItem.satuan || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, satuan: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    placeholder="e.g. /hari, /malam"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Foto Produk (Local Upload)</label>
                {editingItem.gambar && (
                  <div className="h-28 rounded-xl overflow-hidden mb-2 bg-slate-900 border border-slate-200">
                    <img src={editingItem.gambar} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, (url) => setEditingItem({ ...editingItem, gambar: url }))}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0D5C3A] file:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={editingItem.deskripsi || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-xs text-slate-600">Batal</button>
                <button type="submit" className="px-5 py-2 bg-[#0D5C3A] text-white text-xs font-bold rounded-xl">Simpan Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
