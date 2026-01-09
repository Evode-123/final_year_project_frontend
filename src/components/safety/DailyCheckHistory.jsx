import React, { useState, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  X,
  Car,
  User,
  Eye,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const DailyCheckHistory = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [checkHistory, setCheckHistory] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await transportApiService.getAllVehicles();
      setVehicles(data);
    } catch (err) {
      setError('Failed to load vehicles: ' + err.message);
    }
  };

  const loadCheckHistory = async (vehicleId, numDays) => {
    try {
      setLoading(true);
      setError('');
      const history = await transportApiService.getVehicleCheckHistory(vehicleId, numDays);
      setCheckHistory(history);
      
      const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
      setSelectedVehicle(vehicle);
    } catch (err) {
      setError('Failed to load check history: ' + err.message);
      setCheckHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = (vehicleId) => {
    if (vehicleId) {
      loadCheckHistory(vehicleId, days);
    } else {
      setSelectedVehicle(null);
      setCheckHistory([]);
    }
  };

  const handleDaysChange = (newDays) => {
    setDays(newDays);
    if (selectedVehicle) {
      loadCheckHistory(selectedVehicle.id, newDays);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'GOOD':
        return 'bg-green-100 text-green-800';
      case 'HAS_ISSUES':
        return 'bg-yellow-100 text-yellow-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'GOOD':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'HAS_ISSUES':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'URGENT':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const calculateStats = () => {
    if (!checkHistory.length) return null;

    const total = checkHistory.length;
    const good = checkHistory.filter(c => c.overallStatus === 'GOOD').length;
    const hasIssues = checkHistory.filter(c => c.overallStatus === 'HAS_ISSUES').length;
    const urgent = checkHistory.filter(c => c.overallStatus === 'URGENT').length;
    const withProblems = checkHistory.filter(c => c.hasProblems).length;
    const reviewed = checkHistory.filter(c => c.reviewedAt).length;

    return {
      total,
      good,
      hasIssues,
      urgent,
      withProblems,
      reviewed,
      goodRate: total > 0 ? Math.round((good / total) * 100) : 0,
      reviewRate: total > 0 ? Math.round((reviewed / total) * 100) : 0
    };
  };

  const stats = calculateStats();

  const openDetailModal = (check) => {
    setSelectedCheck(check);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            Daily Check History
          </h1>
          <p className="text-gray-600 mt-1">View complete daily check records by vehicle</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Vehicle Selection & Date Range */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Vehicle
            </label>
            <select
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            >
              <option value="">Choose a vehicle...</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plateNo} - {vehicle.vehicleType}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Time Period
            </label>
            <select
              value={days}
              onChange={(e) => handleDaysChange(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              disabled={!selectedVehicle}
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
        </div>

        {selectedVehicle && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
            <Car className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800">{selectedVehicle.plateNo}</span>
            <span className="text-blue-600">•</span>
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">Last {days} days</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading check history...</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {!loading && selectedVehicle && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
            <div className="text-sm text-green-700 font-semibold mb-1">Good</div>
            <div className="text-3xl font-bold text-green-700">{stats.good}</div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
            <div className="text-sm text-yellow-700 font-semibold mb-1">Issues</div>
            <div className="text-3xl font-bold text-yellow-700">{stats.hasIssues}</div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
            <div className="text-sm text-red-700 font-semibold mb-1">Urgent</div>
            <div className="text-3xl font-bold text-red-700">{stats.urgent}</div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg shadow-md border border-orange-200">
            <div className="text-sm text-orange-700 font-semibold mb-1">Problems</div>
            <div className="text-3xl font-bold text-orange-700">{stats.withProblems}</div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg shadow-md border border-purple-200">
            <div className="text-sm text-purple-700 font-semibold mb-1">Reviewed</div>
            <div className="text-3xl font-bold text-purple-700">{stats.reviewed}</div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
            <div className="text-sm text-blue-700 font-semibold mb-1">Good Rate</div>
            <div className="text-3xl font-bold text-blue-700">{stats.goodRate}%</div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-lg shadow-md border border-indigo-200">
            <div className="text-sm text-indigo-700 font-semibold mb-1">Review Rate</div>
            <div className="text-3xl font-bold text-indigo-700">{stats.reviewRate}%</div>
          </div>
        </div>
      )}

      {/* Check History Table */}
      {!loading && selectedVehicle && checkHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">
              Check Records ({checkHistory.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Last {days} days for {selectedVehicle.plateNo}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Driver</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Problems</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Safe to Drive</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Reviewed</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {checkHistory
                  .sort((a, b) => new Date(b.checkDate) - new Date(a.checkDate))
                  .map((check) => (
                    <tr key={check.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-800">
                              {new Date(check.checkDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(check.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-800">{check.driverName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {check.checkLocation || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(check.overallStatus)}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(check.overallStatus)}`}>
                            {check.overallStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {check.hasProblems ? (
                          <div>
                            <span className="text-red-600 font-semibold">Yes</span>
                            {check.urgencyLevel && (
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                check.urgencyLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                check.urgencyLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                check.urgencyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {check.urgencyLevel}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-green-600">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={check.isSafeToDrive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                          {check.isSafeToDrive ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {check.reviewedAt ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openDetailModal(check)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && selectedVehicle && checkHistory.length === 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Check History</h3>
          <p className="text-gray-600">
            No daily checks have been recorded for {selectedVehicle.plateNo} in the last {days} days.
          </p>
        </div>
      )}

      {/* No Vehicle Selected */}
      {!loading && !selectedVehicle && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Vehicle</h3>
          <p className="text-gray-600">
            Choose a vehicle from the dropdown above to view its daily check history.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Check Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(selectedCheck.checkDate).toLocaleDateString()} at{' '}
                {new Date(selectedCheck.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Vehicle:</span>
                  <p className="font-semibold text-gray-800">{selectedCheck.vehiclePlateNo}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Driver:</span>
                  <p className="font-semibold text-gray-800">{selectedCheck.driverName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Location:</span>
                  <p className="font-semibold text-gray-800">{selectedCheck.checkLocation || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedCheck.overallStatus)}`}>
                    {selectedCheck.overallStatus}
                  </span>
                </div>
              </div>

              {/* Check Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Check Items</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'tiresOk', label: 'Tires' },
                    { key: 'lightsOk', label: 'Lights' },
                    { key: 'brakesOk', label: 'Brakes' },
                    { key: 'mirrorsOk', label: 'Mirrors' },
                    { key: 'windshieldOk', label: 'Windshield' },
                    { key: 'wipersOk', label: 'Wipers' },
                    { key: 'cleanlinessOk', label: 'Clean' },
                    { key: 'fireExtinguisher', label: 'Fire Ext.' },
                    { key: 'firstAidKit', label: 'First Aid' },
                    { key: 'warningTriangle', label: 'Triangle' },
                    { key: 'oilLevelOk', label: 'Oil Level' },
                    { key: 'coolantLevelOk', label: 'Coolant' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      {selectedCheck[key] ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mileage & Fuel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Mileage:</span>
                  <p className="font-semibold text-gray-800">
                    {selectedCheck.currentMileage ? `${selectedCheck.currentMileage} km` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Fuel Level:</span>
                  <p className="font-semibold text-gray-800">{selectedCheck.fuelLevel || 'N/A'}</p>
                </div>
              </div>

              {/* Problems */}
              {selectedCheck.hasProblems && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2">Problems Reported</h3>
                  <p className="text-gray-700 mb-2">{selectedCheck.problemsDescription}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={selectedCheck.isSafeToDrive ? "text-green-700" : "text-red-700"}>
                      Safe to Drive: {selectedCheck.isSafeToDrive ? "Yes" : "No"}
                    </span>
                    <span className="text-yellow-700">
                      Urgency: {selectedCheck.urgencyLevel}
                    </span>
                  </div>
                </div>
              )}

              {/* Driver Notes */}
              {selectedCheck.driverNotes && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Driver Notes</h3>
                  <p className="text-gray-700">{selectedCheck.driverNotes}</p>
                </div>
              )}

              {/* Manager Review */}
              {selectedCheck.reviewedAt && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">Manager Review</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-blue-700">Reviewed by:</span>
                      <span className="ml-2 text-gray-800">{selectedCheck.reviewedByEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Review date:</span>
                      <span className="ml-2 text-gray-800">
                        {new Date(selectedCheck.reviewedAt).toLocaleString()}
                      </span>
                    </div>
                    {selectedCheck.managerNotes && (
                      <div>
                        <span className="text-blue-700">Notes:</span>
                        <p className="mt-1 text-gray-700">{selectedCheck.managerNotes}</p>
                      </div>
                    )}
                    {selectedCheck.actionTaken && (
                      <div>
                        <span className="text-blue-700">Action Taken:</span>
                        <p className="mt-1 text-gray-700">{selectedCheck.actionTaken}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyCheckHistory;