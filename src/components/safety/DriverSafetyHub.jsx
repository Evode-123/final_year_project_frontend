import React, { useState } from 'react';
import { Shield, Car, Calendar, History, AlertTriangle, CheckCircle } from 'lucide-react';
import DriverVehicleInspectionView from './DriverVehicleInspectionView';
import DriverDailyCheckView from './DriverDailyCheckView';
import DriverDailyCheckHistory from './DriverDailyCheckHistory';

const DriverSafetyHub = () => {
  const [activeTab, setActiveTab] = useState('my-vehicle');

  const tabs = [
    { 
      id: 'my-vehicle', 
      label: 'My Vehicle Status', 
      icon: Car,
      component: DriverVehicleInspectionView 
    },
    { 
      id: 'daily-check', 
      label: 'Submit Daily Check', 
      icon: CheckCircle,
      component: DriverDailyCheckView 
    },
    { 
      id: 'check-history', 
      label: 'My Check History', 
      icon: History,
      component: DriverDailyCheckHistory 
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DriverVehicleInspectionView;

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Vehicle Safety</h1>
              <p className="text-gray-600">Check your vehicle status and submit daily inspections</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
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

export default DriverSafetyHub;