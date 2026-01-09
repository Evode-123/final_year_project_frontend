import React, { useState } from 'react';
import { Search, Package as PackageIcon, MapPin, Clock, User, Phone, CheckCircle, Truck, XCircle } from 'lucide-react';
import packageApiService from '../../services/packageApiService';

const PACKAGE_STATUS = {
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  COLLECTED: 'COLLECTED',
  CANCELLED: 'CANCELLED'
};

const PackageTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [packageInfo, setPackageInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrackPackage = async (e) => {
    e.preventDefault();
    setError('');
    setPackageInfo(null);

    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    try {
      setLoading(true);
      const data = await packageApiService.trackPackage(trackingNumber.trim());
      setPackageInfo(data);
    } catch (err) {
      setError('Package not found. Please check the tracking number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case PACKAGE_STATUS.IN_TRANSIT:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case PACKAGE_STATUS.ARRIVED:
        return 'bg-green-100 text-green-800 border-green-200';
      case PACKAGE_STATUS.COLLECTED:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case PACKAGE_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case PACKAGE_STATUS.IN_TRANSIT:
        return <Truck className="w-6 h-6" />;
      case PACKAGE_STATUS.ARRIVED:
        return <MapPin className="w-6 h-6" />;
      case PACKAGE_STATUS.COLLECTED:
        return <CheckCircle className="w-6 h-6" />;
      case PACKAGE_STATUS.CANCELLED:
        return <XCircle className="w-6 h-6" />;
      default:
        return <PackageIcon className="w-6 h-6" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case PACKAGE_STATUS.IN_TRANSIT:
        return 'Your package is on the way';
      case PACKAGE_STATUS.ARRIVED:
        return 'Package has arrived - Ready for collection';
      case PACKAGE_STATUS.COLLECTED:
        return 'Package has been delivered';
      case PACKAGE_STATUS.CANCELLED:
        return 'Package delivery was cancelled';
      default:
        return 'Unknown status';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Package Tracking</h1>
        <p className="text-gray-600 mt-1">Track your package delivery status</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <form onSubmit={handleTrackPackage} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tracking Number
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <PackageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="PKG-20260107-12345"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Track
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Package Information */}
      {packageInfo && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className={`rounded-lg border-2 p-6 ${getStatusColor(packageInfo.packageStatus)}`}>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {getStatusIcon(packageInfo.packageStatus)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">
                  {getStatusMessage(packageInfo.packageStatus)}
                </h3>
                <p className="text-sm mt-1">
                  Tracking: {packageInfo.trackingNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Trip Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Route</p>
                  <p className="font-semibold text-gray-800">
                    {packageInfo.origin} → {packageInfo.destination}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Departure</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(packageInfo.travelDate).toLocaleDateString()} at {packageInfo.departureTime}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Expected Arrival</p>
                  <p className="font-semibold text-gray-800">
                    {formatDateTime(packageInfo.expectedArrivalTime)}
                  </p>
                </div>
              </div>
              {packageInfo.actualArrivalTime && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Actual Arrival</p>
                    <p className="font-semibold text-gray-800">
                      {formatDateTime(packageInfo.actualArrivalTime)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sender & Receiver */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sender */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Sender
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-800">{packageInfo.senderNames}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {packageInfo.senderPhone}
                  </p>
                </div>
              </div>
            </div>

            {/* Receiver */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Receiver
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-800">{packageInfo.receiverNames}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {packageInfo.receiverPhone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID Number</p>
                  <p className="font-semibold text-gray-800">{packageInfo.receiverIdNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Package Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packageInfo.packageDescription && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-semibold text-gray-800">{packageInfo.packageDescription}</p>
                </div>
              )}
              {packageInfo.packageWeight && (
                <div>
                  <p className="text-sm text-gray-600">Weight</p>
                  <p className="font-semibold text-gray-800">{packageInfo.packageWeight} kg</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-semibold text-gray-800">RWF {packageInfo.price}</p>
              </div>
              {packageInfo.isFragile && (
                <div className="md:col-span-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    ⚠️ Fragile - Handle with care
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collection Information */}
          {packageInfo.packageStatus === PACKAGE_STATUS.COLLECTED && packageInfo.collectedAt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-800 mb-4">✅ Delivery Confirmed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Collected By</p>
                  <p className="font-semibold text-gray-800">{packageInfo.collectedByName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Collection Time</p>
                  <p className="font-semibold text-gray-800">
                    {formatDateTime(packageInfo.collectedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Collection Instructions */}
          {packageInfo.packageStatus === PACKAGE_STATUS.ARRIVED && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4">📍 Collection Instructions</h3>
              <div className="space-y-3 text-sm text-blue-900">
                <p>• <strong>Location:</strong> {packageInfo.destination}</p>
                <p>• <strong>Operating Hours:</strong> 8:00 AM - 6:00 PM (Monday - Saturday)</p>
                <p>• <strong>Required:</strong> Bring your National ID ({packageInfo.receiverIdNumber})</p>
                <p>• <strong>Contact:</strong> {packageInfo.receiverPhone}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PackageTracking;