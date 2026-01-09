import React, { useState } from 'react';
import { LogOut, Bell, Search, Menu, User, FileText, Settings, Car, Package, Shield, Ticket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';

const DashboardLayout = ({ children, activePage, setActivePage }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = {
    [USER_ROLES.ADMIN]: [
      { icon: <FileText className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' },
      { icon: <Car className="w-5 h-5" />, label: 'Transport Operation', id: 'transport' },
      { icon: <Package className="w-5 h-5" />, label: 'Package Delivery', id: 'packages' },
      { icon: <Shield className="w-5 h-5" />, label: 'Vehicle Safety', id: 'safety' },
      { icon: <User className="w-5 h-5" />, label: 'Users', id: 'users' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
    ],
    [USER_ROLES.MANAGER]: [
      { icon: <FileText className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' },
      { icon: <Car className="w-5 h-5" />, label: 'Transport Operation', id: 'transport' },
      { icon: <Package className="w-5 h-5" />, label: 'Package Delivery', id: 'packages' },
      { icon: <Shield className="w-5 h-5" />, label: 'Vehicle Safety', id: 'safety' },
      { icon: <Bell className="w-5 h-5" />, label: 'Notifications', id: 'notifications' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
    ],
    [USER_ROLES.RECEPTIONIST]: [
      { icon: <FileText className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' },
      { icon: <Ticket className="w-5 h-5" />, label: 'Book Tickets', id: 'booking' },
      { icon: <Package className="w-5 h-5" />, label: 'Package Delivery', id: 'packages' },
      { icon: <Bell className="w-5 h-5" />, label: 'Notifications', id: 'notifications' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
    ],
    [USER_ROLES.DRIVER]: [
      { icon: <FileText className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' },
      { icon: <Shield className="w-5 h-5" />, label: 'Vehicle Safety', id: 'safety' },
      { icon: <Bell className="w-5 h-5" />, label: 'Notifications', id: 'notifications' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
    ],
    [USER_ROLES.OTHER_USER]: [ // ✅ NEW MENU for OTHER_USER
      { icon: <FileText className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' },
      { icon: <Ticket className="w-5 h-5" />, label: 'Book Tickets', id: 'booking' },
      { icon: <Bell className="w-5 h-5" />, label: 'Notifications', id: 'notifications' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', id: 'settings' },
    ],
  };

  const currentMenuItems = menuItems[user?.role] || menuItems[USER_ROLES.OTHER_USER];

  // Helper function to format the display name
  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      const firstNameInitial = user.firstName.charAt(0).toUpperCase();
      return `${firstNameInitial}.${user.lastName}`;
    }
    return user?.email || 'User';
  };

  // Helper function to get initials for avatar
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
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
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

        <nav className="flex-1 p-4 space-y-2">
          {currentMenuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activePage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-colors"
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
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
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