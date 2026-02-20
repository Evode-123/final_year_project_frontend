import React, { useState, useEffect } from 'react';
import { Search, X, Calendar, MapPin, Clock, DollarSign, User, Phone, CreditCard, Printer, FileText, XCircle, CheckCircle, Loader, AlertCircle } from 'lucide-react';
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

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { loadData(); }, []);

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
      setOrigins([...new Set(routesData.map(r => r.origin))].sort());
      setDestinations([...new Set(routesData.map(r => r.destination))].sort());
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Validators ───────────────────────────────────────────────
  const validators = {
    customerName: (v) => {
      if (!v.trim()) return 'Full name is required.';
      if (v.trim().length < 3) return 'Name must be at least 3 characters.';
      if (v.length > 70) return 'Full name cannot exceed 70 characters.';
      if (!v.trim().includes(' ')) return 'Please enter both first and last name.';
      const words = v.trim().split(/\s+/);
      if (words.some(w => w.length > 20)) return 'Each part of the name cannot exceed 20 characters.';
      if (!/^[a-zA-Z\s'-]+$/.test(v)) return 'Name can only contain letters, spaces, hyphens, or apostrophes.';
      return '';
    },
    customerPhone: (v) => {
      if (!v.trim()) return 'Phone number is required.';
      if (!/^\d+$/.test(v)) return 'Phone must contain digits only.';
      if (v.length !== 10) return 'Phone number must be exactly 10 digits.';
      if (!v.startsWith('07')) return 'Phone number must start with 07.';
      return '';
    },
  };

  const validate = (field, value) => validators[field] ? validators[field](value) : '';

  // Name: letters/spaces/hyphens/apostrophes, max 70 total, max 20 per word
  const handleNameChange = (e) => {
    const raw = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
    if (raw.length > 70) return;
    const words = raw.trim().split(/\s+/);
    if (words.some(w => w.length > 20)) return;
    setBookingData(prev => ({ ...prev, customerName: raw }));
    setFormErrors(prev => ({ ...prev, customerName: validate('customerName', raw) }));
  };

  // Phone: digits only, max 10, must start with 07
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (raw.length >= 2 && !raw.startsWith('07')) return;
    setBookingData(prev => ({ ...prev, customerPhone: raw }));
    setFormErrors(prev => ({ ...prev, customerPhone: validate('customerPhone', raw) }));
  };

  const runAllValidations = () => {
    const errors = {};
    ['customerName', 'customerPhone'].forEach(f => {
      const err = validate(f, bookingData[f] ?? '');
      if (err) errors[f] = err;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
    setSearchData({ origin: '', destination: '', travelDate: new Date().toISOString().split('T')[0] });
    try {
      setLoading(true);
      const trips = await transportApiService.getAvailableTrips();
      setAvailableTrips(trips);
      setSuccess('Filter cleared — showing all available trips');
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

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!runAllValidations()) return;
    if (!selectedTrip) { setError('Please select a trip first'); return; }

    try {
      setLoading(true);
      const bookingPayload = {
        dailyTripId: selectedTrip.dailyTripId,
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        paymentMethod: bookingData.paymentMethod,
        requiresPayment: false
      };
      const booking = await transportApiService.createBookingWithPayment(bookingPayload);
      setSuccess(`Booking created! Ticket: ${booking.ticketNumber}`);
      setTimeout(() => handlePrintTicket(booking.ticketNumber), 500);
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

  const handlePrintTicket = (ticketNumber) => transportApiService.printTicketHTML(ticketNumber);

  const handlePrintReceipt = async (ticketNumber) => {
    try {
      const receipt = await transportApiService.printReceipt(ticketNumber);
      const pw = window.open('', '', 'height=600,width=800');
      pw.document.write('<html><head><title>Receipt</title><style>body{font-family:monospace;white-space:pre;}</style></head><body>');
      pw.document.write(receipt);
      pw.document.write('</body></html>');
      pw.document.close();
      pw.print();
    } catch (err) {
      setError('Failed to print receipt: ' + err.message);
    }
  };

  const resetBookingForm = () => {
    setBookingData({ customerName: '', customerPhone: '', paymentMethod: PAYMENT_METHODS.CASH });
    setFormErrors({});
    setSelectedTrip(null);
    setShowBookingForm(false);
    setLoading(false);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case BOOKING_STATUS.CONFIRMED: return 'bg-green-100 text-green-800';
      case BOOKING_STATUS.CANCELLED: return 'bg-red-100 text-red-800';
      case BOOKING_STATUS.NO_SHOW: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Reusable error message
  const FieldError = ({ field }) => formErrors[field] ? (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />{formErrors[field]}
    </p>
  ) : null;

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
      formErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  const inputWithIconClass = (field) =>
    `w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
      formErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

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

      {/* Staff Banner */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2">
        <span className="text-lg">💼</span>
        <p className="text-blue-800 text-sm">
          <strong>Staff Booking Mode:</strong> Bookings are immediately confirmed. Customer pays cash in office — no online payment required.
        </p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold text-gray-800">Filter Available Trips</h2>
        </div>
        <form onSubmit={handleSearchTrips} className="grid grid-cols-2 md:grid-cols-7 gap-3">
          <div className="col-span-2 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Origin</label>
            <select
              value={searchData.origin}
              onChange={(e) => setSearchData({ ...searchData, origin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Origins</option>
              {origins.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="col-span-2 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Destination</label>
            <select
              value={searchData.destination}
              onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Destinations</option>
              {destinations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="col-span-2 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Travel Date</label>
            <input
              type="date"
              value={searchData.travelDate}
              onChange={(e) => setSearchData({ ...searchData, travelDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="col-span-2 md:col-span-1 flex flex-col gap-2 justify-end">
            <button type="submit" className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <Search className="w-4 h-4" /> Filter
            </button>
            <button type="button" onClick={handleClearFilter} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </form>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">{success}</span>
          <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Complete Booking</h2>
              <button onClick={resetBookingForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* Selected Trip Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Selected Trip</p>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">
                      {selectedTrip.origin} → {selectedTrip.destination}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {formatDate(selectedTrip.tripDate)} · {selectedTrip.departureTime}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Vehicle: {selectedTrip.vehiclePlateNo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-blue-600">RWF {selectedTrip.price?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{selectedTrip.availableSeats} seats left</div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Customer Information
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={bookingData.customerName}
                      onChange={handleNameChange}
                      className={inputClass('customerName')}
                      placeholder="John Doe"
                      maxLength={70}
                      disabled={loading}
                    />
                    <div className="flex items-center justify-between mt-0.5">
                      <FieldError field="customerName" />
                      <span className={`text-xs ml-auto ${bookingData.customerName.length >= 70 ? 'text-red-500' : 'text-gray-400'}`}>
                        {bookingData.customerName.length}/70
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="tel"
                        value={bookingData.customerPhone}
                        onChange={handlePhoneChange}
                        className={inputWithIconClass('customerPhone')}
                        placeholder="07XXXXXXXX"
                        maxLength={10}
                        disabled={loading}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <FieldError field="customerPhone" />
                      <span className={`text-xs ml-auto ${bookingData.customerPhone.length === 10 ? 'text-green-500' : 'text-gray-400'}`}>
                        {bookingData.customerPhone.length}/10
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Payment Method *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setBookingData(prev => ({ ...prev, paymentMethod: value }))}
                        disabled={loading}
                        className={`p-2.5 rounded-lg border-2 transition-colors text-center ${
                          bookingData.paymentMethod === value
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                        } disabled:opacity-50`}
                      >
                        <CreditCard className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-xs font-medium">{value.replace('_', ' ')}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Recording payment method for reference only.</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={resetBookingForm}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? (
                      <><Loader className="w-4 h-4 animate-spin" />Creating...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" />Confirm Booking</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Today's Bookings Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Today's Bookings ({todayBookings.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ticket</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Route</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Seat</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {todayBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-800 text-sm">{booking.ticketNumber}</div>
                    <div className="text-xs text-gray-500">{new Date(booking.bookingDate).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-800 text-sm">{booking.customer?.names}</div>
                    <div className="text-xs text-gray-600">{booking.customer?.phoneNumber}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-sm text-gray-800">{booking.dailyTrip?.route?.origin} → {booking.dailyTrip?.route?.destination}</div>
                    <div className="text-xs text-gray-600">{booking.dailyTrip?.timeSlot?.departureTime}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-800 text-sm">{booking.seatNumber}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-800 text-sm">RWF {booking.price?.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">{booking.paymentMethod}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(booking.bookingStatus)}`}>
                      {booking.bookingStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handlePrintTicket(booking.ticketNumber)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Print Ticket">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => handlePrintReceipt(booking.ticketNumber)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Print Receipt">
                        <FileText className="w-4 h-4" />
                      </button>
                      {booking.bookingStatus === BOOKING_STATUS.CONFIRMED && (
                        <button onClick={() => handleCancelBooking(booking.id, booking.ticketNumber)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel Booking">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {todayBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">No bookings today yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Trips */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Available Trips ({availableTrips.length})</h2>
          <p className="text-xs text-gray-500 mt-0.5">Click "Book Now" to create a booking for a walk-in customer</p>
        </div>
        <div className="p-5">
          {availableTrips.length === 0 ? (
            <div className="text-center py-10">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No trips available</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTrips.map((trip) => (
                <div key={trip.dailyTripId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="font-bold text-gray-800 text-sm">{trip.origin} → {trip.destination}</span>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">{formatDate(trip.tripDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">{trip.departureTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold text-blue-600">RWF {trip.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{trip.availableSeats}/{trip.totalSeats} seats</span>
                      <span>{trip.vehiclePlateNo}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectTrip(trip)}
                    disabled={trip.availableSeats === 0}
                    className={`w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      trip.availableSeats === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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