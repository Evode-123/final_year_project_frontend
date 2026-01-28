import React, { useState, useEffect } from 'react';
import { 
  X, User, Phone, DollarSign, Calendar, Clock, MapPin, 
  AlertCircle, CheckCircle, Loader, Download, Printer, 
  Star, CreditCard, Smartphone, ExternalLink, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import transportApiService from '../../services/transportApiService';
import { generateTicketPDF } from '../../utils/pdfTicketGenerator';
import FeedbackFormModal from '../feedback/FeedbackFormModal';

const BookingModal = ({ trip, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false); // ✅ NEW

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    paymentMethod: 'CASH'
  });

  const isStaff = [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.RECEPTIONIST].includes(user?.role);
  const requiresPayment = !isStaff && formData.paymentMethod === 'MOBILE_MONEY';

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const bookingData = {
        dailyTripId: trip.dailyTripId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        paymentMethod: formData.paymentMethod,
        requiresPayment: requiresPayment
      };

      const result = await transportApiService.createBookingWithPayment(bookingData);
      setBooking(result);

      if (result.bookingStatus === 'PENDING' && result.paypackRef) {
        console.log('✅ Paypack payment initiated:', result.paypackRef);
        console.log('📱 User will receive SMS prompt on:', formData.customerPhone);
        
        setStep(2);
        setPaymentStatus('PENDING');
        
        checkPaymentImmediately(result.paypackRef);
        
      } else {
        setStep(3);
      }
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentImmediately = async (paypackRef) => {
    console.log('🔍 Starting payment check for:', paypackRef);
    
    // ✅ Wait 3 seconds before first check (give Paypack time to process)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const statusResponse = await transportApiService.checkPaymentStatus(paypackRef);
      console.log('Initial payment status:', statusResponse);
      
      const status = statusResponse.status.toLowerCase();
      
      if (status === 'successful' || status === 'success') {
        console.log('✅ Payment already successful!');
        await handlePaymentSuccess(paypackRef);
        return;
      }
    } catch (err) {
      console.error('Initial payment check failed:', err);
    }
    
    startPaymentPolling(paypackRef);
  };

  const handlePaymentSuccess = async (paypackRef) => {
    try {
      setPaymentStatus('SUCCESS');
      
      const confirmedBooking = await transportApiService.confirmPayment(paypackRef);
      setBooking(confirmedBooking);
      
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      setStep(3);
      
      console.log('✅ Payment confirmed, booking:', confirmedBooking);
    } catch (err) {
      console.error('Failed to confirm payment:', err);
      setError('Payment successful but failed to confirm booking. Please contact support.');
    }
  };

  const startPaymentPolling = (paypackRef) => {
    console.log('🔄 Starting payment polling for:', paypackRef);
    setPollingAttempts(0);
    
    const interval = setInterval(async () => {
      setPollingAttempts(prev => {
        const newAttempts = prev + 1;
        console.log(`🔍 Payment check attempt ${newAttempts} for ${paypackRef}`);
        
        // ✅ Show troubleshooting after 20 attempts (1 minute)
        if (newAttempts === 20) {
          setShowTroubleshooting(true);
        }
        
        return newAttempts;
      });
      
      try {
        const statusResponse = await transportApiService.checkPaymentStatus(paypackRef);
        console.log('Payment status response:', statusResponse);
        
        const status = statusResponse.status.toLowerCase();

        if (status === 'successful' || status === 'success') {
          console.log('✅ Payment successful!');
          clearInterval(interval);
          setPollingInterval(null);
          await handlePaymentSuccess(paypackRef);
          
        } else if (status === 'failed') {
          console.log('❌ Payment failed');
          clearInterval(interval);
          setPollingInterval(null);
          setPaymentStatus('FAILED');
          setError('Payment failed. Please try again.');
        } else {
          console.log('⏳ Payment still pending:', status);
        }
      } catch (err) {
        console.error('Payment status check failed:', err);
      }
    }, 3000);

    setPollingInterval(interval);

    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setPollingInterval(null);
        if (paymentStatus === 'PENDING') {
          console.log('⏰ Payment timeout');
          setPaymentStatus('TIMEOUT');
          setShowTroubleshooting(true); // ✅ Show troubleshooting on timeout
          setError('Payment is taking longer than expected. Please check the instructions below.');
        }
      }
    }, 180000);
  };

  const handleRefreshPaymentStatus = async () => {
    if (!booking || !booking.paypackRef) return;
    
    setLoading(true);
    try {
      console.log('🔄 Manually checking payment status...');
      const statusResponse = await transportApiService.checkPaymentStatus(booking.paypackRef);
      console.log('Manual check result:', statusResponse);
      
      const status = statusResponse.status.toLowerCase();
      
      if (status === 'successful' || status === 'success') {
        await handlePaymentSuccess(booking.paypackRef);
      } else if (status === 'failed') {
        setPaymentStatus('FAILED');
        setError('Payment failed. Please try again.');
      } else {
        setError('Payment still pending. Please complete payment and wait.');
      }
    } catch (err) {
      console.error('Manual refresh failed:', err);
      setError('Failed to check payment status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = () => {
    transportApiService.printTicketHTML(booking.ticketNumber);
  };

  const handleDownloadTicket = () => {
    try {
      generateTicketPDF(booking);
    } catch (err) {
      setError('Failed to download ticket: ' + err.message);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  const handleRateExperience = () => {
    setShowFeedbackForm(true);
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackForm(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
            <div>
              <h3 className="text-2xl font-bold">Book Your Trip</h3>
              <p className="text-blue-100 text-sm mt-1">
                Step {step} of {requiresPayment ? '3' : '2'}
              </p>
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
            {/* Step 1: Booking Form - UNCHANGED */}
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
                        {new Date(trip.tripDate).toLocaleDateString('en-US', { 
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                        })}
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
                      placeholder="078XXXXXXX (10 digits)"
                      pattern="[0-9]{10}"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter a valid 10-digit phone number with active mobile money
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Payment Method *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, paymentMethod: 'CASH'})}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.paymentMethod === 'CASH'
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <DollarSign className="w-6 h-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Cash</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({...formData, paymentMethod: 'MOBILE_MONEY'})}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.paymentMethod === 'MOBILE_MONEY'
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <Smartphone className="w-6 h-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Mobile Money</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({...formData, paymentMethod: 'CARD'})}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.paymentMethod === 'CARD'
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Card</div>
                      </button>
                    </div>

                    {!isStaff && formData.paymentMethod === 'MOBILE_MONEY' && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          <strong>Secure Payment with Paypack</strong>
                        </p>
                        <p className="text-xs text-blue-700 mt-2">
                          • You'll receive an SMS prompt on your phone<br/>
                          • Pay with MTN Mobile Money or Airtel Money<br/>
                          • Make sure your mobile money account has sufficient balance<br/>
                          • Payment confirmation is instant
                        </p>
                      </div>
                    )}
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
                        <>
                          {requiresPayment ? 'Proceed to Payment' : 'Confirm Booking'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Payment Processing - IMPROVED WITH TROUBLESHOOTING */}
            {step === 2 && booking && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {paymentStatus === 'PENDING' ? (
                      <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                    ) : paymentStatus === 'SUCCESS' ? (
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    ) : (
                      <AlertCircle className="w-12 h-12 text-red-600" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {paymentStatus === 'PENDING' ? 'Check Your Phone' :
                     paymentStatus === 'SUCCESS' ? 'Payment Successful!' :
                     paymentStatus === 'FAILED' ? 'Payment Failed' :
                     'Payment Timeout'}
                  </h3>
                  <p className="text-gray-600">
                    {paymentStatus === 'PENDING' ? 
                      'You should receive an SMS prompt on your phone to complete the payment' :
                     paymentStatus === 'SUCCESS' ? 
                      'Your payment has been processed successfully' :
                     paymentStatus === 'FAILED' ?
                      'The payment could not be processed' :
                      'Payment took too long to process'}
                  </p>
                  
                  {paymentStatus === 'PENDING' && pollingAttempts > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Waiting for payment confirmation... (attempt {pollingAttempts})
                    </p>
                  )}
                </div>

                {/* Payment Instructions */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    Payment Instructions
                  </h4>
                  
                  <ol className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <div>
                        <strong>Check Your Phone</strong>
                        <p className="text-sm text-gray-600">You should receive an SMS on: <strong>{formData.customerPhone}</strong></p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <div>
                        <strong>Enter Your PIN</strong>
                        <p className="text-sm text-gray-600">Follow the mobile money prompt and enter your PIN</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                      <div>
                        <strong>Confirm Payment</strong>
                        <p className="text-sm text-gray-600">Amount: <strong>RWF {trip.price}</strong></p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                      <div>
                        <strong>Wait for Confirmation</strong>
                        <p className="text-sm text-gray-600">This page will automatically update when payment is complete</p>
                      </div>
                    </li>
                  </ol>

                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-gray-600">
                      <strong>Reference:</strong> {booking.paypackRef || booking.ticketNumber}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Amount:</strong> RWF {trip.price}
                    </p>
                  </div>
                </div>

                {/* ✅ NEW: Troubleshooting Section */}
                {showTroubleshooting && paymentStatus === 'PENDING' && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 animate-pulse">
                    <div className="flex items-start gap-3 mb-4">
                      <HelpCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold text-yellow-900 mb-2">
                          Not receiving SMS?
                        </h4>
                        <p className="text-sm text-yellow-800 mb-3">
                          If you haven't received the payment prompt after {Math.floor(pollingAttempts * 3 / 60)} minute(s), please check:
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-yellow-900">Phone Number Correct?</strong>
                          <p className="text-yellow-800">Verify: <strong>{formData.customerPhone}</strong> is correct (10 digits)</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-yellow-900">Mobile Money Active?</strong>
                          <p className="text-yellow-800">
                            • MTN: Dial <strong>*182#</strong> to check if active<br/>
                            • Airtel: Dial <strong>*500#</strong> to check if active
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-yellow-900">Sufficient Balance?</strong>
                          <p className="text-yellow-800">Make sure you have at least <strong>RWF {trip.price}</strong> in your mobile money account</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-yellow-900">Network Issues?</strong>
                          <p className="text-yellow-800">Check your phone signal. SMS might be delayed due to network congestion.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-yellow-300">
                      <p className="text-sm text-yellow-900 font-semibold mb-2">💡 Quick Solutions:</p>
                      <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>Wait a few more seconds - SMS can take up to 30 seconds</li>
                        <li>Check your phone's message inbox (including spam/blocked messages)</li>
                        <li>Make sure your phone is on and has network signal</li>
                        <li>If problem persists, click "Try Again" below with a different phone number</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Manual Refresh Button */}
                {paymentStatus === 'PENDING' && (
                  <div className="text-center">
                    <button
                      onClick={handleRefreshPaymentStatus}
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold flex items-center justify-center gap-2 mx-auto"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          🔄 Check Payment Status
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Completed payment? Click here to check status manually
                    </p>
                  </div>
                )}

                {/* Error/Timeout Actions */}
                {(paymentStatus === 'FAILED' || paymentStatus === 'TIMEOUT') && (
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setStep(1);
                        setPaymentStatus('');
                        setError('');
                        setPollingAttempts(0);
                        setShowTroubleshooting(false);
                      }}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Success - UNCHANGED */}
            {step === 3 && booking && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-600">Your trip has been successfully booked</p>
                </div>

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

                {user?.role === USER_ROLES.OTHER_USER && (
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
                )}

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