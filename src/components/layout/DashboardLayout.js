import React, { useState, useEffect } from 'react';
import { LogOut, Bell, Search, Menu, User, LayoutDashboard, Settings, Car, Package, Shield, Ticket, MessageSquare, AlertCircle, Calendar, History, PackageCheck, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import feedbackApiService from '../../services/feedbackApiService';
import incidentApiService from '../../services/incidentApiService';

const DashboardLayout = ({ children, activePage, setActivePage }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedbackBadge, setFeedbackBadge] = useState(0);
  const [incidentBadge, setIncidentBadge] = useState(0);

  useEffect(() => {
    loadBadges();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadBadges, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadBadges = async () => {
    if (!user) return;

    try {
      // Feedback badge
      if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.MANAGER) {
        const response = await feedbackApiService.getUnreadNegativeFeedbackCount();
        setFeedbackBadge(response.count || 0);
      } else if (user.role === USER_ROLES.OTHER_USER) {
        const response = await feedbackApiService.getMyUnreadResponsesCount();
        setFeedbackBadge(response.count || 0);
      }

      // Incident badge (for drivers)
      if (user.role === USER_ROLES.DRIVER) {
        const response = await incidentApiService.getUnviewedCount();
        setIncidentBadge(response.count || 0);
      }
    } catch (error) {
      console.error('Failed to load badges:', error);
    }
  };

  const menuItems = {
    [USER_ROLES.ADMIN]: [
      { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' },
      { icon: <Car className="w-5 h-5" />, label: 'Transport Operation', id: 'transport' },
      { icon: <Package className="w-5 h-5" />, label: 'Package Delivery', id: 'packages' },
      { icon: <Shield className="w-5 h-5" />, label: 'Vehicle Safety', id: 'safety' },
      { icon: <AlertCircle className="w-5 h-5" />, label: 'Incidents', id: 'incidents' },
      { icon: <MessageSquare className="w-5 h-5" />, label: 'Feedback', id: 'feedback', badgeType: 'feedback' },
      { icon: <FileText className="w-5 h-5" />, label: 'Reports', id: 'reports' },
      { icon: <User className="w-5 h-5" />, label: 'Users', id: 'users' },
      // Settings removed from sidebar - accessible via profile click
    ],
    [USER_ROLES.MANAGER]: [
      { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' },
      { icon: <Car className="w-5 h-5" />, label: 'Transport Operation', id: 'transport' },
      { icon: <Package className="w-5 h-5" />, label: 'Package Delivery', id: 'packages' },
      { icon: <Shield className="w-5 h-5" />, label: 'Vehicle Safety', id: 'safety' },
      { icon: <AlertCircle className="w-5 h-5" />, label: 'Incidents', id: 'incidents' },
      { icon: <MessageSquare className="w-5 h-5" />, label: 'Feedback', id: 'feedback', badgeType: 'feedback' },
      { icon: <FileText className="w-5 h-5" />, label: 'Reports', id: 'reports' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
    ],
    [USER_ROLES.RECEPTIONIST]: [
      { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' },
      { icon: <Search className="w-5 h-5" />, label: 'Book Tickets', id: 'booking' },
      { icon: <History className="w-5 h-5" />, label: 'Booking History', id: 'booking-history' },
      { icon: <Package className="w-5 h-5" />, label: 'Package Delivery', id: 'packages' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
    ],
    [USER_ROLES.DRIVER]: [
      { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' },
      { icon: <Calendar className="w-5 h-5" />, label: 'Coming Trips', id: 'upcoming-trips' },
      { icon: <Shield className="w-5 h-5" />, label: 'Vehicle Safety', id: 'safety' },
      { icon: <AlertCircle className="w-5 h-5" />, label: 'Incidents', id: 'incidents', badgeType: 'incident' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
    ],
    [USER_ROLES.OTHER_USER]: [
      { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' },
      { icon: <Search className="w-5 h-5" />, label: 'Book Tickets', id: 'booking' },
      { icon: <Ticket className="w-5 h-5" />, label: 'My Bookings', id: 'my-bookings' },
      { icon: <History className="w-5 h-5" />, label: 'Booking History', id: 'booking-history' },
      { icon: <PackageCheck className="w-5 h-5" />, label: 'My Packages', id: 'my-packages' },
      { icon: <MessageSquare className="w-5 h-5" />, label: 'Feedback', id: 'feedback', badgeType: 'feedback' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
    ],
  };

  const currentMenuItems = menuItems[user?.role] || menuItems[USER_ROLES.OTHER_USER];

  const getBadgeCount = (badgeType) => {
    if (badgeType === 'feedback') return feedbackBadge;
    if (badgeType === 'incident') return incidentBadge;
    return 0;
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      const firstNameInitial = user.firstName.charAt(0).toUpperCase();
      return `${firstNameInitial}.${user.lastName}`;
    }
    return user?.email || 'User';
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-3.5 flex items-center justify-between border-b border-gray-800">
          {sidebarOpen && (
            <h1 className="text-2xl font-bold">
              <span className="text-blue-500">TD</span>
              <span>MS</span>
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          {currentMenuItems.map((item, index) => {
            const badgeCount = item.badgeType ? getBadgeCount(item.badgeType) : 0;
            
            return (
              <button
                key={index}
                onClick={() => {
                  setActivePage(item.id);
                  if (item.badgeType) {
                    loadBadges(); // Refresh badges when clicking
                  }
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-left relative ${
                  activePage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
                {badgeCount > 0 && (
                  <span className={`${sidebarOpen ? 'ml-auto' : 'absolute -top-1 -right-1'} bg-red-500 text-white text-xs font-bold rounded-full ${sidebarOpen ? 'px-2 py-0.5' : 'w-5 h-5 flex items-center justify-center'}`}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3.5 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg hover:hover:bg-red-700 bg-red-600"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActivePage('notifications')}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{getDisplayName()}</p>
                  <p className="text-xs text-gray-500">
                    {user?.role?.replace('ROLE_', '').replace('_', ' ') || 'User'}
                  </p>
                </div>
                <button 
                  onClick={() => setActivePage('settings')}
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  title="Go to Settings"
                >
                  <span className="text-white font-semibold text-sm">{getInitials()}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;