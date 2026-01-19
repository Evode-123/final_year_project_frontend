import React from 'react';
import { Search, Calendar, MapPin, Ticket } from 'lucide-react';
import SearchTripsPanel from './SearchTripsPanel';

const OtherUserHub = () => {
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
            <p className="text-blue-100 mt-1">Search and book your travel tickets</p>
          </div>
        </div>
      </div>

      {/* Search Panel */}
      <SearchTripsPanel />

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