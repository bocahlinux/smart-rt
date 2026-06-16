import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { DashboardPage } from '@/components/auth/DashboardPage'
import { LoginPage } from '@/components/auth/LoginPage'
import { PermissionsPage } from '@/components/auth/PermissionsPage'
import { ProfilePage } from '@/components/auth/ProfilePage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RegisterPage } from '@/components/auth/RegisterPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { ForumListPage } from '@/components/forum/ForumListPage'
import { ThreadDetailPage } from '@/components/forum/ThreadDetailPage'
import { ThreadFormPage } from '@/components/forum/ThreadFormPage'
import { PengaduanDetailPage } from '@/components/pengaduan/PengaduanDetailPage'
import { PengaduanFormPage } from '@/components/pengaduan/PengaduanFormPage'
import { PengaduanListPage } from '@/components/pengaduan/PengaduanListPage'
import { KegiatanDetailPage } from '@/components/kegiatan/KegiatanDetailPage'
import { KegiatanFormPage } from '@/components/kegiatan/KegiatanFormPage'
import { KegiatanListPage } from '@/components/kegiatan/KegiatanListPage'
import { PollingDetailPage } from '@/components/polling/PollingDetailPage'
import { PollingFormPage } from '@/components/polling/PollingFormPage'
import { PollingListPage } from '@/components/polling/PollingListPage'
import { IuranKonfirmasiPage } from '@/components/keuangan/IuranKonfirmasiPage'
import { IuranSettingPage } from '@/components/keuangan/IuranSettingPage'
import { IuranUploadPage } from '@/components/keuangan/IuranUploadPage'
import { KeuanganBukuKasPage } from '@/components/keuangan/KeuanganBukuKasPage'
import { KeuanganDashboardPage } from '@/components/keuangan/KeuanganDashboardPage'
import { KeuanganListPage } from '@/components/keuangan/KeuanganListPage'
import { LaporanPage } from '@/components/keuangan/LaporanPage'
import { TransaksiFormPage } from '@/components/keuangan/TransaksiFormPage'
import { PengumumanDetailPage } from '@/components/pengumuman/PengumumanDetailPage'
import { PengumumanFormPage } from '@/components/pengumuman/PengumumanFormPage'
import { PengumumanListPage } from '@/components/pengumuman/PengumumanListPage'
import { UserListPage } from '@/components/users/UserListPage'
import { WargaListPage } from '@/components/warga/WargaListPage'
import { ProfilBuatPage } from '@/components/warga/ProfilBuatPage'
import { KartuKeluargaPage } from '@/components/kartuKeluarga/KartuKeluargaPage'
import { PengajuanPage } from '@/components/kartuKeluarga/PengajuanPage'
import { SuratPage } from '@/components/surat/SuratPage'
import { SuratRiwayatPage } from '@/components/surat/SuratRiwayatPage'
import { SuratKelolaPage } from '@/components/surat/SuratKelolaPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/permissions" element={<PermissionsPage />} />

            {/* User management — admin only */}
            <Route path="/users" element={<UserListPage />} />

            {/* Phase 3: Data Warga */}
            <Route path="/warga" element={<WargaListPage />} />
            <Route path="/profil/buat" element={<ProfilBuatPage />} />

            {/* Kartu Keluarga */}
            <Route path="/kk/saya" element={<KartuKeluargaPage />} />
            <Route path="/kk/:id" element={<KartuKeluargaPage />} />
            <Route path="/pengajuan" element={<PengajuanPage />} />

            {/* Phase 4: Keuangan RT */}
            <Route path="/keuangan" element={<KeuanganBukuKasPage />} />
            <Route path="/keuangan/dashboard" element={<KeuanganDashboardPage />} />
            <Route path="/keuangan/baru" element={<TransaksiFormPage />} />
            <Route path="/keuangan/laporan" element={<LaporanPage />} />
            <Route path="/keuangan/iuran" element={<IuranKonfirmasiPage />} />
            <Route path="/keuangan/pengaturan-iuran" element={<IuranSettingPage />} />
            <Route path="/iuran/upload" element={<IuranUploadPage />} />

            {/* Phase 5: Pengumuman & Notifikasi */}
            <Route path="/pengumuman" element={<PengumumanListPage />} />
            <Route path="/pengumuman/baru" element={<PengumumanFormPage />} />
            <Route path="/pengumuman/:id" element={<PengumumanDetailPage />} />
            <Route path="/pengumuman/:id/edit" element={<PengumumanFormPage />} />

            {/* Phase 6: Forum Diskusi */}
            <Route path="/forum" element={<ForumListPage />} />
            <Route path="/forum/baru" element={<ThreadFormPage />} />
            <Route path="/forum/:id" element={<ThreadDetailPage />} />
            <Route path="/forum/:id/edit" element={<ThreadFormPage />} />

            {/* Phase 7: Pengaduan Warga */}
            <Route path="/pengaduan" element={<PengaduanListPage />} />
            <Route path="/pengaduan/baru" element={<PengaduanFormPage />} />
            <Route path="/pengaduan/:id" element={<PengaduanDetailPage />} />

            {/* Phase 8: Kegiatan & Polling */}
            <Route path="/kegiatan" element={<KegiatanListPage />} />
            <Route path="/kegiatan/baru" element={<KegiatanFormPage />} />
            <Route path="/kegiatan/:id/edit" element={<KegiatanFormPage />} />
            <Route path="/kegiatan/:id" element={<KegiatanDetailPage />} />
            <Route path="/polling" element={<PollingListPage />} />
            <Route path="/polling/baru" element={<PollingFormPage />} />
            <Route path="/polling/:id" element={<PollingDetailPage />} />

            {/* Surat Menyurat */}
            <Route path="/surat" element={<SuratPage />} />
            <Route path="/surat/riwayat" element={<SuratRiwayatPage />} />
            <Route path="/surat/kelola" element={<SuratKelolaPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
