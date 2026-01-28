import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  MapPin,
  Shield,
  MessageSquare,
  Activity,
  ArrowUp,
  ArrowDown,
  Loader,
  Truck,
  PackageCheck
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';
import packageApiService from '../../services/packageApiService';
import feedbackApiService from '../../services/feedbackApiService';
import incidentApiService from '../../services/incidentApiService';
import apiService from '../../services/apiService';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    users: { total: 0, active: 0, inactive: 0 },
    vehicles: { total: 0, available: 0, maintenance: 0 },
    bookings: { today: 0, thisWeek: 0, revenue: 0 },
    packages: { 
      total: 0,
      inTransit: 0, 
      arrived: 0, 
      collected: 0,
      cancelled: 0,
      totalRevenue: 0
    },
    incidents: { total: 0, critical: 0, unresolved: 0 },
    feedback: { total: 0, positive: 0, negative: 0, averageRating: 0 },
    recentActivities: [],
    upcomingTrips: [],
    systemHealth: { status: 'good', issues: [] }
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
      const token = sessionStorage.getItem('token');

      // Parallel API calls for better performance
      const [
        users,
        vehicles,
        todayBookings,
        availableTrips,
        inTransitPackages,
        arrivedPackages,
        collectedPackages,
        incidentStats,
        feedbackStats,
        vehicleInspections
      ] = await Promise.all([
        apiService.getAllUsers(token).catch(() => []),
        transportApiService.getAllVehicles().catch(() => []),
        transportApiService.getTodayBookings().catch(() => []),
        transportApiService.getAvailableTrips().catch(() => []),
        packageApiService.getInTransitPackages().catch(() => []),
        packageApiService.getArrivedPackages().catch(() => []),
        packageApiService.getCollectedPackages().catch(() => []),
        incidentApiService.getStatistics().catch(() => ({})),
        feedbackApiService.getFeedbackStatistics().catch(() => ({})),
        transportApiService.getInspectionDashboard().catch(() => ({}))
      ]);

      // ✅ Debug logging for bookings structure
      console.log('=== BOOKING DATA DEBUG ===');
      console.log('Sample booking:', todayBookings[0]);
      console.log('========================');

      // Calculate user statistics
      const activeUsers = Array.isArray(users) ? users.filter(u => u.enabled).length : 0;
      const inactiveUsers = Array.isArray(users) ? users.filter(u => !u.enabled).length : 0;

      // Calculate vehicle statistics
      const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
      const maintenanceVehicles = vehicles.filter(v => v.status === 'MAINTENANCE').length;

      // ✅ Calculate booking revenue
      const todayRevenue = todayBookings.reduce((sum, booking) => {
        const amount = booking.totalAmount || 
                      booking.amount || 
                      booking.price || 
                      booking.fare || 
                      booking.totalPrice || 
                      booking.ticketPrice || 
                      booking.cost ||
                      0;
        return sum + parseFloat(amount);
      }, 0);

      // ✅ Calculate package statistics and revenue
      const allPackages = [...inTransitPackages, ...arrivedPackages, ...collectedPackages];
      
      const packageRevenue = allPackages.reduce((sum, pkg) => {
        const amount = parseFloat(pkg.price || 0);
        return sum + amount;
      }, 0);

      // Get upcoming trips (next 3 days)
      const upcomingTrips = availableTrips
        .filter(trip => {
          const tripDate = new Date(trip.tripDate);
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
          return tripDate <= threeDaysFromNow;
        })
        .slice(0, 5);

      // ✅ Build recent activities with proper field extraction (SAME AS MANAGER)
      const recentActivities = [];

      // Add booking activities with robust field extraction
      todayBookings.slice(0, 3).forEach(b => {
        // Extract customer name
        const customerName = b.customer?.names || 
                            b.customer?.name ||
                            b.customerName ||
                            b.passengerName ||
                            'Guest';
        
        // ✅ Extract origin and destination from multiple possible locations
        const origin = b.origin || 
                      b.route?.origin || 
                      b.dailyTrip?.route?.origin ||
                      b.trip?.origin ||
                      'Origin';
        
        const destination = b.destination || 
                           b.route?.destination || 
                           b.dailyTrip?.route?.destination ||
                           b.trip?.destination ||
                           'Destination';
        
        recentActivities.push({
          type: 'booking',
          title: 'New Booking',
          description: `${customerName} booked ticket #${b.ticketNumber} (${origin} → ${destination})`,
          time: new Date(b.bookingDate || new Date()),
          icon: 'ticket'
        });
      });

      // ✅ Add IN_TRANSIT package activities
      inTransitPackages.slice(0, 2).forEach(p => {
        recentActivities.push({
          type: 'package_booked',
          title: 'Package Booked',
          description: `${p.trackingNumber}: ${p.senderNames || 'Sender'} → ${p.receiverNames || 'Receiver'}`,
          time: new Date(p.bookingDate || new Date()),
          icon: 'package_booked'
        });
      });

      // ✅ Add ARRIVED package activities
      arrivedPackages.slice(0, 2).forEach(p => {
        const arrivalTime = p.actualArrivalTime || 
                           p.expectedArrivalTime ||
                           p.bookingDate || 
                           new Date();
        
        const destination = p.destination || 
                          p.dailyTrip?.route?.destination ||
                          'destination';
        
        recentActivities.push({
          type: 'package_arrived',
          title: 'Package Arrived',
          description: `${p.trackingNumber} arrived at ${destination}`,
          time: new Date(arrivalTime),
          icon: 'package_arrived'
        });
      });

      // ✅ Add COLLECTED package activities
      collectedPackages.slice(0, 2).forEach(p => {
        const collectionTime = p.collectedAt || 
                              p.actualArrivalTime ||
                              p.bookingDate || 
                              new Date();
        
        recentActivities.push({
          type: 'package_collected',
          title: 'Package Collected',
          description: `${p.trackingNumber} collected by ${p.collectedByName || p.receiverNames || 'recipient'}`,
          time: new Date(collectionTime),
          icon: 'package_collected'
        });
      });

      // Sort by time descending and take top 5
      recentActivities.sort((a, b) => b.time - a.time);
      const sortedActivities = recentActivities.slice(0, 5);

      // System health checks
      const systemIssues = [];
      if (maintenanceVehicles > 0) {
        systemIssues.push(`${maintenanceVehicles} vehicle(s) in maintenance`);
      }
      if (vehicleInspections?.overdueCount > 0) {
        systemIssues.push(`${vehicleInspections.overdueCount} overdue inspection(s)`);
      }
      if (incidentStats?.criticalIncidents > 0) {
        systemIssues.push(`${incidentStats.criticalIncidents} critical incident(s)`);
      }
      if (arrivedPackages.length > 5) {
        systemIssues.push(`${arrivedPackages.length} packages awaiting collection`);
      }

      setDashboardData({
        users: {
          total: Array.isArray(users) ? users.length : 0,
          active: activeUsers,
          inactive: inactiveUsers
        },
        vehicles: {
          total: vehicles.length,
          available: availableVehicles,
          maintenance: maintenanceVehicles
        },
        bookings: {
          today: todayBookings.length,
          thisWeek: todayBookings.length * 5, // Estimate
          revenue: todayRevenue
        },
        packages: {
          total: allPackages.length,
          inTransit: inTransitPackages.length,
          arrived: arrivedPackages.length,
          collected: collectedPackages.length,
          cancelled: allPackages.filter(p => p.packageStatus === 'CANCELLED').length,
          totalRevenue: packageRevenue
        },
        incidents: {
          total: incidentStats.totalIncidents || 0,
          critical: incidentStats.criticalIncidents || 0,
          unresolved: incidentStats.reportedIncidents || 0
        },
        feedback: {
          total: feedbackStats.totalFeedbacks || 0,
          positive: feedbackStats.positiveFeedbacks || 0,
          negative: feedbackStats.negativeFeedbacks || 0,
          averageRating: feedbackStats.averageRating || 0
        },
        recentActivities: sortedActivities,
        upcomingTrips,
        systemHealth: {
          status: systemIssues.length === 0 ? 'good' : systemIssues.length < 3 ? 'warning' : 'critical',
          issues: systemIssues
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendUp, color = 'blue' }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-gray-800 flex items-center justify-center shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {trendUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    // ✅ Enhanced icons for all package states
    const icons = {
      ticket: <CheckCircle className="w-5 h-5 text-green-600" />,
      package_booked: <Package className="w-5 h-5 text-blue-600" />,
      package_arrived: <Truck className="w-5 h-5 text-orange-600" />,
      package_collected: <PackageCheck className="w-5 h-5 text-green-600" />,
      incident: <AlertTriangle className="w-5 h-5 text-red-600" />
    };

    // ✅ Color coding for different activity types
    const bgColors = {
      ticket: 'bg-green-100',
      package_booked: 'bg-blue-100',
      package_arrived: 'bg-orange-100',
      package_collected: 'bg-green-100',
      incident: 'bg-red-100'
    };

    return (
      <div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`w-10 h-10 rounded-full ${bgColors[activity.icon] || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
          {icons[activity.icon] || <Activity className="w-5 h-5 text-gray-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
          <p className="text-sm text-gray-600 truncate">{activity.description}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
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
            Admin Dashboard
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

      {/* System Health Alert */}
      {dashboardData.systemHealth.status !== 'good' && (
        <div className={`p-4 rounded-xl border-2 ${
          dashboardData.systemHealth.status === 'critical' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${
              dashboardData.systemHealth.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <div>
              <p className={`font-semibold ${
                dashboardData.systemHealth.status === 'critical' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                System Attention Required
              </p>
              <ul className={`mt-2 space-y-1 text-sm ${
                dashboardData.systemHealth.status === 'critical' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {dashboardData.systemHealth.issues.map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Primary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={dashboardData.users.total}
          subtitle={`${dashboardData.users.active} active, ${dashboardData.users.inactive} inactive`}
          trend="12%"
          trendUp={true}
          color="blue"
        />
        <StatCard
          icon={Car}
          title="Fleet Status"
          value={dashboardData.vehicles.available}
          subtitle={`of ${dashboardData.vehicles.total} vehicles available`}
          trend="5%"
          trendUp={true}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          title="Today's Revenue"
          value={`${dashboardData.bookings.revenue.toLocaleString()} RWF`}
          subtitle={`${dashboardData.bookings.today} bookings today`}
          trend="8%"
          trendUp={true}
          color="emerald"
        />
        <StatCard
          icon={Package}
          title="Active Packages"
          value={dashboardData.packages.inTransit}
          subtitle={`${dashboardData.packages.total} total packages`}
          trend="3%"
          trendUp={false}
          color="purple"
        />
      </div>

      {/* Secondary Statistics - Enhanced Package Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">In Transit</p>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{dashboardData.packages.inTransit}</p>
          <p className="text-xs text-gray-500 mt-1">Packages on the way</p>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Arrived</p>
            <MapPin className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{dashboardData.packages.arrived}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting collection</p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Collected</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{dashboardData.packages.collected}</p>
          <p className="text-xs text-gray-500 mt-1">Successfully delivered</p>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Package Revenue</p>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {dashboardData.packages.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">RWF total</p>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={AlertTriangle}
          title="Incidents"
          value={dashboardData.incidents.unresolved}
          subtitle={`${dashboardData.incidents.critical} critical, ${dashboardData.incidents.total} total`}
          color="red"
        />
        <StatCard
          icon={MessageSquare}
          title="Customer Feedback"
          value={`${dashboardData.feedback.averageRating}/5.0`}
          subtitle={`${dashboardData.feedback.total} total responses`}
          color="yellow"
        />
        <StatCard
          icon={Shield}
          title="Safety Status"
          value={dashboardData.vehicles.total - dashboardData.vehicles.maintenance}
          subtitle={`${dashboardData.vehicles.maintenance} in maintenance`}
          color="indigo"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            {dashboardData.recentActivities.length > 0 ? (
              dashboardData.recentActivities.map((activity, i) => (
                <ActivityItem key={i} activity={activity} />
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No recent activity</p>
            )}
          </div>
        </div>

        {/* Upcoming Trips */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Trips</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {dashboardData.upcomingTrips.length > 0 ? (
              dashboardData.upcomingTrips.map((trip, i) => (
                <div key={i} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <p className="font-semibold text-gray-900 text-sm">
                      {trip.routeName || `${trip.origin} → ${trip.destination}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(trip.tripDate).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-blue-700">
                      {trip.availableSeats || 0} seats
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8 text-sm">No upcoming trips</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-gray-800 rounded-2xl shadow-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Performance Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Total Bookings</p>
            <p className="text-3xl font-bold">{dashboardData.bookings.thisWeek}</p>
            <p className="text-blue-200 text-xs mt-1">This week</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Total Packages</p>
            <p className="text-3xl font-bold">{dashboardData.packages.total}</p>
            <p className="text-blue-200 text-xs mt-1">All statuses</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Positive Feedback</p>
            <p className="text-3xl font-bold">
              {Math.round((dashboardData.feedback.positive / dashboardData.feedback.total) * 100) || 0}%
            </p>
            <p className="text-blue-200 text-xs mt-1">Customer satisfaction</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Fleet Utilization</p>
            <p className="text-3xl font-bold">
              {Math.round((dashboardData.vehicles.available / dashboardData.vehicles.total) * 100) || 0}%
            </p>
            <p className="text-blue-200 text-xs mt-1">Available now</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;