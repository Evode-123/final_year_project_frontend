// src/components/trips/UpcomingTrips.jsx - Modern Redesigned UI
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Car,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Route as RouteIcon,
  Navigation,
  MapPin,
  ArrowRight,
  Timer,
  Users
} from 'lucide-react';
import tripApiService from '../../services/tripApiService';

const UpcomingTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrips();
    const interval = setInterval(loadTrips, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await tripApiService.getMyUpcomingTrips();
      setTrips(data);
    } catch (err) {
      console.error('Failed to load upcoming trips:', err);
      setError('Failed to load upcoming trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const openGoogleMapsDirections = (trip) => {
    const origin = encodeURIComponent(trip.origin);
    const destination = encodeURIComponent(trip.destination);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'SCHEDULED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'DELAYED':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toUpperCase()) {
      case 'SCHEDULED':
        return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <CheckCircle className="w-4 h-4" />;
      case 'DELAYED':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupTripsByDate = (trips) => {
    const grouped = {};
    trips.forEach(trip => {
      const date = trip.tripDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(trip);
    });
    return grouped;
  };

  const getTimeUntilTrip = (tripDate, departureTime) => {
    const now = new Date();
    const [hours, minutes] = departureTime.split(':');
    const tripDateTime = new Date(tripDate);
    tripDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const diff = tripDateTime - now;
    const hoursUntil = Math.floor(diff / (1000 * 60 * 60));
    const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diff < 0) return 'Started';
    if (hoursUntil < 1) return `in ${minutesUntil}min`;
    if (hoursUntil < 24) return `in ${hoursUntil}h ${minutesUntil}min`;
    
    const daysUntil = Math.floor(hoursUntil / 24);
    return `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading upcoming trips...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3 text-red-800 mb-3">
          <AlertCircle className="w-6 h-6" />
          <p className="font-semibold">{error}</p>
        </div>
        <button
          onClick={loadTrips}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  const groupedTrips = groupTripsByDate(trips);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Upcoming Trips</h1>
            <p className="text-blue-100">
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'} scheduled
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all disabled:opacity-50 border border-white/30"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* No Trips Message */}
      {trips.length === 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Upcoming Trips
          </h3>
          <p className="text-gray-600">
            You don't have any scheduled trips at the moment. Check back later!
          </p>
        </div>
      )}

      {/* Trips Grouped by Date */}
      {Object.entries(groupedTrips).map(([date, dateTrips]) => (
        <div key={date} className="space-y-4">
          {/* Date Header */}
          <div className="flex items-center gap-3 pb-2 border-b-2 border-gray-200">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{formatDate(date)}</h2>
              <p className="text-sm text-gray-500">
                {dateTrips.length} {dateTrips.length === 1 ? 'trip' : 'trips'}
              </p>
            </div>
          </div>

          {/* Trips for this date */}
          <div className="grid gap-4">
            {dateTrips.map((trip) => (
              <div
                key={trip.dailyTripId}
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all duration-300"
              >
                {/* Trip Header with Route */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${getStatusColor(trip.status)}`}>
                      {getStatusIcon(trip.status)}
                      <span>{trip.status || 'Scheduled'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                      <Timer className="w-4 h-4 text-blue-600" />
                      <span>{getTimeUntilTrip(trip.tripDate, trip.departureTime)}</span>
                    </div>
                  </div>

                  {/* Route Display */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <div className="w-0.5 h-8 bg-blue-300"></div>
                          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-0.5">From</p>
                            <p className="text-lg font-bold text-gray-900">{trip.origin}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">To</p>
                            <p className="text-lg font-bold text-gray-900">{trip.destination}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Departure Time */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Departure</p>
                        <p className="text-sm font-bold text-gray-900">{formatTime(trip.departureTime)}</p>
                      </div>
                    </div>

                    {/* Vehicle */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Vehicle</p>
                        <p className="text-sm font-bold text-gray-900">{trip.vehiclePlateNo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Button - Compact & Attractive */}
                  <button
                    onClick={() => openGoogleMapsDirections(trip)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg group"
                  >
                    <Navigation className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="font-semibold">Navigate with Google Maps</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Trip ID */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center">
                      Trip ID: #{trip.dailyTripId} • Auto-updates every 30s
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpcomingTrips;