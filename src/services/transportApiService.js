// transportApiService.js - COMPLETE UPDATED VERSION

import { TRANSPORT_API_URL } from '../utils/constants';

class TransportApiService {
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

  // ============ ROUTES ============
  async getAllRoutes() {
    return this.request('/routes');
  }

  async createRoute(routeData) {
    return this.request('/routes', {
      method: 'POST',
      body: JSON.stringify(routeData)
    });
  }

  async updateRoute(id, routeData) {
    return this.request(`/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(routeData)
    });
  }

  async deleteRoute(id) {
    return this.request(`/routes/${id}`, {
      method: 'DELETE'
    });
  }

  // ============ VEHICLES ============
  async getAllVehicles() {
    return this.request('/vehicles');
  }

  async getAvailableVehicles() {
    return this.request('/vehicles/available');
  }

  async createVehicle(vehicleData) {
    return this.request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData)
    });
  }

  async updateVehicle(id, vehicleData) {
    return this.request(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData)
    });
  }

  async deleteVehicle(id) {
    return this.request(`/vehicles/${id}`, {
      method: 'DELETE'
    });
  }

  // ============ TIME SLOTS ============
  async getAllTimeSlots() {
    return this.request('/timeslots');
  }

  async createTimeSlot(timeSlotData) {
    return this.request('/timeslots', {
      method: 'POST',
      body: JSON.stringify(timeSlotData)
    });
  }

  async deleteTimeSlot(id) {
    return this.request(`/timeslots/${id}`, {
      method: 'DELETE'
    });
  }

  // ============ ROUTE-VEHICLE ASSIGNMENT ============
  async assignVehicleToRoute(routeId, vehicleId) {
    return this.request('/route-vehicles/assign', {
      method: 'POST',
      body: JSON.stringify({ routeId, vehicleId })
    });
  }

  async getVehiclesForRoute(routeId) {
    return this.request(`/route-vehicles/route/${routeId}/vehicles`);
  }

  async getRouteVehicleAssignments(routeId) {
    return this.request(`/route-vehicles/route/${routeId}`);
  }

  async getAllRouteVehicleAssignments() {
    return this.request('/route-vehicles');
  }

  async removeVehicleFromRoute(assignmentId) {
    return this.request(`/route-vehicles/${assignmentId}`, {
      method: 'DELETE'
    });
  }

  // ============ ROUTE-TIMESLOT ASSIGNMENT ============
  async assignTimeSlotToRoute(routeId, timeSlotId) {
    return this.request(`/route-timeslots/assign?routeId=${routeId}&timeSlotId=${timeSlotId}`, {
      method: 'POST'
    });
  }

  async getTimeSlotsForRoute(routeId) {
    return this.request(`/route-timeslots/route/${routeId}`);
  }

  async removeTimeSlotFromRoute(assignmentId) {
    return this.request(`/route-timeslots/${assignmentId}`, {
      method: 'DELETE'
    });
  }

  // ============ DRIVERS ============
  async getAllDrivers() {
    return this.request('/drivers');
  }

  async getActiveDrivers() {
    return this.request('/drivers/active');
  }

  async getAvailableDrivers() {
    return this.request('/drivers/available');
  }

  async createDriver(driverData) {
    return this.request('/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData)
    });
  }

  async updateDriver(id, driverData) {
    return this.request(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driverData)
    });
  }

  async assignDriverToVehicle(driverId, vehicleId) {
    return this.request('/drivers/assign', {
      method: 'POST',
      body: JSON.stringify({ driverId, vehicleId })
    });
  }

  async unassignDriver(driverId) {
    return this.request(`/drivers/${driverId}/unassign`, {
      method: 'PUT'
    });
  }

  async deleteDriver(id) {
    return this.request(`/drivers/${id}`, {
      method: 'DELETE'
    });
  }

  // ============ BOOKINGS ============
  async searchTrips(searchData) {
    return this.request('/bookings/search', {
      method: 'POST',
      body: JSON.stringify(searchData)
    });
  }

  async getAvailableTrips() {
    return this.request('/bookings/available');
  }

  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }

  async getBookingByTicket(ticketNumber) {
    return this.request(`/bookings/ticket/${ticketNumber}`);
  }

  async cancelBooking(bookingId, reason) {
    return this.request(`/bookings/${bookingId}/cancel?reason=${encodeURIComponent(reason)}`, {
      method: 'PUT'
    });
  }

  // ✅ NEW: Get current user's active bookings
  async getMyActiveBookings() {
    return this.request('/bookings/my-bookings');
  }

  // ✅ NEW: Get current user's booking history
  async getMyBookingHistory() {
    return this.request('/bookings/my-history');
  }

  // ✅ NEW: Get all bookings history (for receptionist/admin/manager)
  async getAllBookingsHistory() {
    return this.request('/bookings/all-history');
  }

  // ✅ UPDATED: For admin/manager/receptionist only
  async getTodayBookings() {
    return this.request('/bookings/today');
  }

  // ============ TICKET PRINTING ============
  async printTicket(ticketNumber) {
    return this.request(`/bookings/ticket/${ticketNumber}/print`);
  }

  async printTicketHTML(ticketNumber) {
    const url = `${TRANSPORT_API_URL}/bookings/ticket/${ticketNumber}/print-html`;
    window.open(url, '_blank');
  }

  async printReceipt(ticketNumber) {
    return this.request(`/bookings/ticket/${ticketNumber}/receipt`);
  }

  async downloadTicket(ticketNumber) {
    try {
      const token = sessionStorage.getItem('token');
      const url = `${TRANSPORT_API_URL}/bookings/ticket/${ticketNumber}/download`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download ticket');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Ticket-${ticketNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      return true;
    } catch (error) {
      console.error('Download ticket error:', error);
      throw error;
    }
  }

  async downloadReceipt(ticketNumber) {
    try {
      const receiptText = await this.printReceipt(ticketNumber);
      const blob = new Blob([receiptText], { type: 'text/plain' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Receipt-${ticketNumber}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      return true;
    } catch (error) {
      console.error('Download receipt error:', error);
      throw error;
    }
  }

  // ============ VEHICLE INSPECTIONS ============
  async recordInspection(inspectionData) {
    return this.request('/vehicle-inspections/record', {
      method: 'POST',
      body: JSON.stringify(inspectionData)
    });
  }

  async getLatestInspection(vehicleId) {
    return this.request(`/vehicle-inspections/vehicle/${vehicleId}/latest`);
  }

  async getVehicleInspectionHistory(vehicleId) {
    return this.request(`/vehicle-inspections/vehicle/${vehicleId}`);
  }

  async getVehiclesDueSoon() {
    return this.request('/vehicle-inspections/due-soon');
  }

  async getOverdueVehicles() {
    return this.request('/vehicle-inspections/overdue');
  }

  async getInspectionDashboard() {
    return this.request('/vehicle-inspections/dashboard');
  }

  // ============ DAILY VEHICLE CHECKS ============
  async submitDailyCheck(checkData) {
    return this.request('/daily-checks/submit', {
      method: 'POST',
      body: JSON.stringify(checkData)
    });
  }

  async getTodaysChecks() {
    return this.request('/daily-checks/today');
  }

  async getChecksWithProblems() {
    return this.request('/daily-checks/problems');
  }

  async getUnreviewedProblems() {
    return this.request('/daily-checks/unreviewed');
  }

  async getUrgentChecks() {
    return this.request('/daily-checks/urgent');
  }

  async getLatestDailyCheck(vehicleId) {
    return this.request(`/daily-checks/vehicle/${vehicleId}/latest`);
  }

  async getVehicleCheckHistory(vehicleId, days = 30) {
    return this.request(`/daily-checks/vehicle/${vehicleId}/history?days=${days}`);
  }

  async reviewCheck(checkId, reviewData) {
    return this.request(`/daily-checks/${checkId}/review`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    });
  }

  async getDailyChecksDashboard() {
    return this.request('/daily-checks/dashboard');
  }

  /**
   * Get driver's assigned vehicle inspection status
   * GET /api/vehicle-inspections/my-vehicle
   */
  async getDriverVehicleInspectionStatus() {
    return this.request('/vehicle-inspections/my-vehicle');
  }

  /**
   * Get driver's assigned vehicle inspection history
   * GET /api/vehicle-inspections/my-vehicle/history
   */
  async getDriverVehicleInspectionHistory() {
    return this.request('/vehicle-inspections/my-vehicle/history');
  }

  /**
   * Get driver's vehicle info with latest daily check
   * GET /api/daily-checks/my-vehicle
   */
  async getDriverVehicleInfo() {
    return this.request('/daily-checks/my-vehicle');
  }

  /**
   * Get driver's vehicle daily check history
   * GET /api/daily-checks/my-vehicle/history?days=30
   */
  async getDriverVehicleCheckHistory(days = 30) {
    return this.request(`/daily-checks/my-vehicle/history?days=${days}`);
  }

  /**
   * Get driver's latest daily check
   * GET /api/daily-checks/my-vehicle/latest
   */
  async getDriverLatestCheck() {
    return this.request('/daily-checks/my-vehicle/latest');
  }

  // ============ TRIP GENERATION ============
  async getSystemStatus() {
    return this.request('/admin/trips/system-status');
  }

  async initializeTrips() {
    return this.request('/admin/trips/initialize', {
      method: 'POST'
    });
  }

  async generateTripsManually(startDate, numberOfDays) {
    return this.request(`/admin/trips/generate?startDate=${startDate}&numberOfDays=${numberOfDays}`, {
      method: 'POST'
    });
  }

  async generateTripsForDate(date) {
    return this.request(`/admin/trips/generate-for-date?date=${date}`, {
      method: 'POST'
    });
  }
}

const transportApiService = new TransportApiService();
export default transportApiService;