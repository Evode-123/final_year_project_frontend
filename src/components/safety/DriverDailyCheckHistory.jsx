import React, { useState, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Car,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const DriverDailyCheckHistory = () => {
  const [vehicleData, setVehicleData] = useState(null);
  const [checkHistory, setCheckHistory] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState(null);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get vehicle info
      const vehicleResponse = await transportApiService.getDriverVehicleInfo();
      setVehicleData(vehicleResponse);

      if (vehicleResponse.hasVehicle) {
        // Get check history
        const history = await transportApiService.getDriverVehicleCheckHistory(days);
        setCheckHistory(history);
      }
    } catch (err) {
      setError(err.message || 'Failed to load check history');
    } finally {
      setLoading(false);
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

    return {
      total,
      good,
      hasIssues,
      urgent,
      withProblems,
      goodRate: total > 0 ? Math.round((good / total) * 100) : 0
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading check history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        <p className="font-semibold">Error loading check history</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!vehicleData?.hasVehicle) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
        <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Vehicle Assigned</h3>
        <p className="text-gray-600">
          You don't have a vehicle assigned to view check history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            My Daily Check History
          </h1>
          <p className="text-gray-600 mt-1">Your vehicle inspection records</p>
        </div>
      </div>

      {/* Vehicle Info & Date Range */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Car className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Your Vehicle</p>
              <p className="text-xl font-bold text-gray-800">{vehicleData.vehicle.plateNo}</p>
              <p className="text-sm text-gray-600">{vehicleData.vehicle.vehicleType}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

          <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
            <div className="text-sm text-blue-700 font-semibold mb-1">Good Rate</div>
            <div className="text-3xl font-bold text-blue-700">{stats.goodRate}%</div>
          </div>
        </div>
      )}

      {/* Check History Table */}
      {checkHistory.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">
              Check Records ({checkHistory.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Last {days} days for {vehicleData.vehicle.plateNo}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Date & Time</th>
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
                          <span className="text-red-600 font-semibold">Yes</span>
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
                          onClick={() => {
                            setSelectedCheck(check);
                            setShowDetailModal(true);
                          }}
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
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Check History</h3>
          <p className="text-gray-600">
            No daily checks have been recorded for your vehicle in the last {days} days.
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
                  <span className="text-sm text-gray-600">Location:</span>
                  <p className="font-semibold text-gray-800">{selectedCheck.checkLocation || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedCheck.overallStatus)}`}>
                    {selectedCheck.overallStatus}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Safe to Drive:</span>
                  <p className={selectedCheck.isSafeToDrive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {selectedCheck.isSafeToDrive ? "Yes" : "No"}
                  </p>
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

              {/* Problems */}
              {selectedCheck.hasProblems && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2">Problems Reported</h3>
                  <p className="text-gray-700 mb-2">{selectedCheck.problemsDescription}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-yellow-700">
                      Urgency: {selectedCheck.urgencyLevel}
                    </span>
                  </div>
                </div>
              )}

              {/* Driver Notes */}
              {selectedCheck.driverNotes && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Your Notes</h3>
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

export default DriverDailyCheckHistory;