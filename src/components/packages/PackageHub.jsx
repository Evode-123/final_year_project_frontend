import React, { useState } from 'react';
import { Package, Search, CheckCircle } from 'lucide-react';
import PackageBookingManagement from './PackageBookingManagement';
import PackageTracking from './PackageTracking';
import PackageManagement from './PackageManagement';

const PackageHub = () => {
  const [activeTab, setActiveTab] = useState('booking');

  const tabs = [
    { id: 'booking', label: 'Book Package', icon: Package, component: PackageBookingManagement },
    { id: 'tracking', label: 'Track Package', icon: Search, component: PackageTracking },
    { id: 'management', label: 'Package Collection', icon: CheckCircle, component: PackageManagement }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PackageBookingManagement;

  return (
    <div className="space-y-6">
      {/* Header with Horizontal Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📦 Package Delivery</h1>
          <p className="text-gray-600 text-sm">Book, track, and manage package deliveries</p>
        </div>

        {/* Horizontal Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-4 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Component Content */}
      <div>
        <ActiveComponent />
      </div>
    </div>
  );
};

export default PackageHub;