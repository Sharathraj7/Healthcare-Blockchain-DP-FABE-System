import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

// Pages
import LoginPage from './pages/LoginPage.jsx'
import PatientRegisterPage from './pages/PatientRegisterPage.jsx'
import PatientDashboard from './pages/patient/PatientDashboard.jsx'
import PatientProfile from './pages/patient/PatientProfile.jsx'
import UploadRecord from './pages/patient/UploadRecord.jsx'
import PatientRecords from './pages/patient/PatientRecords.jsx'
import DoctorDashboard from './pages/doctor/DoctorDashboard.jsx'
import DoctorPatients from './pages/doctor/DoctorPatients.jsx'
import DoctorPatientView from './pages/doctor/DoctorPatientView.jsx'
import AuditLogs from './pages/doctor/AuditLogs.jsx'
import BlockchainExplorer from './pages/BlockchainExplorer.jsx'

// Layouts
import PatientLayout from './layouts/PatientLayout.jsx'
import DoctorLayout from './layouts/DoctorLayout.jsx'

// Protected route components
function PatientRoute({ children }) {
  const { isAuthenticated, isPatient, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0e1a', color: '#fff' }}>Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isPatient) return <Navigate to="/login" replace />
  return children
}

function DoctorRoute({ children }) {
  const { isAuthenticated, isDoctor, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0e1a', color: '#fff' }}>Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isDoctor) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, isPatient, isDoctor, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) {
    if (isDoctor) return <Navigate to="/doctor/dashboard" replace />
    if (isPatient) return <Navigate to="/patient/dashboard" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><PatientRegisterPage /></PublicRoute>} />
      
      {/* Patient routes */}
      <Route path="/patient" element={
        <PatientRoute>
          <PatientLayout />
        </PatientRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="upload-record" element={<UploadRecord />} />
        <Route path="records" element={<PatientRecords />} />
        <Route path="blockchain" element={<BlockchainExplorer />} />
      </Route>
      
      {/* Doctor routes */}
      <Route path="/doctor" element={
        <DoctorRoute>
          <DoctorLayout />
        </DoctorRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="patients/:id" element={<DoctorPatientView />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="blockchain" element={<BlockchainExplorer />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
