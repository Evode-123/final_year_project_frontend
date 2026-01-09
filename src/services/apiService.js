import { API_BASE_URL } from '../utils/constants';

class ApiService {
  async request(endpoint, options = {}) {
    const baseUrl = endpoint.startsWith('/settings') 
      ? 'http://localhost:8080/api'
      : API_BASE_URL;
    
    const url = `${baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
        // Handle JSON error responses
        if (typeof data === 'object' && data.message) {
          throw new Error(data.message);
        }
        
        // Handle text error responses
        if (typeof data === 'string' && data.trim()) {
          throw new Error(data);
        }
        
        // Fallback error messages based on status code
        switch (response.status) {
          case 400:
            throw new Error('Invalid request. Please check your input and try again.');
          case 401:
            throw new Error('Authentication failed. Please check your credentials.');
          case 403:
            throw new Error('You do not have permission to perform this action.');
          case 404:
            throw new Error('The requested resource was not found.');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(`An error occurred (${response.status}). Please try again.`);
        }
      }

      return data;
    } catch (error) {
      // Re-throw the error with the message intact
      throw error;
    }
  }

  // Authentication endpoints
  async login(email, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async initialChangePassword(token, newPassword) {
    return this.request('/initial-change-password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword }),
    });
  }

  async changePassword(token, oldPassword, newPassword) {
    return this.request('/change-password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  async completeProfile(token, profileData) {
    return this.request('/complete-profile', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  }

  async forgotPassword(email) {
    return this.request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Admin endpoints
  async createUser(token, userData) {
    return this.request('/admin/create-user', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  }

  async manageUser(token, userManagementData) {
    return this.request('/admin/manage-user', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userManagementData),
    });
  }

  async getAllUsers(token) {
    return this.request('/admin/users', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Settings endpoints
  async getUserSettings(token) {
    return this.request('/settings', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async updateEmail(token, emailData) {
    return this.request('/settings/update-email', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(emailData),
    });
  }

  async updateProfile(token, profileData) {
    return this.request('/settings/update-profile', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  }

  async deleteAccount(token, password) {
    return this.request('/settings/delete-account', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });
  }
}

const apiService = new ApiService();
export default apiService;