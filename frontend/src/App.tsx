import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import ClientsPage from './pages/dashboard/ClientsPage';
import GalleriesPage from './pages/dashboard/GalleriesPage';
import SubscriptionPage from './pages/dashboard/SubscriptionPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import PublicGalleryPage from './pages/public/PublicGalleryPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Client Gallery Route */}
        <Route path="/gallery/:slug" element={<PublicGalleryPage />} />

        {/* Protected Photographer Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="galleries" element={<GalleriesPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
