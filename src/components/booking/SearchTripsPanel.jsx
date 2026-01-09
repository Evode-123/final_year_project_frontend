import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Clock, Users, AlertCircle, DollarSign, Loader } from 'lucide-react';
import transportApiService from '../../services/transportApiService';
import BookingModal from './BookingModal';

const SearchTripsPanel = () => {
  const [routes, setRoutes] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState({
    origin: '',
    destination: '',
    travelDate: new Date().toISOString().split('T')[0]
  });
  const [availableTrips, setAvailableTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAllTrips, setShowAllTrips] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRoutes();
    loadAvailableTrips();
  }, []);

  const loadRoutes = async () => {
    try {
      const data = await transportApiService.getAllRoutes();
      setRoutes(data);
    } catch (err) {
      console.error('Failed to load routes:', err);
    }
  };

  const loadAvailableTrips = async () => {
    try {
      setLoading(true);
      const trips = await transportApiService.getAvailableTrips();
      setAvailableTrips(trips);
    } catch (err) {
      setError('Failed to load available trips');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const results = await transportApiService.searchTrips(searchCriteria);
      setAvailableTrips(results);
      setShowAllTrips(false);
      
      if (results.length === 0) {
        setError('No trips found for your search criteria. Try different dates or routes.');
      }
    } catch (err) {
      setError('Failed to search trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookTrip = (trip) => {
    setSelectedTrip(trip);
    setShowBookingModal(true);
  };

  // ✅ IMPROVED: Refresh logic with immediate UI update
  const handleBookingSuccess = async (bookedTrip) => {
    setShowBookingModal(false);
    setSelectedTrip(null);
    
    // ✅ IMMEDIATE UPDATE: Reduce seat count in UI instantly
    setAvailableTrips(prevTrips => 
      prevTrips.map(trip => 
        trip.dailyTripId === bookedTrip.dailyTripId
          ? { ...trip, availableSeats: trip.availableSeats - 1 }
          : trip
      )
    );

    // ✅ BACKGROUND REFRESH: Sync with backend to get accurate data
    try {
      if (showAllTrips) {
        await loadAvailableTrips();
      } else {
        const results = await transportApiService.searchTrips(searchCriteria);
        setAvailableTrips(results);
      }
    } catch (err) {
      console.error('Failed to refresh trips:', err);
    }
  };

  // Get unique origins and destinations
  const origins = [...new Set(routes.map(r => r.origin))];
  const destinations = searchCriteria.origin 
    ? [...new Set(routes.filter(r => r.origin === searchCriteria.origin).map(r => r.destination))]
    : [...new Set(routes.map(r => r.destination))];

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          Search for Trips
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              From (Origin)
            </label>
            <select
              value={searchCriteria.origin}
              onChange={(e) => setSearchCriteria({
                ...searchCriteria,
                origin: e.target.value,
                destination: '' // Reset destination when origin changes
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Select origin</option>
              {origins.map((origin) => (
                <option key={origin} value={origin}>{origin}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              To (Destination)
            </label>
            <select
              value={searchCriteria.destination}
              onChange={(e) => setSearchCriteria({...searchCriteria, destination: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
              disabled={!searchCriteria.origin}
            >
              <option value="">Select destination</option>
              {destinations.map((dest) => (
                <option key={dest} value={dest}>{dest}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Travel Date
            </label>
            <input
              type="date"
              value={searchCriteria.travelDate}
              onChange={(e) => setSearchCriteria({...searchCriteria, travelDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search Trips
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            💡 Tip: You can book trips up to 2 days in advance
          </p>
          <button
            type="button"
            onClick={() => {
              setShowAllTrips(true);
              loadAvailableTrips();
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all available trips →
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Available Trips */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <p className="text-gray-600 mt-4">Loading trips...</p>
          </div>
        </div>
      ) : availableTrips.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              {showAllTrips ? 'All Available Trips' : 'Search Results'} ({availableTrips.length})
            </h3>
            {!showAllTrips && (
              <button
                onClick={() => {
                  setShowAllTrips(true);
                  loadAvailableTrips();
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all trips
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {availableTrips.map((trip) => (
              <div
                key={trip.dailyTripId}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Route */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{trip.origin}</p>
                        </div>
                        <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-4 relative">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{trip.destination}</p>
                        </div>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{new Date(trip.tripDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{trip.departureTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {/* ✅ IMPROVED: Visual indicator for low seats */}
                        <span className={`text-sm font-semibold ${
                          trip.availableSeats === 0 ? 'text-red-600' : 
                          trip.availableSeats <= 3 ? 'text-orange-600' : 
                          'text-green-600'
                        }`}>
                          {trip.availableSeats} {trip.availableSeats === 1 ? 'seat' : 'seats'} left
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-semibold">RWF {trip.price}</span>
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        <strong>Vehicle:</strong> {trip.vehiclePlateNo} | <strong>Total Seats:</strong> {trip.totalSeats}
                      </p>
                    </div>
                  </div>

                  {/* Book Button */}
                  <div className="ml-6">
                    <button
                      onClick={() => handleBookTrip(trip)}
                      disabled={trip.availableSeats === 0}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {trip.availableSeats === 0 ? 'Sold Out' : 'Book Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !loading && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No trips available</p>
          <p className="text-gray-500 text-sm mt-2">Try searching with different criteria</p>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedTrip && (
        <BookingModal
          trip={selectedTrip}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedTrip(null);
          }}
          onSuccess={() => handleBookingSuccess(selectedTrip)}
        />
      )}
    </div>
  );
};

export default SearchTripsPanel;