import React, { useState, useEffect } from 'react';
import { 
  Package as PackageIcon, 
  Search, 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  CheckCircle,
  AlertCircle,
  Send,
  Weight,
  DollarSign
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';
import packageApiService from '../../services/packageApiService';

const PAYMENT_METHODS = {
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY',
  CARD: 'CARD'
};

const PackageBookingManagement = () => {
  const [availableTrips, setAvailableTrips] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('book'); // 'book' or 'history'

  const [searchData, setSearchData] = useState({
    origin: '',
    destination: '',
    travelDate: new Date().toISOString().split('T')[0]
  });

  const [packageData, setPackageData] = useState({
    // Sender info
    senderNames: '',
    senderPhone: '',
    senderEmail: '',
    senderIdNumber: '',
    
    // Receiver info
    receiverNames: '',
    receiverPhone: '',
    receiverEmail: '',
    receiverIdNumber: '',
    
    // Package details
    packageDescription: '',
    packageWeight: '',
    packageValue: '',
    isFragile: false,
    
    // Payment
    paymentMethod: '' // No default - user must select
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [trips, routesData] = await Promise.all([
        transportApiService.getAvailableTrips(),
        transportApiService.getAllRoutes()
      ]);
      setAvailableTrips(trips);
      setRoutes(routesData);
      
      // Extract unique origins and destinations
      const uniqueOrigins = [...new Set(routesData.map(route => route.origin))].sort();
      const uniqueDestinations = [...new Set(routesData.map(route => route.destination))].sort();
      
      setOrigins(uniqueOrigins);
      setDestinations(uniqueDestinations);
      
      await loadBookingHistory();
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBookingHistory = async () => {
    try {
      // Get all packages (in-transit, arrived, collected)
      const [inTransit, arrived, collected] = await Promise.all([
        packageApiService.getInTransitPackages(),
        packageApiService.getArrivedPackages(),
        packageApiService.getCollectedPackages()
      ]);
      
      // Combine all packages and sort by booking date (newest first)
      const allPackages = [...inTransit, ...arrived, ...collected];
      allPackages.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
      
      setBookingHistory(allPackages);
    } catch (err) {
      console.error('Failed to load booking history:', err);
    }
  };

  const handleSearchTrips = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      const trips = await transportApiService.searchTrips(searchData);
      setAvailableTrips(trips);
      setSuccess(`Found ${trips.length} available trip(s)`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to search trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = async () => {
    setError('');
    setSuccess('');
    
    // Reset search data to default
    setSearchData({
      origin: '',
      destination: '',
      travelDate: new Date().toISOString().split('T')[0]
    });
    
    // Reload all available trips
    try {
      setLoading(true);
      const trips = await transportApiService.getAvailableTrips();
      setAvailableTrips(trips);
      setSuccess('Filter cleared - showing all available trips');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to load trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    setShowBookingForm(true);
  };

  const calculateEstimatedPrice = () => {
    if (!packageData.packageWeight || !selectedTrip) return 'TBD';
    
    const weight = parseFloat(packageData.packageWeight);
    const basePrice = weight * 1000; // 1000 RWF per kg
    const ticketPrice = parseFloat(selectedTrip.price);
    const premium = ticketPrice * 0.30;
    const total = basePrice + premium;
    
    return Math.max(total, 2000).toFixed(0); // Minimum 2000 RWF
  };

  const handleBookPackage = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTrip) {
      setError('Please select a trip first');
      return;
    }

    // Validate required fields
    if (!packageData.receiverIdNumber) {
      setError('Receiver National ID is required');
      return;
    }

    if (!packageData.paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setBookingLoading(true);
      const bookingData = {
        ...packageData,
        dailyTripId: selectedTrip.dailyTripId,
        packageWeight: parseFloat(packageData.packageWeight),
        packageValue: packageData.packageValue ? parseFloat(packageData.packageValue) : null
      };

      const result = await packageApiService.bookPackage(bookingData);
      
      setSuccess(`Package booked successfully! Tracking Number: ${result.trackingNumber}`);
      setSuccess(prevMsg => prevMsg + '\nSender and receiver have been notified via SMS and Email.');
      
      // Reset form
      resetForm();
      
      // Reload trips and booking history
      await loadInitialData();
      
      // Switch to history view to show the new booking
      setTimeout(() => setViewMode('history'), 2000);
    } catch (err) {
      setError('Failed to book package: ' + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const resetForm = () => {
    setPackageData({
      senderNames: '',
      senderPhone: '',
      senderEmail: '',
      senderIdNumber: '',
      receiverNames: '',
      receiverPhone: '',
      receiverEmail: '',
      receiverIdNumber: '',
      packageDescription: '',
      packageWeight: '',
      packageValue: '',
      isFragile: false,
      paymentMethod: '' // No default - user must select
    });
    setSelectedTrip(null);
    setShowBookingForm(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && availableTrips.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Package Booking</h1>
            <p className="text-gray-600 mt-1">Book packages for delivery on scheduled trips</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('book')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              viewMode === 'book'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PackageIcon className="w-5 h-5" />
            Book New Package
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              viewMode === 'history'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Search className="w-5 h-5" />
            Booking History ({bookingHistory.length})
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="whitespace-pre-line">{success}</div>
          <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Booking History View */}
      {viewMode === 'history' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">All Bookings</h2>
            <p className="text-gray-600 text-sm mt-1">Complete history of all package bookings</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Tracking #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Sender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Receiver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Booking Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookingHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <PackageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No bookings yet</p>
                      <button
                        onClick={() => setViewMode('book')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Book Your First Package
                      </button>
                    </td>
                  </tr>
                ) : (
                  bookingHistory.map((pkg) => {
                    const getStatusBadge = (status) => {
                      const badges = {
                        'IN_TRANSIT': { color: 'bg-blue-100 text-blue-800', icon: '🚚', text: 'In Transit' },
                        'ARRIVED': { color: 'bg-yellow-100 text-yellow-800', icon: '📍', text: 'Arrived' },
                        'COLLECTED': { color: 'bg-green-100 text-green-800', icon: '✅', text: 'Collected' },
                        'CANCELLED': { color: 'bg-red-100 text-red-800', icon: '❌', text: 'Cancelled' }
                      };
                      const badge = badges[status] || badges['IN_TRANSIT'];
                      return (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                          <span>{badge.icon}</span>
                          {badge.text}
                        </span>
                      );
                    };

                    return (
                      <tr key={pkg.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{pkg.trackingNumber}</div>
                          <div className="text-xs text-gray-500">
                            {pkg.packageWeight}kg • {pkg.packageDescription?.substring(0, 20)}...
                          </div>
                          {pkg.isFragile && (
                            <div className="text-xs text-orange-600 mt-1">⚠️ Fragile</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(pkg.packageStatus)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800">{pkg.senderNames}</div>
                          <div className="text-xs text-gray-600">{pkg.senderPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800">{pkg.receiverNames}</div>
                          <div className="text-xs text-gray-600">{pkg.receiverPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800">
                            {pkg.origin} → {pkg.destination}
                          </div>
                          <div className="text-xs text-gray-600">
                            {new Date(pkg.travelDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800">
                            {new Date(pkg.bookingDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-600">
                            {new Date(pkg.bookingDate).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-800">
                            {pkg.price?.toLocaleString()} RWF
                          </div>
                          <div className="text-xs text-gray-600">
                            {pkg.paymentMethod}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          {bookingHistory.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Bookings:</span>
                  <span className="ml-2 font-semibold text-gray-800">{bookingHistory.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">In Transit:</span>
                  <span className="ml-2 font-semibold text-blue-600">
                    {bookingHistory.filter(p => p.packageStatus === 'IN_TRANSIT').length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Arrived:</span>
                  <span className="ml-2 font-semibold text-yellow-600">
                    {bookingHistory.filter(p => p.packageStatus === 'ARRIVED').length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Collected:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {bookingHistory.filter(p => p.packageStatus === 'COLLECTED').length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Book New Package View */}
      {viewMode === 'book' && (
        <>
          {/* Filter Section - Always Visible */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">Filter Available Trips</h2>
            </div>
            
            <form onSubmit={handleSearchTrips} className="grid grid-cols-1 md:grid-cols-7 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Origin
                </label>
                <select
                  value={searchData.origin}
                  onChange={(e) => setSearchData({ ...searchData, origin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Origins</option>
                  {origins.map((origin) => (
                    <option key={origin} value={origin}>
                      {origin}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Destination
                </label>
                <select
                  value={searchData.destination}
                  onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Destinations</option>
                  {destinations.map((destination) => (
                    <option key={destination} value={destination}>
                      {destination}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Travel Date
                </label>
                <input
                  type="date"
                  value={searchData.travelDate}
                  onChange={(e) => setSearchData({ ...searchData, travelDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-1 flex flex-col gap-2 items-end justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Search className="w-5 h-5" />
                  Filter
                </button>
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* Available Trips - Always Visible */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Available Trips ({availableTrips.length})</h2>
              <p className="text-sm text-gray-600 mt-1">Select a trip to book your package</p>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading trips...</p>
                </div>
              ) : availableTrips.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No trips available</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or check back later</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableTrips.map((trip) => (
                    <div
                      key={trip.dailyTripId}
                      className="border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleSelectTrip(trip)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <span className="font-bold text-gray-800">
                            {trip.origin} → {trip.destination}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(trip.tripDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{trip.departureTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-bold text-blue-600">RWF {trip.price}</span>
                        </div>
                        <div className="text-xs">
                          {trip.availableSeats}/{trip.totalSeats} seats available
                        </div>
                        <div className="text-xs text-gray-500">
                          Vehicle: {trip.vehiclePlateNo}
                        </div>
                      </div>
                      <button
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Select Trip
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800">Book Package for Delivery</h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleBookPackage} className="p-6 space-y-6">
              {/* Selected Trip Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Trip</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-800">
                      {selectedTrip.origin} → {selectedTrip.destination}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(selectedTrip.tripDate)} at {selectedTrip.departureTime}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrip(null);
                      setShowBookingForm(false);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Change Trip
                  </button>
                </div>
              </div>

              {/* Sender Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Sender Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={packageData.senderNames}
                      onChange={(e) => setPackageData({ ...packageData, senderNames: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={packageData.senderPhone}
                      onChange={(e) => setPackageData({ ...packageData, senderPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0788123456"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={packageData.senderEmail}
                      onChange={(e) => setPackageData({ ...packageData, senderEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ID Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={packageData.senderIdNumber}
                      onChange={(e) => setPackageData({ ...packageData, senderIdNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Receiver Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Receiver Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={packageData.receiverNames}
                      onChange={(e) => setPackageData({ ...packageData, receiverNames: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={packageData.receiverPhone}
                      onChange={(e) => setPackageData({ ...packageData, receiverPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0788654321"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={packageData.receiverEmail}
                      onChange={(e) => setPackageData({ ...packageData, receiverEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      National ID * <AlertCircle className="w-4 h-4 text-yellow-600" title="Required for collection" />
                    </label>
                    <input
                      type="text"
                      value={packageData.receiverIdNumber}
                      onChange={(e) => setPackageData({ ...packageData, receiverIdNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="1234567890123456"
                      required
                    />
                  </div>
                </div>
                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  ⚠️ Receiver must present this National ID to collect the package
                </div>
              </div>

              {/* Package Details */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <PackageIcon className="w-5 h-5 text-purple-600" />
                  Package Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Package Description
                    </label>
                    <textarea
                      value={packageData.packageDescription}
                      onChange={(e) => setPackageData({ ...packageData, packageDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Electronics, Documents, Clothing..."
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Weight (kg) *
                    </label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.1"
                        value={packageData.packageWeight}
                        onChange={(e) => setPackageData({ ...packageData, packageWeight: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="2.5"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Declared Value (RWF)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={packageData.packageValue}
                        onChange={(e) => setPackageData({ ...packageData, packageValue: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="50000"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={packageData.isFragile}
                        onChange={(e) => setPackageData({ ...packageData, isFragile: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        Fragile Package (Handle with care)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="border-t pt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPackageData({ ...packageData, paymentMethod: value })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        packageData.paymentMethod === value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">{value.replace('_', ' ')}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Estimate */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Estimated Price:</span>
                  <span className="text-2xl font-bold text-green-600">
                    RWF {calculateEstimatedPrice()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Final price based on weight and route. Minimum charge: RWF 2,000
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Book Package
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTrip(null);
                    setShowBookingForm(false);
                  }}
                  disabled={bookingLoading}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">📱 Automatic Notifications:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Sender receives SMS & Email confirmation</li>
                  <li>Receiver receives SMS & Email about incoming package</li>
                  <li>Receiver notified when package arrives at destination</li>
                  <li>Sender notified when package is collected</li>
                </ul>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageBookingManagement;