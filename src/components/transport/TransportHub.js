import React, { useState } from 'react';
import { MapPin, Car, Users, Ticket, Settings, History } from 'lucide-react'; // Added Settings
import TripGenerationPanel from './TripGenerationPanel'; // NEW IMPORT
import RoutesManagement from './RoutesManagement';
import VehiclesManagement from './VehiclesManagement';
import DriversManagement from './DriversManagement';
import BookingsManagement from './BookingsManagement';
import BookingHistoryPanel from '../booking/BookingHistoryPanel';

const TransportHub = () => {
  const [activeTab, setActiveTab] = useState('vehicles');

  const tabs = [
  { id: 'vehicles', label: 'Vehicles', icon: Car, component: VehiclesManagement },
  { id: 'drivers', label: 'Drivers', icon: Users, component: DriversManagement },
  { id: 'routes', label: 'Routes', icon: MapPin, component: RoutesManagement },
  { id: 'trips', label: 'Generate Trip', icon: Settings, component: TripGenerationPanel },
  { id: 'bookings', label: 'Bookings', icon: Ticket, component: BookingsManagement },
  { id: 'booking-history', label: 'Booking History', icon: History, component: BookingHistoryPanel }
];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || RoutesManagement;

  return (
    <div className="space-y-6">
      {/* Header with Horizontal Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {/* Horizontal Tab Navigation */}
        <div className="flex items-center gap-2 px-1 py-3 bg-gray-50 border-b border-gray-200 overflow-x-auto">
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

export default TransportHub;