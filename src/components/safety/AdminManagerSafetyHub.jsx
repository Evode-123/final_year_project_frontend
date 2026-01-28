import React, { useState, useEffect } from 'react';
import { Shield, ClipboardCheck, Calendar, History, CheckSquare } from 'lucide-react';
import VehicleInspectionManagement from './VehicleInspectionManagement';
import VehicleInspectionHistory from './VehicleInspectionHistory';
import DailyVehicleChecks from './DailyVehicleChecks';
import DailyCheckHistory from './DailyCheckHistory';
import DailyChecksManagement from './DailyChecksManagement';
import transportApiService from '../../services/transportApiService';

const AdminManagerSafetyHub = () => {
  const [activeTab, setActiveTab] = useState('inspections');
  const [unreviewedCount, setUnreviewedCount] = useState(0);

  // ✅ Load unreviewed count from API
  useEffect(() => {
    const loadUnreviewedCount = async () => {
      try {
        const dashboard = await transportApiService.getDailyChecksDashboard();
        setUnreviewedCount(dashboard.unreviewedProblemsCount || 0);
      } catch (error) {
        console.error('Failed to load unreviewed count:', error);
        setUnreviewedCount(0); // Don't show badge if API fails
      }
    };

    loadUnreviewedCount();
    
    // ✅ Refresh every 30 seconds to keep badge up-to-date
    const interval = setInterval(loadUnreviewedCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { 
      id: 'inspections', 
      label: 'Government Inspections', 
      icon: Calendar,
      component: VehicleInspectionManagement,
      description: 'Record and track mandatory government vehicle inspections'
    },
    { 
      id: 'inspection-history', 
      label: 'Inspection History', 
      icon: History,
      component: VehicleInspectionHistory,
      description: 'View complete inspection records by vehicle'
    },
    { 
      id: 'daily-checks-management', 
      label: 'Daily Checks Management', 
      icon: CheckSquare,
      component: DailyChecksManagement,
      description: 'Review and manage driver daily vehicle checks',
      showBadge: true // ✅ This tab can show badge
    },
    { 
      id: 'check-history', 
      label: 'Check History', 
      icon: History,
      component: DailyCheckHistory,
      description: 'View daily check history by vehicle'
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || VehicleInspectionManagement;
  const activeTabInfo = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Vehicle Safety & Compliance</h1>
              <p className="text-gray-600">Government inspections, daily checks, and complete history tracking</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-3 py-4 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const shouldShowBadge = tab.showBadge && unreviewedCount > 0 && activeTab !== tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
                
                {/* ✅ SMART BADGE: Only shows when there are actual unreviewed items */}
                {shouldShowBadge && (
                  <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-red-600 rounded-full border-2 border-white animate-pulse">
                    {unreviewedCount}
                  </span>
                )}
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

export default AdminManagerSafetyHub;