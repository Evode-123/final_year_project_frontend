import React, { useState } from 'react';
import { X, User, Phone, DollarSign, Calendar, Clock, MapPin, AlertCircle, CheckCircle, Loader, Download, Printer, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import transportApiService from '../../services/transportApiService';
import { generateTicketPDF } from '../../utils/pdfTicketGenerator';
import FeedbackFormModal from '../feedback/FeedbackFormModal';

const BookingModal = ({ trip, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    paymentMethod: 'CASH'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const bookingData = {
        dailyTripId: trip.dailyTripId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        paymentMethod: formData.paymentMethod
      };

      const result = await transportApiService.createBooking(bookingData);
      setBooking(result);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = () => {
    transportApiService.printTicketHTML(booking.ticketNumber);
  };

  const handleDownloadTicket = () => {
    try {
      // Generate PDF in the frontend
      generateTicketPDF(booking);
    } catch (err) {
      setError('Failed to download ticket: ' + err.message);
    }
  };

  // ✅ UPDATED: Close modal and refresh trips (goes back to search page)
  const handleFinish = () => {
    onSuccess(); // This refreshes the trip list
    onClose();   // This closes the modal
  };

  const handleRateExperience = () => {
    setShowFeedbackForm(true);
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackForm(false);
    // Optional: Show a thank you message
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
            <div>
              <h3 className="text-2xl font-bold">Book Your Trip</h3>
              <p className="text-blue-100 text-sm mt-1">Step {step} of 3</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Booking Form */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Trip Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Trip Details</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Route:</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-2">
                        {trip.origin} <MapPin className="w-4 h-4 text-blue-600" /> {trip.destination}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(trip.tripDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Departure Time:</span>
                      <span className="font-semibold text-gray-800">{trip.departureTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Vehicle:</span>
                      <span className="font-semibold text-gray-800">{trip.vehiclePlateNo}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                      <span className="text-lg font-semibold text-gray-800">Price:</span>
                      <span className="text-2xl font-bold text-blue-600">RWF {trip.price}</span>
                    </div>
                  </div>
                </div>

                {/* Passenger Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Enter passenger full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="07XXXXXXXX"
                      pattern="[0-9]{10}"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter a valid 10-digit phone number
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Payment Method *
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="CASH">Cash</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="CARD">Card</option>
                    </select>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Confirm Booking'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && booking && (
              <div className="space-y-6">
                {/* Success Message */}
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-600">Your trip has been successfully booked</p>
                </div>

                {/* Booking Details */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Booking Information</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Ticket Number:</span>
                      <span className="font-bold text-xl text-green-600">{booking.ticketNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Passenger:</span>
                      <span className="font-semibold text-gray-800">{booking.customer.names}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold text-gray-800">{booking.customer.phoneNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Seat Number:</span>
                      <span className="font-semibold text-gray-800">{booking.seatNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-semibold text-gray-800">{booking.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-green-200">
                      <span className="text-lg font-semibold text-gray-800">Amount Paid:</span>
                      <span className="text-2xl font-bold text-green-600">RWF {booking.price}</span>
                    </div>
                  </div>
                </div>

                {/* Important Information */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Important Information
                  </h5>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>Please arrive 15 minutes before departure</li>
                    <li>Present your ticket number when boarding</li>
                    <li>Keep your ticket number safe for reference</li>
                    <li>No refunds on departure day</li>
                  </ul>
                </div>

                {/* Rate Experience Section */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        Rate Your Booking Experience
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">Help us improve our service</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRateExperience}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <Star className="w-5 h-5" />
                    Share Your Feedback
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handlePrintTicket}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    <Printer className="w-5 h-5" />
                    Print Ticket
                  </button>
                  <button
                    onClick={handleDownloadTicket}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>
                </div>

                {/* ✅ UPDATED: Two options for user */}
                <div className="space-y-3">
                  <button
                    onClick={handleFinish}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold"
                  >
                    Book Another Trip
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    Or go to{' '}
                    <button
                      onClick={() => {
                        onSuccess();
                        onClose();
                        // This will close modal and user can manually navigate to My Bookings
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      My Bookings
                    </button>
                    {' '}to view all your tickets
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackForm && (
        <FeedbackFormModal
          onClose={() => setShowFeedbackForm(false)}
          onSuccess={handleFeedbackSuccess}
          bookingReference={booking?.ticketNumber}
          initialData={{
            customerName: booking?.customer?.names,
            customerEmail: user?.email || '',
            customerPhone: booking?.customer?.phoneNumber
          }}
        />
      )}
    </>
  );
};

export default BookingModal;