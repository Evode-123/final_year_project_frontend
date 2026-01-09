import React, { useState } from 'react';
import { Search, Calendar, MapPin, Ticket, History } from 'lucide-react';
import SearchTripsPanel from './SearchTripsPanel';
import MyBookingsPanel from './MyBookingsPanel';
import BookingHistoryPanel from './BookingHistoryPanel';

const OtherUserHub = () => {
  const [activeTab, setActiveTab] = useState('search');

  const tabs = [
    { id: 'search', label: 'Search Trips', icon: <Search className="w-5 h-5" /> },
    { id: 'bookings', label: 'My Bookings', icon: <Ticket className="w-5 h-5" /> },
    { id: 'history', label: 'Booking History', icon: <History className="w-5 h-5" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return <SearchTripsPanel />;
      case 'bookings':
        return <MyBookingsPanel />;
      case 'history':
        return <BookingHistoryPanel />;
      default:
        return <SearchTripsPanel />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Ticket className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Book Your Trip</h1>
            <p className="text-blue-100 mt-1">Search, book, and manage your travel tickets</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Multiple Routes</h3>
              <p className="text-sm text-gray-600">Travel across Rwanda</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Book Ahead</h3>
              <p className="text-sm text-gray-600">Up to 2 days in advance</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Instant Tickets</h3>
              <p className="text-sm text-gray-600">Get your ticket immediately</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherUserHub;