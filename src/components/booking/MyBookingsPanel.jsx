import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, Clock, MapPin, User, Phone, AlertCircle, X, Loader, Printer, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import transportApiService from '../../services/transportApiService';
import { generateTicketPDF } from '../../utils/pdfTicketGenerator';

const MyBookingsPanel = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadMyBookings();
  }, []);

  const loadMyBookings = async () => {
    try {
      setLoading(true);
      setError('');
      // Get today's bookings - this will show all bookings made by the logged-in user
      const allBookings = await transportApiService.getTodayBookings();
      
      // Filter to show only confirmed bookings
      const confirmedBookings = allBookings.filter(b => b.bookingStatus === 'CONFIRMED');
      setBookings(confirmedBookings);
    } catch (err) {
      setError('Failed to load bookings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (booking) => {
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
      // Generate PDF in the frontend
      generateTicketPDF(booking);
    } catch (err) {
      setError('Failed to download ticket: ' + err.message);
    }
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
          <h3 className="text-lg font-semibold text-gray-800">My Active Bookings</h3>
          <p className="text-sm text-gray-600 mt-1">View and manage your upcoming trips</p>
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
        </div>
      )}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No active bookings</p>
          <p className="text-gray-500 text-sm mt-2">Your booked trips will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all"
            >
              {/* Ticket Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Ticket Number</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{booking.ticketNumber}</p>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {booking.bookingStatus}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Seat: <span className="font-semibold text-gray-800">{booking.seatNumber}</span>
                  </p>
                </div>
              </div>

              {/* Trip Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Route</p>
                      <p className="font-semibold text-gray-800">
                        {booking.dailyTrip.route.origin} → {booking.dailyTrip.route.destination}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Travel Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(booking.dailyTrip.tripDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Departure Time</p>
                      <p className="font-semibold text-gray-800">{booking.dailyTrip.timeSlot.departureTime}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Passenger</p>
                      <p className="font-semibold text-gray-800">{booking.customer.names}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-semibold text-gray-800">{booking.customer.phoneNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Vehicle</p>
                      <p className="font-semibold text-gray-800">{booking.dailyTrip.vehicle.plateNo}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Payment Method: <span className="font-semibold">{booking.paymentMethod}</span></p>
                    <p className="text-sm text-gray-600">Status: <span className="font-semibold text-green-600">{booking.paymentStatus}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-2xl font-bold text-blue-600">RWF {booking.price}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handlePrintTicket(booking.ticketNumber)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Ticket
                </button>
                <button
                  onClick={() => handleDownloadTicket(booking)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => handleCancelClick(booking)}
                  disabled={cancellingId === booking.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {cancellingId === booking.id ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Cancel Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
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