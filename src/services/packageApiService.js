// packageApiService.js - COMPLETE VERSION WITH REPORTS SUPPORT

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

  // ============ PACKAGE TRACKING (PUBLIC) ============
  
  /**
   * Track package by tracking number (no auth required)
   * Anyone with tracking number can track their package
   */
  async trackPackage(trackingNumber) {
    return this.request(`/packages/track/${trackingNumber}`);
  }

  // ============ USER-SPECIFIC ENDPOINTS ============
  
  /**
   * ✅ Get packages sent by current user
   */
  async getMySentPackages() {
    return this.request('/packages/my-sent-packages');
  }

  /**
   * ✅ Get packages where current user is receiver
   */
  async getMyReceivedPackages() {
    return this.request('/packages/my-received-packages');
  }

  /**
   * ✅ Get package statistics for current user
   */
  async getMyStatistics() {
    return this.request('/packages/my-statistics');
  }

  // ============ PACKAGE MANAGEMENT (STAFF) ============
  
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

  // ============ PACKAGE QUERIES (STAFF) ============
  
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

  // ============ ADMIN REPORTS ============
  
  /**
   * ✅ NEW: Get all packages (for reports - ADMIN/MANAGER)
   * Combines all package statuses for comprehensive reporting
   */
  async getAllPackages() {
    try {
      // Get all packages by combining different status endpoints
      const [inTransit, arrived, collected] = await Promise.all([
        this.getInTransitPackages(),
        this.getArrivedPackages(),
        this.getCollectedPackages()
      ]);
      
      // Combine all packages into a single array
      const allPackages = [...inTransit, ...arrived, ...collected];
      
      console.log(`✅ Loaded ${allPackages.length} total packages for reports`);
      return allPackages;
    } catch (error) {
      console.error('❌ Error fetching all packages:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get package statistics for reports
   * Returns aggregated data for admin dashboard
   */
  async getPackageStatistics() {
    try {
      const allPackages = await this.getAllPackages();
      
      // Calculate comprehensive statistics
      const stats = {
        // Count by status
        total: allPackages.length,
        inTransit: allPackages.filter(p => p.packageStatus === 'IN_TRANSIT').length,
        arrived: allPackages.filter(p => p.packageStatus === 'ARRIVED').length,
        collected: allPackages.filter(p => p.packageStatus === 'COLLECTED').length,
        cancelled: allPackages.filter(p => p.packageStatus === 'CANCELLED').length,
        
        // Revenue statistics
        totalRevenue: allPackages
          .filter(p => p.paymentStatus === 'PAID')
          .reduce((sum, p) => sum + parseFloat(p.price || 0), 0),
        
        averagePrice: allPackages.length > 0
          ? allPackages
              .filter(p => p.price)
              .reduce((sum, p) => sum + parseFloat(p.price || 0), 0) / 
              allPackages.filter(p => p.price).length
          : 0,
        
        // Payment method breakdown
        paymentMethods: allPackages
          .filter(p => p.paymentStatus === 'PAID')
          .reduce((acc, p) => {
            const method = p.paymentMethod || 'UNKNOWN';
            acc[method] = (acc[method] || 0) + parseFloat(p.price || 0);
            return acc;
          }, {}),
        
        // By route (top 10)
        byRoute: Object.entries(
          allPackages.reduce((acc, p) => {
            const route = `${p.origin} - ${p.destination}`;
            acc[route] = (acc[route] || 0) + 1;
            return acc;
          }, {})
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .reduce((acc, [route, count]) => {
            acc[route] = count;
            return acc;
          }, {}),
        
        // Weight statistics
        totalWeight: allPackages
          .filter(p => p.packageWeight)
          .reduce((sum, p) => sum + parseFloat(p.packageWeight || 0), 0),
        
        averageWeight: allPackages.filter(p => p.packageWeight).length > 0
          ? allPackages
              .filter(p => p.packageWeight)
              .reduce((sum, p) => sum + parseFloat(p.packageWeight || 0), 0) / 
              allPackages.filter(p => p.packageWeight).length
          : 0,
        
        // Fragile packages
        fragileCount: allPackages.filter(p => p.isFragile).length,
        
        // Delivery performance
        deliveredOnTime: allPackages.filter(p => 
          p.packageStatus === 'COLLECTED' && 
          p.collectedAt && 
          p.expectedArrivalTime &&
          new Date(p.collectedAt) <= new Date(p.expectedArrivalTime)
        ).length,
        
        // By day of week
        byDayOfWeek: allPackages.reduce((acc, p) => {
          const day = new Date(p.bookingDate).toLocaleDateString('en-US', { weekday: 'long' });
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {})
      };
      
      console.log('✅ Package statistics calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error calculating package statistics:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get packages within date range (for filtered reports)
   */
  async getPackagesByDateRange(startDate, endDate) {
    try {
      const allPackages = await this.getAllPackages();
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const filtered = allPackages.filter(p => {
        const bookingDate = new Date(p.bookingDate);
        return bookingDate >= start && bookingDate <= end;
      });
      
      console.log(`✅ Filtered ${filtered.length} packages from ${startDate} to ${endDate}`);
      return filtered;
    } catch (error) {
      console.error('❌ Error filtering packages by date:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get revenue by date range (for financial reports)
   */
  async getRevenueByDateRange(startDate, endDate) {
    try {
      const packages = await this.getPackagesByDateRange(startDate, endDate);
      
      const paidPackages = packages.filter(p => p.paymentStatus === 'PAID');
      
      const revenue = {
        total: paidPackages.reduce((sum, p) => sum + parseFloat(p.price || 0), 0),
        count: paidPackages.length,
        average: paidPackages.length > 0
          ? paidPackages.reduce((sum, p) => sum + parseFloat(p.price || 0), 0) / paidPackages.length
          : 0,
        
        // Daily breakdown
        byDay: paidPackages.reduce((acc, p) => {
          const date = new Date(p.bookingDate).toLocaleDateString();
          acc[date] = (acc[date] || 0) + parseFloat(p.price || 0);
          return acc;
        }, {}),
        
        // By payment method
        byPaymentMethod: paidPackages.reduce((acc, p) => {
          const method = p.paymentMethod || 'UNKNOWN';
          acc[method] = (acc[method] || 0) + parseFloat(p.price || 0);
          return acc;
        }, {})
      };
      
      console.log(`✅ Revenue calculated for ${startDate} to ${endDate}:`, revenue.total);
      return revenue;
    } catch (error) {
      console.error('❌ Error calculating revenue:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get top performing routes (for operations reports)
   */
  async getTopRoutes(limit = 10) {
    try {
      const allPackages = await this.getAllPackages();
      
      const routeStats = allPackages.reduce((acc, p) => {
        const route = `${p.origin} - ${p.destination}`;
        if (!acc[route]) {
          acc[route] = {
            count: 0,
            revenue: 0,
            avgWeight: 0,
            totalWeight: 0
          };
        }
        acc[route].count++;
        if (p.paymentStatus === 'PAID') {
          acc[route].revenue += parseFloat(p.price || 0);
        }
        if (p.packageWeight) {
          acc[route].totalWeight += parseFloat(p.packageWeight || 0);
        }
        return acc;
      }, {});
      
      // Calculate averages and sort
      const routes = Object.entries(routeStats)
        .map(([route, stats]) => ({
          route,
          ...stats,
          avgWeight: stats.count > 0 ? stats.totalWeight / stats.count : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
      
      console.log(`✅ Top ${limit} routes calculated`);
      return routes;
    } catch (error) {
      console.error('❌ Error getting top routes:', error);
      throw error;
    }
  }
}

const packageApiService = new PackageApiService();
export default packageApiService;