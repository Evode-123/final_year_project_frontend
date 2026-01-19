import { TRANSPORT_API_URL } from '../utils/constants';

class IncidentApiService {
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

  // ============ DRIVER TRIPS ============
  async getMyScheduledTrips() {
    return this.request('/incidents/my-trips');
  }

  // ============ INCIDENT REPORTING ============
  async reportIncident(incidentData) {
    return this.request('/incidents/report', {
      method: 'POST',
      body: JSON.stringify(incidentData)
    });
  }

  async updateIncident(incidentId, updateData) {
    return this.request(`/incidents/${incidentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async markIncidentAsViewed(incidentId) {
    return this.request(`/incidents/${incidentId}/mark-viewed`, {
      method: 'PUT'
    });
  }

  async getUnviewedCount() {
    return this.request('/incidents/unviewed-count');
  }

  async getAllIncidents() {
    return this.request('/incidents');
  }

  async getUnresolvedIncidents() {
    return this.request('/incidents/unresolved');
  }

  async getCriticalIncidents() {
    return this.request('/incidents/critical');
  }

  async getTodayIncidents() {
    return this.request('/incidents/today');
  }

  async getIncidentsByTrip(dailyTripId) {
    return this.request(`/incidents/trip/${dailyTripId}`);
  }

  async getMyIncidents() {
    return this.request('/incidents/my-incidents');
  }

  // ✅ NEW: Get my resolved incidents
  async getMyResolvedIncidents() {
    return this.request('/incidents/my-incidents/resolved');
  }

  // ✅ NEW: Get my pending incidents
  async getMyPendingIncidents() {
    return this.request('/incidents/my-incidents/pending');
  }

  async getIncidentById(id) {
    return this.request(`/incidents/${id}`);
  }

  async getStatistics() {
    return this.request('/incidents/statistics');
  }
}

const incidentApiService = new IncidentApiService();
export default incidentApiService;