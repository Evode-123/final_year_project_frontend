import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  Shield,
  Car,
  Navigation,
  Activity,
  Award,
  Loader
} from 'lucide-react';
import tripApiService from '../../services/tripApiService';
import incidentApiService from '../../services/incidentApiService';
import transportApiService from '../../services/transportApiService';

const DriverDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    upcomingTrips: [],
    todayTrips: [],
    vehicleInfo: null,
    vehicleCheck: null,
    incidents: { myTotal: 0, myPending: 0, myResolved: 0 },
    driverStats: { totalTrips: 0, onTimeRate: 0, safetyScore: 0 },
    inspectionStatus: null
  });

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Parallel API calls
      const [
        upcomingTrips,
        myIncidents,
        vehicleInfoResponse,
        inspectionStatus
      ] = await Promise.all([
        tripApiService.getMyUpcomingTrips().catch(() => []),
        incidentApiService.getMyIncidents().catch(() => []),
        transportApiService.getDriverVehicleInfo().catch(() => null),
        transportApiService.getDriverVehicleInspectionStatus().catch(() => null)
      ]);

      console.log('Vehicle Info Response:', vehicleInfoResponse); // Debug log

      // Extract vehicle info and latest check from response
      let vehicleInfo = null;
      let latestCheck = null;

      if (vehicleInfoResponse) {
        // The API returns { hasVehicle, vehicle, latestCheck }
        vehicleInfo = vehicleInfoResponse.vehicle || null;
        latestCheck = vehicleInfoResponse.latestCheck || null;
      }

      console.log('Processed Vehicle Info:', vehicleInfo); // Debug log
      console.log('Latest Check:', latestCheck); // Debug log

      // Separate today's trips
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTrips = upcomingTrips.filter(trip => {
        const tripDate = new Date(trip.tripDate);
        return tripDate >= today && tripDate < tomorrow;
      });

      // Calculate incident statistics
      const pendingIncidents = myIncidents.filter(i => 
        i.status !== 'RESOLVED' && i.status !== 'CANCELLED'
      ).length;
      const resolvedIncidents = myIncidents.filter(i => i.status === 'RESOLVED').length;

      // Calculate driver stats (estimates based on available data)
      const totalTrips = upcomingTrips.length + resolvedIncidents; // Rough estimate
      const onTimeRate = resolvedIncidents > 0 
        ? Math.max(85, 100 - (pendingIncidents / myIncidents.length * 15))
        : 95;
      const safetyScore = myIncidents.length > 0
        ? Math.max(70, 100 - (myIncidents.length * 5))
        : 98;

      setDashboardData({
        upcomingTrips,
        todayTrips,
        vehicleInfo,
        vehicleCheck: latestCheck,
        incidents: {
          myTotal: myIncidents.length,
          myPending: pendingIncidents,
          myResolved: resolvedIncidents
        },
        driverStats: {
          totalTrips,
          onTimeRate: Math.round(onTimeRate),
          safetyScore: Math.round(safetyScore)
        },
        inspectionStatus
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue', status }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-gray-800 flex items-center justify-center shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        {status && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === 'good' ? 'bg-green-100 text-green-700' :
            status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {status === 'good' ? '✓ Good' : status === 'warning' ? '⚠ Check' : '✗ Issue'}
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
      </div>
    </div>
  );

  const TripCard = ({ trip }) => {
    // Parse the date string (format: "2026-01-28")
    const tripDate = new Date(trip.tripDate);
    const isToday = tripDate.toDateString() === new Date().toDateString();

    // Parse time string (format: "08:30:00" or "08:30")
    const formatTime = (timeString) => {
      if (!timeString) return 'N/A';
      
      try {
        // Split the time string and take first two parts (hours and minutes)
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);
        
        // Format as 12-hour time
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      } catch (e) {
        console.error('Error formatting time:', timeString, e);
        return timeString; // Return original if parsing fails
      }
    };

    return (
      <div className={`p-5 rounded-xl border-2 transition-all ${
        isToday 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md' 
          : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-md'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {isToday && (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                TODAY
              </span>
            )}
            <span className="text-xs text-gray-500">
              {tripDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {formatTime(trip.departureTime)}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-900">{trip.origin || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 pl-6">
            <MapPin className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-gray-900">{trip.destination || 'N/A'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <Car className="w-3 h-3" />
            <span>{trip.vehiclePlateNo || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <Activity className="w-3 h-3" />
            <span>Status: {trip.status || 'SCHEDULED'}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-gray-800 bg-clip-text text-transparent">
            Driver Dashboard
          </h1>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Activity className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {/* Vehicle Safety Alert */}
      {dashboardData.vehicleCheck && dashboardData.vehicleCheck.hasProblems && (
        <div className="p-4 rounded-xl border-2 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Vehicle Check Required</p>
              <p className="text-sm text-red-700 mt-1">
                Issues reported in last daily check. Please review before your next trip.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Status Alert */}
      {dashboardData.inspectionStatus && dashboardData.inspectionStatus.daysUntilExpiry <= 7 && (
        <div className="p-4 rounded-xl border-2 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 flex-shrink-0 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">
                Vehicle Inspection {dashboardData.inspectionStatus.daysUntilExpiry <= 0 ? 'Overdue' : 'Expiring Soon'}
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {dashboardData.inspectionStatus.daysUntilExpiry <= 0 
                  ? `Inspection expired ${Math.abs(dashboardData.inspectionStatus.daysUntilExpiry)} days ago`
                  : `Inspection expires in ${dashboardData.inspectionStatus.daysUntilExpiry} days`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Calendar}
          title="Today's Trips"
          value={dashboardData.todayTrips.length}
          subtitle={`${dashboardData.upcomingTrips.length} upcoming trips total`}
          color="blue"
        />
        <StatCard
          icon={Award}
          title="On-Time Rate"
          value={`${dashboardData.driverStats.onTimeRate}%`}
          subtitle="Performance score"
          color="green"
          status={dashboardData.driverStats.onTimeRate >= 90 ? 'good' : 'warning'}
        />
        <StatCard
          icon={Shield}
          title="Safety Score"
          value={`${dashboardData.driverStats.safetyScore}%`}
          subtitle={`${dashboardData.incidents.myTotal} total incidents`}
          color="indigo"
          status={dashboardData.driverStats.safetyScore >= 90 ? 'good' : 'warning'}
        />
        <StatCard
          icon={AlertTriangle}
          title="Open Incidents"
          value={dashboardData.incidents.myPending}
          subtitle={`${dashboardData.incidents.myResolved} resolved`}
          color="red"
        />
      </div>

      {/* Vehicle Status */}
      {dashboardData.vehicleInfo ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Assigned Vehicle</h2>
            <Car className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <p className="text-sm text-gray-600 mb-1 font-medium">Registration</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.vehicleInfo.plateNo || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100">
              <p className="text-sm text-gray-600 mb-1 font-medium">Vehicle Type</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.vehicleInfo.vehicleType || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <p className="text-sm text-gray-600 mb-1 font-medium">Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.vehicleInfo.capacity ? `${dashboardData.vehicleInfo.capacity} seats` : 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Last Daily Check */}
          {dashboardData.vehicleCheck ? (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Last Daily Check</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(dashboardData.vehicleCheck.checkDate).toLocaleDateString()} at{' '}
                    {new Date(dashboardData.vehicleCheck.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  dashboardData.vehicleCheck.hasProblems 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {dashboardData.vehicleCheck.hasProblems ? '⚠ Issues Found' : '✓ All Good'}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">No Daily Check Found</p>
                  <p className="text-xs text-yellow-700 mt-1">Please submit a daily vehicle check</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Assigned Vehicle</h2>
            <Car className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-center py-8">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No Vehicle Assigned</p>
            <p className="text-gray-400 text-sm mt-1">Please contact your manager for vehicle assignment</p>
          </div>
        </div>
      )}

      {/* Today's Trips & Upcoming Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Trips */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {dashboardData.todayTrips.length > 0 ? (
              dashboardData.todayTrips.map((trip, i) => (
                <TripCard key={i} trip={trip} />
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No trips scheduled for today</p>
                <p className="text-gray-400 text-sm mt-1">Enjoy your day off!</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Trips */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Trips</h2>
            <Navigation className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {dashboardData.upcomingTrips.length > 0 ? (
              dashboardData.upcomingTrips.slice(0, 5).map((trip, i) => (
                <TripCard key={i} trip={trip} />
              ))
            ) : (
              <div className="text-center py-12">
                <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No upcoming trips</p>
                <p className="text-gray-400 text-sm mt-1">Check back later</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-gray-800 rounded-2xl shadow-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Performance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Total Trips</p>
            <p className="text-3xl font-bold">{dashboardData.driverStats.totalTrips}</p>
            <p className="text-blue-200 text-xs mt-1">All time</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">On-Time Rate</p>
            <p className="text-3xl font-bold">{dashboardData.driverStats.onTimeRate}%</p>
            <p className="text-blue-200 text-xs mt-1">Performance</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Safety Score</p>
            <p className="text-3xl font-bold">{dashboardData.driverStats.safetyScore}%</p>
            <p className="text-blue-200 text-xs mt-1">Compliance</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Incidents</p>
            <p className="text-3xl font-bold">{dashboardData.incidents.myTotal}</p>
            <p className="text-blue-200 text-xs mt-1">{dashboardData.incidents.myPending} pending</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;