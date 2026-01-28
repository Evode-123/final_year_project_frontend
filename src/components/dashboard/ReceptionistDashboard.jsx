import React, { useState, useEffect } from 'react';
import { 
  Ticket,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Calendar,
  MapPin,
  Activity,
  ArrowUp,
  ArrowDown,
  Search,
  PackageCheck,
  Loader,
  Truck,
  CheckCircle
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';
import packageApiService from '../../services/packageApiService';

const ReceptionistDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    bookings: { today: 0, thisWeek: 0, revenue: 0, recentBookings: [] },
    packages: { inTransit: 0, arrived: 0, collected: 0, recentPackages: [] },
    availableTrips: [],
    todaySchedule: [],
    statistics: { totalPassengers: 0, avgBookingValue: 0, topRoute: '' }
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
        todayBookings,
        bookingHistory,
        availableTrips,
        inTransitPackages,
        arrivedPackages,
        collectedPackages
      ] = await Promise.all([
        transportApiService.getTodayBookings().catch(() => []),
        transportApiService.getAllBookingsHistory().catch(() => []),
        transportApiService.getAvailableTrips().catch(() => []),
        packageApiService.getInTransitPackages().catch(() => []),
        packageApiService.getArrivedPackages().catch(() => []),
        packageApiService.getCollectedPackages().catch(() => [])
      ]);

      console.log('📊 Sample Booking:', todayBookings[0]);

      // ✅ FIXED: Calculate revenue with multiple field name attempts
      const todayRevenue = todayBookings.reduce((sum, b) => {
        const amount = b.totalAmount || 
                      b.amount || 
                      b.price || 
                      b.fare || 
                      b.totalPrice || 
                      b.ticketPrice || 
                      b.cost ||
                      0;
        return sum + parseFloat(amount);
      }, 0);
      
      // Calculate weekly bookings (estimate)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const weeklyBookings = bookingHistory.filter(b => 
        new Date(b.bookingDate) >= lastWeek
      ).length;

      // Get today's trips
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaySchedule = availableTrips.filter(trip => {
        const tripDate = new Date(trip.tripDate);
        return tripDate >= today && tripDate < tomorrow;
      }).slice(0, 5);

      // Calculate statistics
      const totalPassengers = todayBookings.reduce((sum, b) => sum + (b.numberOfSeats || 1), 0);
      const avgBookingValue = todayBookings.length > 0 
        ? todayRevenue / todayBookings.length 
        : 0;

      // ✅ Find top route with proper field extraction (SAME AS MANAGER)
      const routeCounts = {};
      todayBookings.forEach(b => {
        // Extract origin and destination from multiple possible locations
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
        
        const route = `${origin} → ${destination}`;
        routeCounts[route] = (routeCounts[route] || 0) + 1;
      });
      
      const topRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No bookings yet';

      console.log('🏆 Top Route:', topRoute, 'Route Counts:', routeCounts);

      // ✅ Recent booking activities with proper field access (SAME AS MANAGER)
      const recentBookings = todayBookings
        .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
        .slice(0, 5)
        .map(b => {
          // Extract passenger name
          const passengerName = b.passengerName || 
                               b.customer?.names || 
                               b.customer?.name ||
                               b.customerName ||
                               'Guest';
          
          // Extract origin and destination (SAME AS MANAGER)
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
          
          return {
            type: 'booking',
            activityType: 'ticket_booking',
            title: `Ticket #${b.ticketNumber}`,
            description: `${passengerName} - ${origin} to ${destination}`,
            time: new Date(b.bookingDate || new Date()),
            amount: b.totalAmount || b.amount || b.price || 0
          };
        });

      // ✅ FIXED: Build comprehensive package activities with all states
      const recentPackages = [];

      // Package Booked (In Transit)
      inTransitPackages
        .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
        .slice(0, 2)
        .forEach(p => {
          const senderName = p.senderNames || p.senderName || 'Sender';
          const receiverName = p.receiverNames || p.receiverName || 'Receiver';
          
          recentPackages.push({
            type: 'package',
            activityType: 'package_booked',
            title: `Package ${p.trackingNumber}`,
            description: `${senderName} → ${receiverName} (In Transit)`,
            time: new Date(p.bookingDate || new Date()),
            status: 'IN_TRANSIT'
          });
        });

      // Package Arrived
      arrivedPackages
        .sort((a, b) => {
          const timeA = new Date(b.actualArrivalTime || b.expectedArrivalTime || b.bookingDate || new Date());
          const timeB = new Date(a.actualArrivalTime || a.expectedArrivalTime || a.bookingDate || new Date());
          return timeA - timeB;
        })
        .slice(0, 2)
        .forEach(p => {
          const senderName = p.senderNames || p.senderName || 'Sender';
          const receiverName = p.receiverNames || p.receiverName || 'Receiver';
          const arrivalTime = p.actualArrivalTime || 
                             p.expectedArrivalTime ||
                             p.bookingDate || 
                             new Date();
          
          recentPackages.push({
            type: 'package',
            activityType: 'package_arrived',
            title: `Package ${p.trackingNumber}`,
            description: `${senderName} → ${receiverName} (Arrived)`,
            time: new Date(arrivalTime),
            status: 'ARRIVED'
          });
        });

      // Package Collected
      collectedPackages
        .sort((a, b) => {
          const timeA = new Date(b.collectedAt || b.actualArrivalTime || b.bookingDate || new Date());
          const timeB = new Date(a.collectedAt || a.actualArrivalTime || a.bookingDate || new Date());
          return timeA - timeB;
        })
        .slice(0, 2)
        .forEach(p => {
          const receiverName = p.collectedByName || p.receiverNames || p.receiverName || 'Recipient';
          const collectionTime = p.collectedAt || 
                                p.actualArrivalTime ||
                                p.bookingDate || 
                                new Date();
          
          recentPackages.push({
            type: 'package',
            activityType: 'package_collected',
            title: `Package ${p.trackingNumber}`,
            description: `Collected by ${receiverName}`,
            time: new Date(collectionTime),
            status: 'COLLECTED'
          });
        });

      setDashboardData({
        bookings: {
          today: todayBookings.length,
          thisWeek: weeklyBookings,
          revenue: todayRevenue,
          recentBookings
        },
        packages: {
          inTransit: inTransitPackages.length,
          arrived: arrivedPackages.length,
          collected: collectedPackages.length,
          recentPackages
        },
        availableTrips: availableTrips.slice(0, 8),
        todaySchedule,
        statistics: {
          totalPassengers,
          avgBookingValue: Math.round(avgBookingValue),
          topRoute
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
    // ✅ Enhanced icons and colors for different activity types
    const getActivityConfig = () => {
      switch(activity.activityType) {
        case 'ticket_booking':
          return {
            icon: <Ticket className="w-5 h-5 text-blue-600" />,
            bgColor: 'bg-blue-100'
          };
        case 'package_booked':
          return {
            icon: <Package className="w-5 h-5 text-blue-600" />,
            bgColor: 'bg-blue-100'
          };
        case 'package_arrived':
          return {
            icon: <Truck className="w-5 h-5 text-orange-600" />,
            bgColor: 'bg-orange-100'
          };
        case 'package_collected':
          return {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            bgColor: 'bg-green-100'
          };
        default:
          return {
            icon: activity.type === 'booking' ? 
              <Ticket className="w-5 h-5 text-blue-600" /> : 
              <Package className="w-5 h-5 text-purple-600" />,
            bgColor: activity.type === 'booking' ? 'bg-blue-100' : 'bg-purple-100'
          };
      }
    };

    const config = getActivityConfig();

    return (
      <div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
            {activity.amount && activity.amount > 0 && (
              <span className="text-sm font-bold text-green-600">
                {activity.amount.toLocaleString()} RWF
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">{activity.description}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  const TripCard = ({ trip }) => {
    const tripDate = new Date(trip.tripDate);
    const availabilityPercent = trip.capacity > 0 ? ((trip.availableSeats / trip.capacity) * 100).toFixed(0) : 0;
    const isFullySold = trip.availableSeats === 0;
    const isAlmostFull = availabilityPercent < 20;

    return (
      <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <p className="font-semibold text-gray-900 text-sm">
                {trip.origin || 'Origin'} → {trip.destination || 'Destination'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {trip.departureTime ? 
                  new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                  'N/A'
                }
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {tripDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              {trip.price?.toLocaleString() || '0'} <span className="text-xs text-gray-500">RWF</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className={`px-2 py-1 rounded text-xs font-semibold ${
            isFullySold ? 'bg-red-100 text-red-700' :
            isAlmostFull ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {isFullySold ? 'Sold Out' : `${trip.availableSeats} seats left`}
          </div>
          <div className="text-xs text-gray-500">
            {trip.vehicleType || 'Bus'}
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
            Receptionist Dashboard
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

      {/* Primary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Ticket}
          title="Today's Bookings"
          value={dashboardData.bookings.today}
          subtitle={`${dashboardData.bookings.thisWeek} this week`}
          trend="12%"
          trendUp={true}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          title="Today's Revenue"
          value={`${dashboardData.bookings.revenue.toLocaleString()} RWF`}
          subtitle={`Avg: ${dashboardData.statistics.avgBookingValue.toLocaleString()} RWF/ticket`}
          trend="8%"
          trendUp={true}
          color="green"
        />
        <StatCard
          icon={Package}
          title="Packages Arrived"
          value={dashboardData.packages.arrived}
          subtitle={`${dashboardData.packages.inTransit} in transit`}
          trend="5%"
          trendUp={false}
          color="purple"
        />
        <StatCard
          icon={Users}
          title="Passengers Today"
          value={dashboardData.statistics.totalPassengers}
          subtitle="Total seats booked"
          trend="15%"
          trendUp={true}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={PackageCheck}
          title="Ready for Collection"
          value={dashboardData.packages.arrived}
          subtitle="Awaiting customer pickup"
          color="indigo"
        />
        <StatCard
          icon={Search}
          title="Available Trips"
          value={dashboardData.availableTrips.length}
          subtitle="Ready for booking"
          color="teal"
        />
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-gray-800 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">Top Route</p>
            <p className="text-xl font-bold text-gray-900 mb-1">{dashboardData.statistics.topRoute}</p>
            <p className="text-gray-500 text-xs">Most booked today</p>
          </div>
        </div>
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
            {[...dashboardData.bookings.recentBookings, ...dashboardData.packages.recentPackages]
              .sort((a, b) => b.time - a.time)
              .slice(0, 6)
              .map((activity, i) => (
                <ActivityItem key={i} activity={activity} />
              ))}
            {dashboardData.bookings.recentBookings.length === 0 && 
             dashboardData.packages.recentPackages.length === 0 && (
              <p className="text-center text-gray-500 py-8">No recent activity</p>
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {dashboardData.todaySchedule.length > 0 ? (
              dashboardData.todaySchedule.map((trip, i) => (
                <div key={i} className="p-3 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-900">
                      {trip.departureTime ? 
                        new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                        'N/A'
                      }
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {trip.origin || 'Origin'} → {trip.destination || 'Destination'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {trip.availableSeats || 0} / {trip.capacity || 0} seats available
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8 text-sm">No trips scheduled today</p>
            )}
          </div>
        </div>
      </div>

      {/* Available Trips for Booking */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Available Trips for Booking</h2>
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardData.availableTrips.length > 0 ? (
            dashboardData.availableTrips.map((trip, i) => (
              <TripCard key={i} trip={trip} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No trips available for booking</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-gray-800 rounded-2xl shadow-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Daily Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Bookings</p>
            <p className="text-3xl font-bold">{dashboardData.bookings.today}</p>
            <p className="text-blue-200 text-xs mt-1">Today</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Revenue</p>
            <p className="text-3xl font-bold">
              {dashboardData.bookings.revenue >= 1000 
                ? `${(dashboardData.bookings.revenue / 1000).toFixed(1)}K`
                : dashboardData.bookings.revenue
              }
            </p>
            <p className="text-blue-200 text-xs mt-1">RWF</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Packages</p>
            <p className="text-3xl font-bold">{dashboardData.packages.arrived}</p>
            <p className="text-blue-200 text-xs mt-1">Arrived</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Passengers</p>
            <p className="text-3xl font-bold">{dashboardData.statistics.totalPassengers}</p>
            <p className="text-blue-200 text-xs mt-1">Served</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;