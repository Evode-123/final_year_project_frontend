import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  AlertCircle, 
  X, 
  Loader, 
  Printer, 
  Download,
  CheckCircle,
  XCircle,
  Filter,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import transportApiService from '../../services/transportApiService';
import { generateTicketPDF } from '../../utils/pdfTicketGenerator';

const MyBookingsPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [allBookings, setAllBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadMyBookings();
  }, []);

  useEffect(() => {
    categorizeBookings();
  }, [allBookings, statusFilter]);

  const loadMyBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const myBookings = await transportApiService.getMyBookingHistory();
      setAllBookings(myBookings);
    } catch (err) {
      setError('Failed to load bookings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if a trip has departed (ticket is expired/consumed)
  const isTripDeparted = (booking) => {
    if (!booking.dailyTrip || !booking.dailyTrip.tripDate || !booking.dailyTrip.timeSlot) {
      return false;
    }

    try {
      const tripDate = new Date(booking.dailyTrip.tripDate);
      const departureTime = booking.dailyTrip.timeSlot.departureTime;
      
      // Parse departure time (format: "HH:MM" or "HH:MM:SS")
      const [hours, minutes] = departureTime.split(':').map(Number);
      
      // Set the departure datetime
      tripDate.setHours(hours, minutes, 0, 0);
      
      // Compare with current time
      const now = new Date();
      return now > tripDate;
    } catch (error) {
      console.error('Error checking trip departure time:', error);
      return false;
    }
  };

  const categorizeBookings = () => {
    let active = [];
    let history = [];

    allBookings.forEach(booking => {
      const isDeparted = isTripDeparted(booking);
      const isCancelled = booking.bookingStatus === 'CANCELLED';

      if (isCancelled || isDeparted) {
        // Cancelled or expired tickets go to history
        history.push(booking);
      } else {
        // Active confirmed bookings that haven't departed yet
        if (booking.bookingStatus === 'CONFIRMED') {
          active.push(booking);
        } else {
          // Other statuses go to history
          history.push(booking);
        }
      }
    });

    // Apply status filter for history
    if (statusFilter !== 'ALL') {
      history = history.filter(b => b.bookingStatus === statusFilter);
    }

    // Sort by trip date (newest first)
    active.sort((a, b) => new Date(b.dailyTrip.tripDate) - new Date(a.dailyTrip.tripDate));
    history.sort((a, b) => new Date(b.dailyTrip.tripDate) - new Date(a.dailyTrip.tripDate));

    setActiveBookings(active);
    setHistoryBookings(history);
  };

  // Calculate revenue statistics
  const calculateRevenue = () => {
    const activeRevenue = activeBookings
      .filter(b => b.bookingStatus === 'CONFIRMED')
      .reduce((sum, b) => sum + parseFloat(b.price || 0), 0);

    const historyRevenue = historyBookings
      .filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'CANCELLED')
      .reduce((sum, b) => sum + parseFloat(b.price || 0), 0);

    const cancelledRevenue = historyBookings
      .filter(b => b.bookingStatus === 'CANCELLED')
      .reduce((sum, b) => sum + parseFloat(b.price || 0), 0);

    const totalSpent = allBookings
      .filter(b => b.bookingStatus === 'CONFIRMED')
      .reduce((sum, b) => sum + parseFloat(b.price || 0), 0);

    return {
      activeRevenue,
      historyRevenue,
      cancelledRevenue,
      totalSpent
    };
  };

  const revenue = calculateRevenue();

  const handleCancelClick = (booking) => {
    // Double check that trip hasn't departed
    if (isTripDeparted(booking)) {
      setError('Cannot cancel - this trip has already departed');
      return;
    }

    setSelectedBooking(booking);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      return;
    }

    try {
      setCancellingId(selectedBooking.id);
      await transportApiService.cancelBooking(selectedBooking.id, cancelReason);
      
      // Refresh bookings
      await loadMyBookings();
      
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
    } catch (err) {
      setError('Failed to cancel booking: ' + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const handlePrintTicket = (ticketNumber) => {
    transportApiService.printTicketHTML(ticketNumber);
  };

  const handleDownloadTicket = (booking) => {
    try {
      generateTicketPDF(booking);
    } catch (err) {
      setError('Failed to download ticket: ' + err.message);
    }
  };

  const getStatusBadge = (booking) => {
    const isDeparted = isTripDeparted(booking);
    
    if (isDeparted && booking.bookingStatus === 'CONFIRMED') {
      return (
        <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3" />
          EXPIRED
        </div>
      );
    }

    const badges = {
      CONFIRMED: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: <CheckCircle className="w-3 h-3" />
      },
      CANCELLED: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: <XCircle className="w-3 h-3" />
      },
      NO_SHOW: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: <AlertCircle className="w-3 h-3" />
      }
    };

    const badge = badges[booking.bookingStatus] || badges.CONFIRMED;

    return (
      <div className={`flex items-center gap-1 px-2 py-1 ${badge.bg} ${badge.text} rounded-full text-xs font-semibold`}>
        {badge.icon}
        {booking.bookingStatus}
      </div>
    );
  };

  const renderBookingCard = (booking, showCancelButton = false) => {
    const isDeparted = isTripDeparted(booking);
    const canCancel = showCancelButton && !isDeparted && booking.bookingStatus === 'CONFIRMED';

    return (
      <div
        key={booking.id}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-600">{booking.ticketNumber}</p>
              <p className="text-xs text-gray-500">Seat {booking.seatNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(booking)}
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">RWF {booking.price}</p>
            </div>
          </div>
        </div>

        {/* Compact Trip Details */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Route</p>
                <p className="text-sm font-semibold text-gray-800">
                  {booking.dailyTrip.route.origin} → {booking.dailyTrip.route.destination}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Passenger</p>
                <p className="text-sm font-semibold text-gray-800">{booking.customer.names}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Date & Time</p>
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(booking.dailyTrip.tripDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-gray-600">{booking.dailyTrip.timeSlot.departureTime}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Contact</p>
                <p className="text-sm font-semibold text-gray-800">{booking.customer.phoneNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Vehicle Info */}
        <div className="bg-gray-50 rounded-lg p-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="text-gray-600">
                Payment: <span className="font-semibold text-gray-800">{booking.paymentMethod}</span>
              </span>
              <span className="text-gray-600">
                Vehicle: <span className="font-semibold text-gray-800">{booking.dailyTrip.vehicle.plateNo}</span>
              </span>
            </div>
            <span className="font-semibold text-green-600">{booking.paymentStatus}</span>
          </div>
        </div>

        {/* Cancellation Info */}
        {booking.bookingStatus === 'CANCELLED' && booking.cancellationReason && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2">
            <p className="text-xs text-red-800">
              <strong>Cancelled:</strong> {booking.cancellationReason}
            </p>
            {booking.cancelledAt && (
              <p className="text-xs text-red-600 mt-1">
                {new Date(booking.cancelledAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Expired Warning */}
        {isDeparted && booking.bookingStatus === 'CONFIRMED' && (
          <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <p className="text-xs text-yellow-800 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <strong>This ticket has expired - trip has departed</strong>
            </p>
          </div>
        )}

        {/* Compact Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handlePrintTicket(booking.ticketNumber)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
          >
            <Printer className="w-3 h-3" />
            Print
          </button>
          <button
            onClick={() => handleDownloadTicket(booking)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
          {canCancel && (
            <button
              onClick={() => handleCancelClick(booking)}
              disabled={cancellingId === booking.id}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-xs ml-auto"
            >
              {cancellingId === booking.id ? (
                <>
                  <Loader className="w-3 h-3 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="w-3 h-3" />
                  Cancel
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600 mt-4">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">My Bookings</h3>
          <p className="text-sm text-gray-600 mt-1">View and manage your trips</p>
        </div>
        <button
          onClick={loadMyBookings}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Loader className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Revenue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Spent</p>
          <p className="text-2xl font-bold">RWF {revenue.totalSpent.toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-1">{allBookings.length} total bookings</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Ticket className="w-8 h-8 opacity-80" />
            <CheckCircle className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm opacity-90 mb-1">Active Bookings</p>
          <p className="text-2xl font-bold">RWF {revenue.activeRevenue.toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-1">{activeBookings.length} upcoming trips</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
            <Clock className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm opacity-90 mb-1">History Value</p>
          <p className="text-2xl font-bold">RWF {revenue.historyRevenue.toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-1">{historyBookings.length} past trips</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 opacity-80" />
            <AlertCircle className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm opacity-90 mb-1">Cancelled</p>
          <p className="text-2xl font-bold">RWF {revenue.cancelledRevenue.toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-1">
            {historyBookings.filter(b => b.bookingStatus === 'CANCELLED').length} cancellations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-1 flex gap-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Active Bookings ({activeBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          History ({historyBookings.length})
        </button>
      </div>

      {/* Filter for History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Expired/Used</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'active' ? (
        // Active Bookings
        activeBookings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No active bookings</p>
            <p className="text-gray-500 text-sm mt-2">Your upcoming trips will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBookings.map((booking) => renderBookingCard(booking, true))}
          </div>
        )
      ) : (
        // History
        historyBookings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No booking history</p>
            <p className="text-gray-500 text-sm mt-2">
              {statusFilter !== 'ALL' 
                ? 'Try adjusting your filter'
                : 'Your past trips will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {historyBookings.map((booking) => renderBookingCard(booking, false))}
          </div>
        )
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-red-600 text-white p-6 rounded-t-xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Cancel Booking
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> You are about to cancel your booking for:
                </p>
                <p className="text-sm text-yellow-800 mt-2 font-semibold">
                  {selectedBooking.dailyTrip.route.origin} → {selectedBooking.dailyTrip.route.destination}
                </p>
                <p className="text-sm text-yellow-800">
                  Ticket: {selectedBooking.ticketNumber}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  rows="3"
                  placeholder="Please provide a reason for cancellation..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                    setCancelReason('');
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={!cancelReason.trim() || cancellingId}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancellingId ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPanel;