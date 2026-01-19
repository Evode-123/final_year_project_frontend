import React, { useState, useEffect } from 'react';
import { 
  Star, MessageSquare, Send, CheckCircle, AlertCircle, 
  Calendar, RefreshCw, Plus, Eye
} from 'lucide-react';
import feedbackApiService from '../../services/feedbackApiService';
import FeedbackFormModal from './FeedbackFormModal';

const FEEDBACK_CATEGORIES = [
  { value: 'SERVICE', label: 'Overall Service' },
  { value: 'DRIVER', label: 'Driver Behavior' },
  { value: 'VEHICLE', label: 'Vehicle Condition' },
  { value: 'BOOKING', label: 'Booking Process' },
  { value: 'PACKAGE', label: 'Package Delivery' },
  { value: 'OTHER', label: 'Other' }
];

const UserFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    loadMyFeedbacks();
  }, []);

  const loadMyFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await feedbackApiService.getMyFeedbacks();
      setFeedbacks(data);
    } catch (err) {
      setError('Failed to load your feedback: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResponse = async (feedback) => {
    setSelectedFeedback(feedback);
    
    // Mark as read if there's an unread response
    if (feedback.adminResponse && !feedback.readByUser) {
      try {
        await feedbackApiService.markFeedbackAsRead(feedback.id);
        // Reload to update the unread status
        loadMyFeedbacks();
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackForm(false);
    setSuccess('Feedback submitted successfully!');
    loadMyFeedbacks();
    setTimeout(() => setSuccess(''), 3000);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'POSITIVE': return 'text-green-600 bg-green-100';
      case 'NEGATIVE': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RESOLVED': return 'text-green-600 bg-green-100';
      case 'REVIEWED': return 'text-blue-600 bg-blue-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
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
          <h1 className="text-3xl font-bold text-gray-800">My Feedback</h1>
          <p className="text-gray-600 mt-1">View and manage your feedback submissions</p>
        </div>
        <button
          onClick={() => setShowFeedbackForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          New Feedback
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Feedback</p>
          <p className="text-3xl font-bold text-blue-600">{feedbacks.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Responded</p>
          <p className="text-3xl font-bold text-green-600">
            {feedbacks.filter(f => f.adminResponse).length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">
            {feedbacks.filter(f => f.status === 'PENDING').length}
          </p>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">You haven't submitted any feedback yet</p>
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Submit Your First Feedback
            </button>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className={`bg-white rounded-lg shadow-md border-2 p-6 transition-all ${
                feedback.adminResponse && !feedback.readByUser
                  ? 'border-red-500 shadow-lg'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {renderStars(feedback.rating)}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSentimentColor(feedback.sentiment)}`}>
                      {feedback.sentiment}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(feedback.status)}`}>
                      {feedback.status}
                    </span>
                    {feedback.adminResponse && !feedback.readByUser && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                        NEW RESPONSE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{FEEDBACK_CATEGORIES.find(c => c.value === feedback.feedbackCategory)?.label}</span>
                    {feedback.bookingReference && (
                      <>
                        <span>•</span>
                        <span>Ref: {feedback.bookingReference}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {feedback.feedbackText && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Your Feedback:</p>
                  <p className="text-gray-800">{feedback.feedbackText}</p>
                </div>
              )}

              {feedback.adminResponse && (
                <div className={`rounded-lg p-4 border-l-4 ${
                  feedback.readByUser 
                    ? 'bg-blue-50 border-blue-600' 
                    : 'bg-red-50 border-red-600'
                }`}>
                  <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Admin Response:
                  </p>
                  <p className="text-gray-800 mb-2">{feedback.adminResponse}</p>
                  <p className="text-xs text-gray-600">
                    Responded on {new Date(feedback.respondedAt).toLocaleString()}
                  </p>
                  {!feedback.readByUser && (
                    <button
                      onClick={() => handleViewResponse(feedback)}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Mark as Read
                    </button>
                  )}
                </div>
              )}

              {!feedback.adminResponse && feedback.status === 'PENDING' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⏳ Waiting for admin response...
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <FeedbackFormModal
          onClose={() => setShowFeedbackForm(false)}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
};

export default UserFeedbackPage;