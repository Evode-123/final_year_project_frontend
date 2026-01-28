import React, { useState, useEffect } from 'react';
import { 
  Ticket,
  Package,
  Clock,
  MapPin,
  Calendar,
  MessageSquare,
  Activity,
  Navigation,
  PackageCheck,
  Loader
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';
import packageApiService from '../../services/packageApiService';
import feedbackApiService from '../../services/feedbackApiService';

const OtherUserDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    activeBookings: [],
    upcomingTrips: [],
    bookingHistory: { total: 0, recent: [] },
    myPackages: { sent: [], received: [] },
    packageStats: { total: 0, inTransit: 0, delivered: 0 },
    myFeedback: [],
    feedbackStats: { total: 0, unreadResponses: 0 }
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
        activeBookings,
        bookingHistory,
        sentPackages,
        receivedPackages,
        myFeedback,
        unreadResponses
      ] = await Promise.all([
        transportApiService.getMyActiveBookings().catch(() => []),
        transportApiService.getMyBookingHistory().catch(() => []),
        packageApiService.getMySentPackages().catch(() => []),
        packageApiService.getMyReceivedPackages().catch(() => []),
        feedbackApiService.getMyFeedbacks().catch(() => []),
        feedbackApiService.getMyUnreadResponsesCount().catch(() => ({ count: 0 }))
      ]);

      // Log package data to debug
      console.log('=== PACKAGE DATA DEBUG ===');
      console.log('Sent Packages:', sentPackages);
      console.log('First Sent Package:', sentPackages[0]);
      console.log('Received Packages:', receivedPackages);
      console.log('First Received Package:', receivedPackages[0]);
      console.log('========================');

      // Get upcoming trips from booking history (not from activeBookings)
      const now = new Date();
      const upcomingTrips = (bookingHistory || []).filter(booking => {
        if (!booking || !booking.dailyTrip || !booking.dailyTrip.tripDate) return false;
        
        try {
          const tripDate = new Date(booking.dailyTrip.tripDate);
          const departureTime = booking.dailyTrip.timeSlot?.departureTime;
          
          if (departureTime) {
            const [hours, minutes] = departureTime.split(':').map(Number);
            tripDate.setHours(hours, minutes, 0, 0);
          }
          
          return tripDate > now && booking.bookingStatus === 'CONFIRMED';
        } catch (error) {
          console.error('Error processing trip date:', error);
          return false;
        }
      }).sort((a, b) => new Date(a.dailyTrip.tripDate) - new Date(b.dailyTrip.tripDate));

      // Calculate package statistics - Fixed to use correct status field
      const allPackages = [...(sentPackages || []), ...(receivedPackages || [])];
      const inTransitPackages = allPackages.filter(p => p && p.packageStatus === 'IN_TRANSIT').length;
      const deliveredPackages = allPackages.filter(p => p && p.packageStatus === 'COLLECTED').length;

      setDashboardData({
        activeBookings: activeBookings || [],
        upcomingTrips: upcomingTrips.slice(0, 5),
        bookingHistory: {
          total: (bookingHistory || []).length,
          recent: (bookingHistory || []).slice(0, 5)
        },
        myPackages: {
          sent: sentPackages || [],
          received: receivedPackages || []
        },
        packageStats: {
          total: allPackages.length,
          inTransit: inTransitPackages,
          delivered: deliveredPackages
        },
        myFeedback,
        feedbackStats: {
          total: (myFeedback || []).length,
          unreadResponses: unreadResponses.count || 0
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue', badge }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${color}-600 to-gray-800 flex items-center justify-center shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        {badge && (
          <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
            {badge}
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

  const BookingCard = ({ booking }) => {
    if (!booking || !booking.dailyTrip) return null;
    
    const tripDate = new Date(booking.dailyTrip.tripDate);
    const isUpcoming = tripDate > new Date();
    const departureTime = booking.dailyTrip.timeSlot?.departureTime || '';

    return (
      <div className={`p-5 rounded-xl border-2 transition-all ${
        isUpcoming 
          ? 'bg-gradient-to-r from-blue-50 to-gray-50 border-blue-300 shadow-md' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
              {booking.ticketNumber || 'N/A'}
            </span>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              {tripDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {departureTime && (
                <>
                  <Clock className="w-3 h-3 ml-2" />
                  {departureTime}
                </>
              )}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            booking.bookingStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
            booking.bookingStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {booking.bookingStatus || 'PENDING'}
          </span>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-900">
              {booking.dailyTrip.route?.origin || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2 pl-6">
            <MapPin className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-gray-900">
              {booking.dailyTrip.route?.destination || 'N/A'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Seat {booking.seatNumber || 'N/A'}</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {parseFloat(booking.price || 0).toLocaleString()} RWF
          </div>
        </div>
      </div>
    );
  };

  const PackageCard = ({ pkg, type }) => {
    if (!pkg) return null;
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'IN_TRANSIT': return 'bg-blue-100 text-blue-700';
        case 'ARRIVED': return 'bg-yellow-100 text-yellow-700';
        case 'COLLECTED': return 'bg-green-100 text-green-700';
        case 'CANCELLED': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
      }
    };

    return (
      <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
            <p className="text-sm font-bold text-gray-900">{pkg.trackingNumber || 'N/A'}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(pkg.packageStatus)}`}>
            {(pkg.packageStatus || 'PENDING').replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-1 text-sm text-gray-600 mb-3">
          {/* ✅ FIXED: Use direct properties from PackageResponseDTO */}
          <p><span className="font-medium">From:</span> {pkg.senderNames || 'N/A'}</p>
          <p><span className="font-medium">To:</span> {pkg.receiverNames || 'N/A'}</p>
          <p><span className="font-medium">Route:</span> {pkg.origin || 'N/A'} → {pkg.destination || 'N/A'}</p>
        </div>

        <div className="text-xs text-gray-500">
          Booked: {pkg.bookingDate ? new Date(pkg.bookingDate).toLocaleDateString() : 'N/A'}
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
            Dashboard
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
          title="Active Bookings"
          value={dashboardData.upcomingTrips.length}
          subtitle={`${dashboardData.upcomingTrips.length} upcoming trips`}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          title="Total Trips"
          value={dashboardData.bookingHistory.total}
          subtitle="All-time bookings"
          color="blue"
        />
        <StatCard
          icon={Package}
          title="My Packages"
          value={dashboardData.packageStats.total}
          subtitle={`${dashboardData.packageStats.inTransit} in transit`}
          color="blue"
        />
        <StatCard
          icon={MessageSquare}
          title="My Feedback"
          value={dashboardData.feedbackStats.total}
          subtitle="Total feedback given"
          color="blue"
          badge={dashboardData.feedbackStats.unreadResponses > 0 ? dashboardData.feedbackStats.unreadResponses : null}
        />
      </div>

      {/* Upcoming Trips */}
      {dashboardData.upcomingTrips.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Trips</h2>
            <Navigation className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.upcomingTrips.map((booking, i) => (
              <BookingCard key={booking.id || i} booking={booking} />
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Packages */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Packages</h2>
            <PackageCheck className="w-5 h-5 text-gray-400" />
          </div>
          
          {dashboardData.myPackages.sent.length === 0 && dashboardData.myPackages.received.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No packages yet</p>
              <p className="text-gray-400 text-sm mt-1">Send or receive packages to see them here</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {dashboardData.myPackages.sent.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Sent Packages</h3>
                  <div className="space-y-3">
                    {dashboardData.myPackages.sent.slice(0, 3).map((pkg, i) => (
                      <PackageCard key={pkg.id || i} pkg={pkg} type="sent" />
                    ))}
                  </div>
                </div>
              )}
              
              {dashboardData.myPackages.received.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Received Packages</h3>
                  <div className="space-y-3">
                    {dashboardData.myPackages.received.slice(0, 3).map((pkg, i) => (
                      <PackageCard key={pkg.id || i} pkg={pkg} type="received" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {dashboardData.bookingHistory.recent.length > 0 ? (
              dashboardData.bookingHistory.recent.map((booking, i) => (
                <div key={booking.id || i} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">#{booking.ticketNumber || 'N/A'}</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      booking.bookingStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      booking.bookingStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.bookingStatus || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {booking.dailyTrip?.route?.origin || 'N/A'} → {booking.dailyTrip?.route?.destination || 'N/A'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>
                      {booking.dailyTrip?.tripDate 
                        ? new Date(booking.dailyTrip.tripDate).toLocaleDateString() 
                        : 'N/A'}
                    </span>
                    <span className="font-bold text-blue-600">
                      {parseFloat(booking.price || 0).toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No bookings yet</p>
                <p className="text-gray-400 text-sm mt-1">Start booking trips to see your history</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-gray-800 rounded-2xl shadow-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Quick Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Active Bookings</p>
            <p className="text-3xl font-bold">{dashboardData.upcomingTrips.length}</p>
            <p className="text-blue-200 text-xs mt-1">Current</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Total Trips</p>
            <p className="text-3xl font-bold">{dashboardData.bookingHistory.total}</p>
            <p className="text-blue-200 text-xs mt-1">All-time</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Packages</p>
            <p className="text-3xl font-bold">{dashboardData.packageStats.total}</p>
            <p className="text-blue-200 text-xs mt-1">{dashboardData.packageStats.delivered} delivered</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-1">Feedback</p>
            <p className="text-3xl font-bold">{dashboardData.feedbackStats.total}</p>
            <p className="text-blue-200 text-xs mt-1">Reviews given</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherUserDashboard;