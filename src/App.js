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
import AdminUserManagement from './components/admin/AdminUserManagement';
import SettingsPage from './components/settings/SettingsPage';
import TransportHub from './components/transport/TransportHub';
import PackageHub from './components/packages/PackageHub';
import SafetyHub from './components/safety/SafetyHub';
import OtherUserHub from './components/booking/OtherUserHub'; // ✅ NEW IMPORT
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
        return <DashboardContent />;
      case 'transport':
        return <TransportHub />;
      case 'packages':
        return <PackageHub />;
      case 'safety':
        return <SafetyHub />;
      case 'booking': // ✅ NEW CASE for OTHER_USER
        return <OtherUserHub />;
      case 'users':
        return user.role === USER_ROLES.ADMIN ? <AdminUserManagement /> : <DashboardContent />;
      case 'notifications':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
            <p className="text-gray-600">Notification features coming soon...</p>
          </div>
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardContent />;
    }
  };

  // User is fully authenticated and set up - show dashboard
  return (
    <DashboardLayout activePage={activePage} setActivePage={setActivePage}>
      {renderPageContent()}
    </DashboardLayout>
  );
};

export default App;