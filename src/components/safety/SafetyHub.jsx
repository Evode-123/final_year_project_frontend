import React, { useState } from 'react';
import { Shield, ClipboardCheck, Calendar, History } from 'lucide-react';
import VehicleInspectionManagement from './VehicleInspectionManagement';
import VehicleInspectionHistory from './VehicleInspectionHistory';
import DailyVehicleChecks from './DailyVehicleChecks';
import DailyCheckHistory from './DailyCheckHistory';

const SafetyHub = () => {
  const [activeTab, setActiveTab] = useState('inspections');

  const tabs = [
    { 
      id: 'inspections', 
      label: 'Government Inspections', 
      icon: Calendar,
      component: VehicleInspectionManagement 
    },
    { 
      id: 'inspection-history', 
      label: 'Inspection History', 
      icon: History,
      component: VehicleInspectionHistory 
    },
    { 
      id: 'daily-checks', 
      label: 'Daily Checks', 
      icon: ClipboardCheck,
      component: DailyVehicleChecks 
    },
    { 
      id: 'check-history', 
      label: 'Check History', 
      icon: History,
      component: DailyCheckHistory 
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || VehicleInspectionManagement;

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Vehicle Safety & Compliance</h1>
          </div>
          <p className="text-gray-600 ml-11">Government inspections, daily checks, and complete history tracking</p>
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

export default SafetyHub;