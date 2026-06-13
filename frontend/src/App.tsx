import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { DashboardPage } from './components/auth/DashboardPage'
import { LoginPage } from './components/auth/LoginPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RegisterPage } from './components/auth/RegisterPage'
import { WargaDetailPage } from './components/warga/WargaDetailPage'
import { WargaFormPage } from './components/warga/WargaFormPage'
import { WargaKKPage } from './components/warga/WargaKKPage'
import { WargaListPage } from './components/warga/WargaListPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />

          {/* Phase 3: Data Warga */}
          <Route path="/warga" element={<WargaListPage />} />
          <Route path="/warga/baru" element={<WargaFormPage />} />
          <Route path="/warga/:id" element={<WargaDetailPage />} />
          <Route path="/warga/:id/edit" element={<WargaFormPage />} />
          <Route path="/warga/:id/kk" element={<WargaKKPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
