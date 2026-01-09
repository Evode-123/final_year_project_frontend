import React, { useState, useEffect } from 'react';
import { Plus, Search, X, Calendar, MapPin, Clock, DollarSign, User, Phone, CreditCard, Printer, FileText, XCircle, CheckCircle } from 'lucide-react';
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
  const [availableTrips, setAvailableTrips] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trips, bookings] = await Promise.all([
        transportApiService.getAvailableTrips(),
        transportApiService.getTodayBookings()
      ]);
      setAvailableTrips(trips);
      setTodayBookings(bookings);
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
      setShowSearchForm(false);
    } catch (err) {
      setError('Failed to search trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    setShowBookingForm(true);
    setShowSearchForm(false);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTrip) {
      setError('Please select a trip first');
      return;
    }

    try {
      const booking = await transportApiService.createBooking({
        dailyTripId: selectedTrip.dailyTripId,
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        paymentMethod: bookingData.paymentMethod
      });

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

  if (loading) {
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
          <p className="text-gray-600 mt-1">Create bookings and manage tickets</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSearchForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Search className="w-5 h-5" />
            Search Trips
          </button>
          <button
            onClick={() => {
              setShowBookingForm(true);
              setSelectedTrip(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Booking
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
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Search Form Modal */}
      {showSearchForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Search Trips</h2>
              <button
                onClick={() => setShowSearchForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Origin
                </label>
                <input
                  type="text"
                  value={searchData.origin}
                  onChange={(e) => setSearchData({ ...searchData, origin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Kigali"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Destination
                </label>
                <input
                  type="text"
                  value={searchData.destination}
                  onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Musanze"
                />
              </div>

              <div>
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

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleSearchTrips}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
                <button
                  onClick={() => setShowSearchForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form */}
      {showBookingForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Create New Booking</h2>
            <button
              onClick={() => {
                resetBookingForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!selectedTrip ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Select a Trip</h3>
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {availableTrips.map((trip) => (
                  <button
                    key={trip.dailyTripId}
                    onClick={() => handleSelectTrip(trip)}
                    className="text-left p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-gray-800">
                          {trip.origin} → {trip.destination}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">RWF {trip.price}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(trip.tripDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{trip.departureTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{trip.availableSeats}/{trip.totalSeats} seats available</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Vehicle: {trip.vehiclePlateNo}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
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
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">RWF {selectedTrip.price}</div>
                    <div className="text-xs text-gray-600">{selectedTrip.availableSeats} seats left</div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
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
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          bookingData.paymentMethod === value
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

                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    onClick={handleCreateBooking}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => setSelectedTrip(null)}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Change Trip
                  </button>
                </div>
              </div>
            </div>
          )}
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

      {/* Available Trips */}
      {!showBookingForm && availableTrips.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Available Trips ({availableTrips.length})</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                </div>
                <button
                  onClick={() => handleSelectTrip(trip)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsManagement;