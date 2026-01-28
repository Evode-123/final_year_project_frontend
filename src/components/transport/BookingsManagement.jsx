// ============================================
// UPDATED BookingsManagement.jsx (For Admin/Manager/Receptionist)
// This version bypasses payment for staff bookings
// ============================================

import React, { useState, useEffect } from 'react';
import { Search, X, Calendar, MapPin, Clock, DollarSign, User, Phone, CreditCard, Printer, FileText, XCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import transportApiService from '../../services/transportApiService';

const PAYMENT_METHODS = {
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY',
  CARD: 'CARD'
};

const BOOKING_STATUS = {
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

const BookingsManagement = () => {
  const { user } = useAuth();
  const [availableTrips, setAvailableTrips] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchData, setSearchData] = useState({
    origin: '',
    destination: '',
    travelDate: new Date().toISOString().split('T')[0]
  });

  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerPhone: '',
    paymentMethod: PAYMENT_METHODS.CASH
  });

  // ✅ Check if user is staff
  const isStaff = [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.RECEPTIONIST].includes(user?.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trips, bookings, routesData] = await Promise.all([
        transportApiService.getAvailableTrips(),
        transportApiService.getTodayBookings(),
        transportApiService.getAllRoutes()
      ]);
      setAvailableTrips(trips);
      setTodayBookings(bookings);
      setRoutes(routesData);
      
      const uniqueOrigins = [...new Set(routesData.map(route => route.origin))].sort();
      const uniqueDestinations = [...new Set(routesData.map(route => route.destination))].sort();
      
      setOrigins(uniqueOrigins);
      setDestinations(uniqueDestinations);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
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
    } catch (err) {
      setError('Failed to search trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = async () => {
    setError('');
    setSuccess('');
    
    setSearchData({
      origin: '',
      destination: '',
      travelDate: new Date().toISOString().split('T')[0]
    });
    
    try {
      setLoading(true);
      const trips = await transportApiService.getAvailableTrips();
      setAvailableTrips(trips);
      setSuccess('Filter cleared - showing all available trips');
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

  // ✅ UPDATED: Use new payment-enabled endpoint
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTrip) {
      setError('Please select a trip first');
      return;
    }

    try {
      setLoading(true);

      // ✅ Staff bookings bypass payment
      const bookingPayload = {
        dailyTripId: selectedTrip.dailyTripId,
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        paymentMethod: bookingData.paymentMethod,
        requiresPayment: false // Staff always bypasses payment
      };

      const booking = await transportApiService.createBookingWithPayment(bookingPayload);

      setSuccess(`Booking created successfully! Ticket: ${booking.ticketNumber}`);
      
      // Print ticket automatically
      setTimeout(() => {
        handlePrintTicket(booking.ticketNumber);
      }, 500);

      // Reset form and reload data
      resetBookingForm();
      await loadData();
    } catch (err) {
      setError('Failed to create booking: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId, ticketNumber) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;

    if (!window.confirm(`Are you sure you want to cancel ticket ${ticketNumber}?`)) return;

    try {
      await transportApiService.cancelBooking(bookingId, reason);
      setSuccess('Booking cancelled successfully!');
      await loadData();
    } catch (err) {
      setError('Failed to cancel booking: ' + err.message);
    }
  };

  const handlePrintTicket = (ticketNumber) => {
    transportApiService.printTicketHTML(ticketNumber);
  };

  const handlePrintReceipt = async (ticketNumber) => {
    try {
      const receipt = await transportApiService.printReceipt(ticketNumber);
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>Receipt</title>');
      printWindow.document.write('<style>body { font-family: monospace; white-space: pre; }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(receipt);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    } catch (err) {
      setError('Failed to print receipt: ' + err.message);
    }
  };

  const resetBookingForm = () => {
    setBookingData({
      customerName: '',
      customerPhone: '',
      paymentMethod: PAYMENT_METHODS.CASH
    });
    setSelectedTrip(null);
    setShowBookingForm(false);
    setLoading(false);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case BOOKING_STATUS.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case BOOKING_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      case BOOKING_STATUS.NO_SHOW:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !showBookingForm) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Bookings Management</h1>
          <p className="text-gray-600 mt-1">Filter trips and book tickets for walk-in customers</p>
        </div>
      </div>

      {/* ✅ Staff Info Banner */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 font-medium">
          💼 <strong>Staff Booking Mode:</strong> Bookings created here are immediately confirmed. 
          Customer pays cash in office - no online payment required.
        </p>
      </div>

      {/* Filter Section */}
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Complete Booking</h2>
              <button
                onClick={() => resetBookingForm()}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Selected Trip Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Trip</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-800">
                      {selectedTrip.origin} → {selectedTrip.destination}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(selectedTrip.tripDate)} at {selectedTrip.departureTime}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Vehicle: {selectedTrip.vehiclePlateNo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">RWF {selectedTrip.price}</div>
                    <div className="text-xs text-gray-600">{selectedTrip.availableSeats} seats left</div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Customer Information
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={bookingData.customerName}
                    onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={bookingData.customerPhone}
                      onChange={(e) => setBookingData({ ...bookingData, customerPhone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0788123456"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setBookingData({ ...bookingData, paymentMethod: value })}
                        disabled={loading}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          bookingData.paymentMethod === value
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                        } disabled:opacity-50`}
                      >
                        <CreditCard className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xs font-medium">{value.replace('_', ' ')}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Customer pays cash in office. Recording payment method for reference only.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => resetBookingForm()}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Creating Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirm Booking
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Today's Bookings */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Today's Bookings ({todayBookings.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Seat</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {todayBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{booking.ticketNumber}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(booking.bookingDate).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{booking.customer?.names}</div>
                    <div className="text-xs text-gray-600">{booking.customer?.phoneNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-800">
                      {booking.dailyTrip?.route?.origin} → {booking.dailyTrip?.route?.destination}
                    </div>
                    <div className="text-xs text-gray-600">
                      {booking.dailyTrip?.timeSlot?.departureTime}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">{booking.seatNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">RWF {booking.price}</div>
                    <div className="text-xs text-gray-600">{booking.paymentMethod}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(booking.bookingStatus)}`}>
                      {booking.bookingStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handlePrintTicket(booking.ticketNumber)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Print Ticket"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(booking.ticketNumber)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Print Receipt"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {booking.bookingStatus === BOOKING_STATUS.CONFIRMED && (
                        <button
                          onClick={() => handleCancelBooking(booking.id, booking.ticketNumber)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel Booking"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Trips Cards */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Available Trips ({availableTrips.length})</h2>
          <p className="text-sm text-gray-600 mt-1">Click "Book Now" to create a booking for a walk-in customer</p>
        </div>
        <div className="p-6">
          {availableTrips.length === 0 ? (
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
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                    onClick={() => handleSelectTrip(trip)}
                    disabled={trip.availableSeats === 0}
                    className={`w-full px-4 py-2 rounded-lg transition-colors ${
                      trip.availableSeats === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {trip.availableSeats === 0 ? 'Fully Booked' : 'Book Now'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsManagement;