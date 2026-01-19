import React, { useState, useEffect } from 'react';
import { 
  Package as PackageIcon, 
  Search, 
  Truck, 
  CheckCircle,
  MapPin,
  AlertCircle,
  Loader,
  Filter,
  Send,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import packageApiService from '../../services/packageApiService';

const MyPackagesPanel = () => {
  const { user } = useAuth();
  const [sentPackages, setSentPackages] = useState([]);
  const [receivedPackages, setReceivedPackages] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchedPackage, setSearchedPackage] = useState(null);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' or 'received'
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadMyPackages();
    loadStatistics();
  }, []);

  const loadMyPackages = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load both sent and received packages
      const [sent, received] = await Promise.all([
        packageApiService.getMySentPackages(),
        packageApiService.getMyReceivedPackages()
      ]);
      
      setSentPackages(sent);
      setReceivedPackages(received);
    } catch (err) {
      setError('Failed to load packages: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await packageApiService.getMyStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleTrackPackage = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    try {
      setSearching(true);
      setError('');
      setSearchedPackage(null);
      const pkg = await packageApiService.trackPackage(trackingNumber);
      setSearchedPackage(pkg);
    } catch (err) {
      setError('Package not found. Please check the tracking number and try again.');
    } finally {
      setSearching(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'IN_TRANSIT':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'ARRIVED':
        return <MapPin className="w-5 h-5 text-yellow-600" />;
      case 'COLLECTED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'CANCELLED':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <PackageIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ARRIVED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'COLLECTED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const currentPackages = activeTab === 'sent' ? sentPackages : receivedPackages;
  const filteredPackages = statusFilter === 'ALL' 
    ? currentPackages 
    : currentPackages.filter(pkg => pkg.packageStatus === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600 mt-4">Loading your packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Packages</h1>
        <p className="text-gray-600 mt-1">Track and manage your package deliveries</p>
      </div>

      {/* Quick Track Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          Quick Track Package
        </h3>
        <form onSubmit={handleTrackPackage} className="flex gap-3">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number (e.g., PKG-20250117-001)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={searching || !trackingNumber.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Tracking...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Track
              </>
            )}
          </button>
        </form>

        {/* Searched Package Result */}
        {searchedPackage && (
          <div className="mt-4 bg-white border-2 border-blue-300 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-lg font-bold text-gray-800">{searchedPackage.trackingNumber}</p>
                <p className="text-sm text-gray-600">{searchedPackage.packageDescription}</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(searchedPackage.packageStatus)}`}>
                {getStatusIcon(searchedPackage.packageStatus)}
                <span className="font-semibold">{searchedPackage.packageStatus}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">From:</span>
                <p className="font-semibold">{searchedPackage.senderNames}</p>
              </div>
              <div>
                <span className="text-gray-600">To:</span>
                <p className="font-semibold">{searchedPackage.receiverNames}</p>
              </div>
              <div>
                <span className="text-gray-600">Route:</span>
                <p className="font-semibold">{searchedPackage.origin} → {searchedPackage.destination}</p>
              </div>
              <div>
                <span className="text-gray-600">Travel Date:</span>
                <p className="font-semibold">{new Date(searchedPackage.travelDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Package Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sent Packages</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.totalSent}</p>
                </div>
                <Send className="w-10 h-10 text-blue-400" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Transit</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {statistics.sentInTransit + statistics.receivedInTransit}
                  </p>
                </div>
                <Truck className="w-10 h-10 text-blue-400" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Arrived</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {statistics.sentArrived + statistics.receivedArrived}
                  </p>
                </div>
                <MapPin className="w-10 h-10 text-yellow-400" />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Collected</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.sentCollected + statistics.receivedCollected}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs: Sent vs Received */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'sent'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Sent Packages ({sentPackages.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'received'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            Received Packages ({receivedPackages.length})
          </div>
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Filter className="w-5 h-5 text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="ARRIVED">Arrived</option>
          <option value="COLLECTED">Collected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Packages List */}
      {filteredPackages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <PackageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No packages found</p>
          <p className="text-gray-500 text-sm mt-2">
            {statusFilter !== 'ALL' 
              ? `No ${statusFilter.toLowerCase()} packages` 
              : `No ${activeTab} packages yet`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <PackageIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">{pkg.trackingNumber}</p>
                    <p className="text-sm text-gray-600">{pkg.packageDescription}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(pkg.packageStatus)}`}>
                  {getStatusIcon(pkg.packageStatus)}
                  <span className="font-semibold text-sm">{pkg.packageStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <Send className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Sender</p>
                    <p className="font-semibold text-gray-800">{pkg.senderNames}</p>
                    <p className="text-sm text-gray-600">{pkg.senderPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Inbox className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Receiver</p>
                    <p className="font-semibold text-gray-800">{pkg.receiverNames}</p>
                    <p className="text-sm text-gray-600">{pkg.receiverPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Route</p>
                    <p className="font-semibold text-gray-800">
                      {pkg.origin} → {pkg.destination}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(pkg.travelDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {pkg.collectedAt && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <strong>Collected by {pkg.collectedByName} on:</strong> {new Date(pkg.collectedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {pkg.actualArrivalTime && pkg.packageStatus === 'ARRIVED' && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <strong>Arrived at {pkg.destination}:</strong> {new Date(pkg.actualArrivalTime).toLocaleString()}
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Ready for collection
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPackagesPanel;