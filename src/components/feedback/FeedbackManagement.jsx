import React, { useState, useEffect } from 'react';
import { 
  Star, MessageSquare, Filter, Send, CheckCircle, 
  AlertCircle, TrendingUp, Users, Award
} from 'lucide-react';
import feedbackApiService from '../../services/feedbackApiService';

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [responseStatus, setResponseStatus] = useState('REVIEWED');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, allFeedback] = await Promise.all([
        feedbackApiService.getFeedbackStatistics(),
        feedbackApiService.getAllFeedback()
      ]);

      setStatistics(stats);
      
      // Apply filter
      let filtered = allFeedback;
      if (filter === 'POSITIVE') {
        filtered = allFeedback.filter(f => f.sentiment === 'POSITIVE');
      } else if (filter === 'NEGATIVE') {
        filtered = allFeedback.filter(f => f.sentiment === 'NEGATIVE');
      } else if (filter === 'PENDING') {
        filtered = allFeedback.filter(f => f.status === 'PENDING');
      }

      setFeedbacks(filtered);
    } catch (err) {
      setError('Failed to load feedback: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (feedbackId) => {
    if (!adminResponse.trim()) {
      setError('Please enter a response');
      return;
    }

    try {
      await feedbackApiService.respondToFeedback({
        feedbackId,
        adminResponse,
        status: responseStatus
      });

      setSuccess('Response sent successfully!');
      setSelectedFeedback(null);
      setAdminResponse('');
      loadData();
    } catch (err) {
      setError('Failed to send response: ' + err.message);
    }
  };

  const handleToggleFeatured = async (feedbackId) => {
    try {
      await feedbackApiService.toggleFeatured(feedbackId);
      setSuccess('Featured status updated!');
      loadData();
    } catch (err) {
      setError('Failed to update: ' + err.message);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'POSITIVE': return 'text-green-600 bg-green-100';
      case 'NEGATIVE': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Customer Feedback</h1>
        <p className="text-gray-600 mt-1">View and respond to customer feedback</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Feedback</p>
            <p className="text-3xl font-bold text-blue-600">{statistics.totalFeedbacks}</p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
            <p className="text-3xl font-bold text-yellow-600">{statistics.averageRating}/5.0</p>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Positive</p>
            <p className="text-3xl font-bold text-green-600">{statistics.positiveFeedbacks}</p>
          </div>

          <div className="bg-red-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Negative</p>
            <p className="text-3xl font-bold text-red-600">{statistics.negativeFeedbacks}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {['ALL', 'POSITIVE', 'NEGATIVE', 'PENDING'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="grid grid-cols-1 gap-6">
        {feedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-800">
                    {feedback.customerName}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSentimentColor(feedback.sentiment)}`}>
                    {feedback.sentiment}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {renderStars(feedback.rating)}
                  <span>•</span>
                  <span>{feedback.feedbackCategory}</span>
                  {feedback.bookingReference && (
                    <>
                      <span>•</span>
                      <span>Ref: {feedback.bookingReference}</span>
                    </>
                  )}
                </div>
              </div>
              
              {feedback.sentiment === 'POSITIVE' && (
                <button
                  onClick={() => handleToggleFeatured(feedback.id)}
                  className={`p-2 rounded-lg ${
                    feedback.isFeatured
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                  }`}
                  title={feedback.isFeatured ? 'Remove from featured' : 'Feature this feedback'}
                >
                  <Award className="w-5 h-5" />
                </button>
              )}
            </div>

            {feedback.feedbackText && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-800">{feedback.feedbackText}</p>
              </div>
            )}

            {feedback.adminResponse ? (
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                <p className="text-sm font-semibold text-blue-900 mb-2">Admin Response:</p>
                <p className="text-blue-800">{feedback.adminResponse}</p>
                <p className="text-xs text-blue-600 mt-2">
                  Responded by {feedback.respondedByEmail} on{' '}
                  {new Date(feedback.respondedAt).toLocaleString()}
                </p>
              </div>
            ) : feedback.status === 'PENDING' ? (
              <div className="border-t pt-4">
                {selectedFeedback === feedback.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Type your response..."
                    />
                    <div className="flex items-center gap-3">
                      <select
                        value={responseStatus}
                        onChange={(e) => setResponseStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="REVIEWED">Mark as Reviewed</option>
                        <option value="RESOLVED">Mark as Resolved</option>
                      </select>
                      <button
                        onClick={() => handleRespond(feedback.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4" />
                        Send Response
                      </button>
                      <button
                        onClick={() => setSelectedFeedback(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedFeedback(feedback.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Respond
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {feedbacks.length === 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No feedback found for selected filter</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;