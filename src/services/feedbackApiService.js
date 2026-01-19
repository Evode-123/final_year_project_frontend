import { TRANSPORT_API_URL } from '../utils/constants';

class FeedbackApiService {
  getAuthHeaders() {
    const token = sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async request(endpoint, options = {}) {
    const url = `${TRANSPORT_API_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data.message || data || 'Request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // ========================================
  // PUBLIC ENDPOINTS
  // ========================================

  /**
   * Submit feedback (public - anyone can submit)
   */
  async submitFeedback(feedbackData) {
    return this.request('/feedbacks/submit', {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    });
  }

  /**
   * Get featured positive feedback (public)
   */
  async getFeaturedFeedback() {
    return this.request('/feedbacks/featured');
  }

  // ========================================
  // ADMIN & MANAGER ENDPOINTS
  // ========================================

  /**
   * Get all feedback (admin/manager only)
   */
  async getAllFeedback() {
    return this.request('/feedbacks');
  }

  /**
   * Get pending negative feedback (admin/manager)
   */
  async getPendingNegativeFeedback() {
    return this.request('/feedbacks/pending-negative');
  }

  /**
   * ✅ NEW: Get count of unread negative feedback (admin/manager)
   * This powers the red badge for admins/managers
   */
  async getUnreadNegativeFeedbackCount() {
    return this.request('/feedbacks/unread-count');
  }

  /**
   * Get feedback by sentiment (admin/manager)
   */
  async getFeedbackBySentiment(sentiment) {
    return this.request(`/feedbacks/sentiment/${sentiment}`);
  }

  /**
   * Get feedback by category (admin/manager)
   */
  async getFeedbackByCategory(category) {
    return this.request(`/feedbacks/category/${category}`);
  }

  /**
   * Respond to feedback (admin/manager)
   */
  async respondToFeedback(responseData) {
    return this.request('/feedbacks/respond', {
      method: 'POST',
      body: JSON.stringify(responseData)
    });
  }

  /**
   * Toggle featured status (admin only)
   */
  async toggleFeatured(feedbackId) {
    return this.request(`/feedbacks/${feedbackId}/toggle-featured`, {
      method: 'PUT'
    });
  }

  /**
   * Get feedback statistics (admin/manager)
   */
  async getFeedbackStatistics() {
    return this.request('/feedbacks/statistics');
  }

  // ========================================
  // AUTHENTICATED USER ENDPOINTS (NEW)
  // ========================================

  /**
   * ✅ NEW: Get current user's feedbacks
   * Returns all feedbacks submitted by the logged-in user
   */
  async getMyFeedbacks() {
    return this.request('/feedbacks/my-feedbacks');
  }

  /**
   * ✅ NEW: Get count of unread admin responses for current user
   * This powers the red badge for OTHER_USER role
   */
  async getMyUnreadResponsesCount() {
    return this.request('/feedbacks/my-unread-responses');
  }

  /**
   * ✅ NEW: Mark a feedback as read by the user
   * Called when user views an admin response
   */
  async markFeedbackAsRead(feedbackId) {
    return this.request(`/feedbacks/${feedbackId}/mark-read`, {
      method: 'PUT'
    });
  }
}

const feedbackApiService = new FeedbackApiService();
export default feedbackApiService;