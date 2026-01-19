import React, { useState, useEffect } from 'react';
import { History, Ticket, Calendar, MapPin, User, Phone, Search, Filter, Loader, AlertCircle, CheckCircle, XCircle, Download, Printer, XOctagon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import transportApiService from '../../services/transportApiService';

const BookingHistoryPanel = () => {
  const { user } = useAuth();
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // ✅ Determine if user is receptionist/admin/manager
  const isStaffMember = [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.RECEPTIONIST].includes(user?.role);

  useEffect(() => {
    loadBookingHistory();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchTerm, statusFilter, allBookings]);

  // ✅ UPDATED: Load appropriate bookings based on role
  const loadBookingHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      // ✅ Receptionist/Admin/Manager see ALL bookings
      // ✅ Regular users see only THEIR bookings
      const bookings = isStaffMember 
        ? await transportApiService.getAllBookingsHistory()
        : await transportApiService.getMyBookingHistory();
      
      setAllBookings(bookings);
    } catch (err) {
      setError('Failed to load booking history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...allBookings];

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(b => b.bookingStatus === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.ticketNumber.toLowerCase().includes(term) ||
        b.customer.names.toLowerCase().includes(term) ||
        b.customer.phoneNumber.includes(term) ||
        b.dailyTrip.route.origin.toLowerCase().includes(term) ||
        b.dailyTrip.route.destination.toLowerCase().includes(term)
      );
    }

    // Sort by booking date (newest first)
    filtered.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

    setFilteredBookings(filtered);
  };

  // ✅ Handle cancel booking
  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    try {
      setCancellingId(selectedBooking.id);
      await transportApiService.cancelBooking(selectedBooking.id, cancelReason);
      
      // Refresh bookings
      await loadBookingHistory();
      
      // Close modal and reset
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
      
      alert('Booking cancelled successfully!');
    } catch (err) {
      alert('Failed to cancel booking: ' + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  // ✅ Handle download ticket
  const handleDownloadTicket = async (ticketNumber) => {
    try {
      await transportApiService.downloadTicket(ticketNumber);
    } catch (err) {
      alert('Failed to download ticket: ' + err.message);
    }
  };

  // ✅ Handle print ticket
  const handlePrintTicket = (ticketNumber) => {
    transportApiService.printTicketHTML(ticketNumber);
  };

  const getStatusBadge = (status) => {
    const badges = {
      CONFIRMED: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: <CheckCircle className="w-4 h-4" />
      },
      CANCELLED: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: <XCircle className="w-4 h-4" />
      },
      NO_SHOW: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: <AlertCircle className="w-4 h-4" />
      }
    };

    const badge = badges[status] || badges.CONFIRMED;

    return (
      <div className={`flex items-center gap-2 px-3 py-1 ${badge.bg} ${badge.text} rounded-full text-sm font-semibold`}>
        {badge.icon}
        {status}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600 mt-4">Loading booking history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {isStaffMember ? 'All Bookings History' : 'My Booking History'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isStaffMember 
                ? 'View and manage all customer bookings' 
                : 'View all your past and current bookings'}
            </p>
          </div>
          <button
            onClick={loadBookingHistory}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Loader className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ticket number, name, phone, or route..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-800">{allBookings.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">
            {allBookings.filter(b => b.bookingStatus === 'CONFIRMED').length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">
            {allBookings.filter(b => b.bookingStatus === 'CANCELLED').length}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-600">
            RWF {allBookings
              .filter(b => b.bookingStatus === 'CONFIRMED')
              .reduce((sum, b) => sum + parseFloat(b.price), 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No bookings found</p>
          <p className="text-gray-500 text-sm mt-2">
            {searchTerm || statusFilter !== 'ALL' 
              ? 'Try adjusting your search or filters'
              : 'Booking history will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Showing {filteredBookings.length} of {allBookings.length} bookings
          </p>

          <div className="grid grid-cols-1 gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800">{booking.ticketNumber}</p>
                      <p className="text-sm text-gray-500">
                        Booked on {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(booking.bookingStatus)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Route</p>
                      <p className="font-semibold text-gray-800">
                        {booking.dailyTrip.route.origin} → {booking.dailyTrip.route.destination}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Travel Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(booking.dailyTrip.tripDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">{booking.dailyTrip.timeSlot.departureTime}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Passenger</p>
                      <p className="font-semibold text-gray-800">{booking.customer.names}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {booking.customer.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Seat: <span className="font-semibold">{booking.seatNumber}</span></p>
                      <p className="text-sm text-gray-600">Vehicle: <span className="font-semibold">{booking.dailyTrip.vehicle.plateNo}</span></p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment</p>
                      <p className="text-sm font-semibold text-gray-800">{booking.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-xl font-bold text-blue-600">RWF {booking.price}</p>
                  </div>
                </div>

                {booking.bookingStatus === 'CANCELLED' && booking.cancellationReason && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <strong>Cancellation Reason:</strong> {booking.cancellationReason}
                    </p>
                    {booking.cancelledAt && (
                      <p className="text-xs text-red-600 mt-1">
                        Cancelled on {new Date(booking.cancelledAt).toLocaleString()}
                        {booking.cancelledBy && ` by ${booking.cancelledBy}`}
                      </p>
                    )}
                  </div>
                )}

                {/* ✅ ACTION BUTTONS */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3">
                  <button
                    onClick={() => handlePrintTicket(booking.ticketNumber)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print Ticket
                  </button>

                  <button
                    onClick={() => handleDownloadTicket(booking.ticketNumber)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>

                  {/* ✅ Only show cancel button for confirmed bookings */}
                  {booking.bookingStatus === 'CONFIRMED' && (
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowCancelModal(true);
                      }}
                      disabled={cancellingId === booking.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed ml-auto"
                    >
                      {cancellingId === booking.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XOctagon className="w-4 h-4" />
                          Cancel Booking
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ CANCEL BOOKING MODAL */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Cancel Booking</h3>
            
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Ticket:</strong> {selectedBooking.ticketNumber}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>Passenger:</strong> {selectedBooking.customer.names}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>Route:</strong> {selectedBooking.dailyTrip.route.origin} → {selectedBooking.dailyTrip.route.destination}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                  setCancelReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={!cancelReason.trim() || cancellingId === selectedBooking.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {cancellingId === selectedBooking.id ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistoryPanel;