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

  // ✅ NEW: Download ticket as HTML file
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

      // Get the blob from response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Ticket-${ticketNumber}.html`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      return true;
    } catch (error) {
      console.error('Download ticket error:', error);
      throw error;
    }
  }

  // ✅ NEW: Download receipt as text file
  async downloadReceipt(ticketNumber) {
    try {
      const receiptText = await this.printReceipt(ticketNumber);
      
      // Create blob from text
      const blob = new Blob([receiptText], { type: 'text/plain' });
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
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

// Add to src/services/transportApiService.js

// ============ VEHICLE INSPECTIONS ============

// Record government inspection
async recordInspection(inspectionData) {
  return this.request('/vehicle-inspections/record', {
    method: 'POST',
    body: JSON.stringify(inspectionData)
  });
}

// Get latest inspection for vehicle
async getLatestInspection(vehicleId) {
  return this.request(`/vehicle-inspections/vehicle/${vehicleId}/latest`);
}

// Get inspection history for vehicle
async getVehicleInspectionHistory(vehicleId) {
  return this.request(`/vehicle-inspections/vehicle/${vehicleId}`);
}

// Get vehicles due soon
async getVehiclesDueSoon() {
  return this.request('/vehicle-inspections/due-soon');
}

// Get overdue vehicles
async getOverdueVehicles() {
  return this.request('/vehicle-inspections/overdue');
}

// Get inspection dashboard
async getInspectionDashboard() {
  return this.request('/vehicle-inspections/dashboard');
}

// ============ DAILY VEHICLE CHECKS ============

// Submit daily check
async submitDailyCheck(checkData) {
  return this.request('/daily-checks/submit', {
    method: 'POST',
    body: JSON.stringify(checkData)
  });
}

// Get today's checks
async getTodaysChecks() {
  return this.request('/daily-checks/today');
}

// Get checks with problems
async getChecksWithProblems() {
  return this.request('/daily-checks/problems');
}

// Get unreviewed problems
async getUnreviewedProblems() {
  return this.request('/daily-checks/unreviewed');
}

// Get urgent checks
async getUrgentChecks() {
  return this.request('/daily-checks/urgent');
}

// Get latest check for vehicle
async getLatestDailyCheck(vehicleId) {
  return this.request(`/daily-checks/vehicle/${vehicleId}/latest`);
}

// Get check history for vehicle
async getVehicleCheckHistory(vehicleId, days = 30) {
  return this.request(`/daily-checks/vehicle/${vehicleId}/history?days=${days}`);
}

// Review a check (manager)
async reviewCheck(checkId, reviewData) {
  return this.request(`/daily-checks/${checkId}/review`, {
    method: 'PUT',
    body: JSON.stringify(reviewData)
  });
}

// Get daily checks dashboard
async getDailyChecksDashboard() {
  return this.request('/daily-checks/dashboard');
}

  // ============ TRIP GENERATION (NEW) ============
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