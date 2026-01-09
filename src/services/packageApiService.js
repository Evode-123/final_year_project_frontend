import { TRANSPORT_API_URL } from '../utils/constants';

class PackageApiService {
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

  // ============ PACKAGE BOOKING ============
  async bookPackage(packageData) {
    return this.request('/packages/book', {
      method: 'POST',
      body: JSON.stringify(packageData)
    });
  }

  // ============ PACKAGE TRACKING ============
  async trackPackage(trackingNumber) {
    return this.request(`/packages/track/${trackingNumber}`);
  }

  // ============ PACKAGE MANAGEMENT ============
  async markPackageAsArrived(packageId) {
    return this.request(`/packages/${packageId}/arrived`, {
      method: 'PUT'
    });
  }

  async collectPackage(collectionData) {
    return this.request('/packages/collect', {
      method: 'POST',
      body: JSON.stringify(collectionData)
    });
  }

  async cancelPackage(packageId, reason) {
    return this.request(`/packages/${packageId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  }

  // ============ PACKAGE QUERIES ============
  async getPackagesForTrip(tripId) {
    return this.request(`/packages/trip/${tripId}`);
  }

  async getPackagesBySender(phone) {
    return this.request(`/packages/sender/${phone}`);
  }

  async getPackagesByReceiver(phone) {
    return this.request(`/packages/receiver/${phone}`);
  }

  async getPackagesByStatus(status) {
    return this.request(`/packages/status/${status}`);
  }

  async getArrivedPackages() {
    return this.request('/packages/arrived');
  }

  async getInTransitPackages() {
    return this.request('/packages/in-transit');
  }

  async getCollectedPackages() {
    return this.request('/packages/collected');
  }
}

const packageApiService = new PackageApiService();
export default packageApiService;