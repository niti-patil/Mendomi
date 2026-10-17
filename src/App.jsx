import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Upload from '@/pages/Upload';
import AskMendy from '@/pages/AskMendy';
import Medications from '@/pages/Medications';
import MedicationDetail from '@/pages/MedicationDetail';
import SymptomCheckIn from '@/pages/SymptomCheckIn';
import CheckInHistory from '@/pages/CheckInHistory';
import Progress from '@/pages/Progress';
import DoctorReport from '@/pages/DoctorReport';
import CaregiverDashboard from '@/pages/CaregiverDashboard';
import FollowupReminder from '@/pages/FollowupReminder';
import Appointments from '@/pages/Appointments';
import SharedDoctorReport from '@/pages/SharedDoctorReport';
import ReportDetail from '@/pages/ReportDetail';
import RecoveryPlanHub from '@/pages/hubs/RecoveryPlanHub';
import VisitsHub from '@/pages/hubs/VisitsHub';
import ReportsHub from '@/pages/hubs/ReportsHub';
import ProfileCustomization from '@/pages/settings/ProfileCustomization';
import HospitalRecords from '@/pages/settings/HospitalRecords';
import EmailReminders from '@/pages/settings/EmailReminders';
import MendyTone from '@/pages/settings/MendyTone';
import CaregiverAccess from '@/pages/settings/CaregiverAccess';
import OtherSettings from '@/pages/settings/OtherSettings';
import SavedQuestions from '@/pages/settings/SavedQuestions';
import Auth from '@/pages/Auth';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Add page imports here

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/shared/report/:token" element={<SharedDoctorReport />} />
            <Route path="/auth" element={<Auth defaultMode="login" />} />
            <Route path="/login" element={<Auth defaultMode="login" />} />
            <Route path="/register" element={<Auth defaultMode="signup" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/auth" replace />} />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/plan" element={<RecoveryPlanHub />} />
                <Route path="/ask" element={<AskMendy />} />
                <Route path="/visits" element={<VisitsHub />} />
                <Route path="/reports" element={<ReportsHub />} />
                <Route path="/reports/:id" element={<ReportDetail />} />
                <Route path="/medications" element={<Medications />} />
                <Route path="/medications/:id" element={<MedicationDetail />} />
                <Route path="/checkin" element={<SymptomCheckIn />} />
                <Route path="/checkin/history" element={<CheckInHistory />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/doctor-report" element={<DoctorReport />} />
                <Route path="/caregiver" element={<CaregiverDashboard />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/follow-up" element={<FollowupReminder />} />
                <Route path="/settings/profile" element={<ProfileCustomization />} />
                <Route path="/settings/hospital-records" element={<HospitalRecords />} />
                <Route path="/settings/email" element={<EmailReminders />} />
                <Route path="/settings/tone" element={<MendyTone />} />
                <Route path="/settings/caregiver" element={<CaregiverAccess />} />
                <Route path="/settings/other" element={<OtherSettings />} />
                <Route path="/settings/saved" element={<SavedQuestions />} />
                <Route path="/profile" element={<ProfileCustomization />} />
                <Route path="/settings" element={<EmailReminders />} />
              </Route>
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App