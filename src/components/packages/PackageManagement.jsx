import React, { useState, useEffect } from 'react';
import { 
  Package as PackageIcon, 
  CheckCircle, 
  Truck, 
  MapPin,
  User,
  Phone,
  CreditCard,
  X,
  AlertCircle
} from 'lucide-react';
import packageApiService from '../../services/packageApiService';

const PackageManagement = () => {
  const [arrivedPackages, setArrivedPackages] = useState([]);
  const [inTransitPackages, setInTransitPackages] = useState([]);
  const [collectedPackages, setCollectedPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('in-transit');

  // Collection modal state
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [collectionData, setCollectionData] = useState({
    receiverIdNumber: '',
    collectedByName: ''
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const [arrived, inTransit, collected] = await Promise.all([
        packageApiService.getArrivedPackages(),
        packageApiService.getInTransitPackages(),
        packageApiService.getCollectedPackages()
      ]);
      setArrivedPackages(arrived);
      setInTransitPackages(inTransit);
      setCollectedPackages(collected);
    } catch (err) {
      setError('Failed to load packages: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsArrived = async (packageId) => {
    if (!window.confirm('Mark this package as arrived? The receiver will be notified.')) return;

    try {
      await packageApiService.markPackageAsArrived(packageId);
      setSuccess('Package marked as arrived! Receiver has been notified.');
      await loadPackages();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to mark package as arrived: ' + err.message);
    }
  };

  const handleOpenCollectionModal = (pkg) => {
    setSelectedPackage(pkg);
    setCollectionData({
      receiverIdNumber: '',
      collectedByName: pkg.receiverNames
    });
    setShowCollectionModal(true);
  };

  const handleCollectPackage = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPackage) return;

    try {
      await packageApiService.collectPackage({
        packageId: selectedPackage.id,
        receiverIdNumber: collectionData.receiverIdNumber,
        collectedByName: collectionData.collectedByName
      });

      setSuccess('Package delivered successfully! Sender has been notified.');
      setShowCollectionModal(false);
      setSelectedPackage(null);
      setCollectionData({ receiverIdNumber: '', collectedByName: '' });
      
      await loadPackages();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to collect package: ' + err.message);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Package Management</h1>
        <p className="text-gray-600 mt-1">Manage package arrivals and collections</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('in-transit')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'in-transit'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            In Transit ({inTransitPackages.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('arrived')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'arrived'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Arrived ({arrivedPackages.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('collected')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'collected'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Collected ({collectedPackages.length})
          </div>
        </button>
      </div>

      {/* In Transit Tab */}
      {activeTab === 'in-transit' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Tracking #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Receiver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Expected Arrival
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inTransitPackages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No packages in transit
                    </td>
                  </tr>
                ) : (
                  inTransitPackages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{pkg.trackingNumber}</div>
                        <div className="text-xs text-gray-500">
                          {pkg.packageDescription || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">
                          {pkg.origin} → {pkg.destination}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(pkg.travelDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{pkg.receiverNames}</div>
                        <div className="text-xs text-gray-600">{pkg.receiverPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">
                          {formatDateTime(pkg.expectedArrivalTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleMarkAsArrived(pkg.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Mark as Arrived
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Arrived Tab */}
      {activeTab === 'arrived' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {arrivedPackages.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No packages waiting for collection</p>
            </div>
          ) : (
            arrivedPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <PackageIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{pkg.trackingNumber}</div>
                      <div className="text-xs text-gray-500">
                        Arrived: {formatDateTime(pkg.actualArrivalTime)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {pkg.origin} → {pkg.destination}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-xs text-gray-600 mb-1">Receiver:</div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-800">{pkg.receiverNames}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{pkg.receiverPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">ID: {pkg.receiverIdNumber}</span>
                    </div>
                  </div>

                  {pkg.packageDescription && (
                    <div className="text-xs text-gray-600 border-t pt-2">
                      <span className="font-medium">Contents:</span> {pkg.packageDescription}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleOpenCollectionModal(pkg)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Collect Package
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Collected Tab */}
      {activeTab === 'collected' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Tracking #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Receiver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Collected By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Collection Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {collectedPackages.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p>No collected packages yet</p>
                    </td>
                  </tr>
                ) : (
                  collectedPackages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{pkg.trackingNumber}</div>
                            <div className="text-xs text-gray-500">
                              {pkg.packageDescription || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{pkg.receiverNames}</div>
                        <div className="text-xs text-gray-600">{pkg.receiverPhone}</div>
                        <div className="text-xs text-gray-500">ID: {pkg.receiverIdNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{pkg.collectedByName}</div>
                        <div className="text-xs text-gray-600">ID: {pkg.collectedById}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">
                          {formatDateTime(pkg.collectedAt)}
                        </div>
                        <div className="text-xs text-gray-600">
                          Booked: {formatDateTime(pkg.bookingDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">
                          {pkg.origin} → {pkg.destination}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(pkg.travelDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-800">
                          {pkg.price?.toLocaleString()} RWF
                        </div>
                        <div className="text-xs text-gray-600">
                          {pkg.packageWeight}kg • {pkg.paymentMethod}
                        </div>
                        {pkg.isFragile && (
                          <div className="text-xs text-orange-600 mt-1">⚠️ Fragile</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Summary Stats for Collected Packages */}
          {collectedPackages.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Total Collected Packages: <span className="font-semibold text-gray-800">{collectedPackages.length}</span>
                </span>
                <span className="text-gray-600">
                  Total Revenue: <span className="font-semibold text-gray-800">
                    {collectedPackages.reduce((sum, pkg) => sum + (pkg.price || 0), 0).toLocaleString()} RWF
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collection Modal */}
      {showCollectionModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800">Collect Package</h2>
              <button
                onClick={() => setShowCollectionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="font-semibold text-blue-900 mb-2">Package Details</div>
                <div className="text-sm space-y-1 text-blue-800">
                  <div>Tracking: {selectedPackage.trackingNumber}</div>
                  <div>Receiver: {selectedPackage.receiverNames}</div>
                  <div>Phone: {selectedPackage.receiverPhone}</div>
                  <div>Required ID: {selectedPackage.receiverIdNumber}</div>
                </div>
              </div>

              <form onSubmit={handleCollectPackage} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Receiver's National ID * (Must Match)
                  </label>
                  <input
                    type="text"
                    value={collectionData.receiverIdNumber}
                    onChange={(e) => setCollectionData({ 
                      ...collectionData, 
                      receiverIdNumber: e.target.value 
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234567890123456"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Verify the ID matches: {selectedPackage.receiverIdNumber}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Collected By (Full Name) *
                  </label>
                  <input
                    type="text"
                    value={collectionData.collectedByName}
                    onChange={(e) => setCollectionData({ 
                      ...collectionData, 
                      collectedByName: e.target.value 
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Important:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Verify receiver's National ID before handing over</li>
                        <li>ID number must match exactly</li>
                        <li>Sender will be notified automatically</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCollectionModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Confirm Collection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManagement;