import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ChangePasswordPage from './components/auth/ChangePasswordPage';
import CompleteProfilePage from './components/auth/CompleteProfilePage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardContent from './components/dashboard/DashboardContent';
import AdminDashboard from './components/dashboard/AdminDashboard';
import ManagerDashboard from './components/dashboard/ManagerDashboard';
import DriverDashboard from './components/dashboard/DriverDashboard';
import ReceptionistDashboard from './components/dashboard/ReceptionistDashboard';
import OtherUserDashboard from './components/dashboard/OtherUserDashboard';
import AdminUserManagement from './components/admin/AdminUserManagement';
import AdminReports from './components/admin/AdminReports';
import SettingsPage from './components/settings/SettingsPage';
import TransportHub from './components/transport/TransportHub';
import PackageHub from './components/packages/PackageHub';
import OtherUserHub from './components/booking/OtherUserHub';
import MyBookingsPanel from './components/booking/MyBookingsPanel';
import BookingHistoryPanel from './components/booking/BookingHistoryPanel';
import FeedbackManagement from './components/feedback/FeedbackManagement';
import UserFeedbackPage from './components/feedback/UserFeedbackPage';
import IncidentManagement from './components/incidents/IncidentManagement';
import UpcomingTrips from './components/trips/UpcomingTrips';
import MyPackagesPanel from './components/packages/MyPackagesPanel';
import DriverSafetyHub from './components/safety/DriverSafetyHub';
import AdminManagerSafetyHub from './components/safety/AdminManagerSafetyHub';
import { USER_ROLES } from './utils/constants';

const App = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('login');
  const [activePage, setActivePage] = useState('dashboard');
  const [resetToken, setResetToken] = useState(null);

  // Check for reset password token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setResetToken(token);
      setCurrentPage('reset-password');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated flow
  if (!user) {
    if (currentPage === 'signup') {
      return <SignupPage onSwitchToLogin={() => setCurrentPage('login')} />;
    }
    if (currentPage === 'forgot-password') {
      return <ForgotPasswordPage onBack={() => setCurrentPage('login')} />;
    }
    if (currentPage === 'reset-password') {
      return (
        <ResetPasswordPage
          token={resetToken}
          onSuccess={() => {
            setCurrentPage('login');
            setResetToken(null);
          }}
        />
      );
    }
    return (
      <LoginPage
        onSwitchToSignup={() => setCurrentPage('signup')}
        onForgotPassword={() => setCurrentPage('forgot-password')}
      />
    );
  }

  // Authenticated flow - Check if password change is required
  if (user.mustChangePassword) {
    return <ChangePasswordPage />;
  }

  // Check if profile completion is required
  if (!user.profileCompleted) {
    return <CompleteProfilePage />;
  }

  // Render page content based on active page and user role
  const renderPageContent = () => {
    switch (activePage) {
      case 'dashboard':
        // Role-specific dashboards
        if (user.role === USER_ROLES.ADMIN) {
          return <AdminDashboard />;
        } else if (user.role === USER_ROLES.MANAGER) {
          return <ManagerDashboard />;
        } else if (user.role === USER_ROLES.DRIVER) {
          return <DriverDashboard />;
        } else if (user.role === USER_ROLES.RECEPTIONIST) {
          return <ReceptionistDashboard />;
        } else if (user.role === USER_ROLES.OTHER_USER) {
          return <OtherUserDashboard />;
        }
        // Fallback to default dashboard
        return <DashboardContent />;
      
      case 'transport':
        return <TransportHub />;
      
      case 'packages':
        return <PackageHub />;
      
      case 'safety':
        // Role-based safety hub routing
        if (user.role === USER_ROLES.DRIVER) {
          return <DriverSafetyHub />;
        } else if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.MANAGER) {
          return <AdminManagerSafetyHub />;
        }
        return <DashboardContent />;
      
      case 'booking':
        return <OtherUserHub />;

      case 'my-packages':
        return <MyPackagesPanel />;
      
      case 'my-bookings':
        return <MyBookingsPanel />;
      
      case 'booking-history':
        return <BookingHistoryPanel />;
      
      case 'incidents':
        return <IncidentManagement />;
      
      case 'upcoming-trips':
        return <UpcomingTrips />;
      
      case 'feedback':
        if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.MANAGER) {
          return <FeedbackManagement />;
        } else if (user.role === USER_ROLES.OTHER_USER) {
          return <UserFeedbackPage />;
        }
        return <DashboardContent />;
      
      case 'users':
        return user.role === USER_ROLES.ADMIN ? <AdminUserManagement /> : <DashboardContent />;
      
      case 'reports':
        return (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.MANAGER) ? <AdminReports /> : <DashboardContent />;
      
      case 'settings':
        return <SettingsPage />;
      
      default:
        return <DashboardContent />;
    }
  };

  return (
    <DashboardLayout activePage={activePage} setActivePage={setActivePage}>
      {renderPageContent()}
    </DashboardLayout>
  );
};

export default App;