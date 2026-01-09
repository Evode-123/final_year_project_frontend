import React, { useState, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  X,
  Car,
  TrendingUp,
  Clock
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const VehicleInspectionHistory = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [inspectionHistory, setInspectionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const loadInspectionHistory = async (vehicleId) => {
    try {
      setLoading(true);
      setError('');
      const history = await transportApiService.getVehicleInspectionHistory(vehicleId);
      setInspectionHistory(history);
      
      // Find and set selected vehicle
      const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
      setSelectedVehicle(vehicle);
    } catch (err) {
      setError('Failed to load inspection history: ' + err.message);
      setInspectionHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASSED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PENDING':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const calculateStats = () => {
    if (!inspectionHistory.length) return null;

    const total = inspectionHistory.length;
    const passed = inspectionHistory.filter(i => i.inspectionStatus === 'PASSED').length;
    const failed = inspectionHistory.filter(i => i.inspectionStatus === 'FAILED').length;
    const pending = inspectionHistory.filter(i => i.inspectionStatus === 'PENDING').length;

    // Calculate average days between inspections
    const sortedHistory = [...inspectionHistory].sort(
      (a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate)
    );
    
    let totalDays = 0;
    for (let i = 0; i < sortedHistory.length - 1; i++) {
      const date1 = new Date(sortedHistory[i].inspectionDate);
      const date2 = new Date(sortedHistory[i + 1].inspectionDate);
      const diffDays = Math.floor((date1 - date2) / (1000 * 60 * 60 * 24));
      totalDays += diffDays;
    }
    const avgDays = sortedHistory.length > 1 ? Math.round(totalDays / (sortedHistory.length - 1)) : 0;

    return {
      total,
      passed,
      failed,
      pending,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      avgDays
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            Inspection History
          </h1>
          <p className="text-gray-600 mt-1">View complete inspection records by vehicle</p>
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

      {/* Vehicle Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select Vehicle to View History
        </label>
        <div className="flex items-center gap-4">
          <select
            onChange={(e) => {
              if (e.target.value) {
                loadInspectionHistory(e.target.value);
              } else {
                setSelectedVehicle(null);
                setInspectionHistory([]);
              }
            }}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          >
            <option value="">Choose a vehicle...</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plateNo} - {vehicle.vehicleType} ({vehicle.capacity} seats)
              </option>
            ))}
          </select>
          {selectedVehicle && (
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
              <Car className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">{selectedVehicle.plateNo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inspection history...</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {!loading && selectedVehicle && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Inspections</span>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 text-sm font-semibold">Passed</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-700">{stats.passed}</div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-700 text-sm font-semibold">Failed</span>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-700">{stats.failed}</div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-700 text-sm font-semibold">Pending</span>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-700 text-sm font-semibold">Pass Rate</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-700">{stats.passRate}%</div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg shadow-md border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-700 text-sm font-semibold">Avg Days</span>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-700">{stats.avgDays}</div>
            <div className="text-xs text-purple-600 mt-1">between checks</div>
          </div>
        </div>
      )}

      {/* Inspection History Table */}
      {!loading && selectedVehicle && inspectionHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">
              Inspection Records ({inspectionHistory.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete history for {selectedVehicle.plateNo}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Inspection Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Next Due</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Certificate</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Recorded By</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inspectionHistory
                  .sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))
                  .map((inspection, index) => (
                    <tr key={inspection.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {inspectionHistory.length - index}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-800">
                            {new Date(inspection.inspectionDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(inspection.nextInspectionDue).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(inspection.inspectionStatus)}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(inspection.inspectionStatus)}`}>
                            {inspection.inspectionStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {inspection.certificateNumber ? (
                          <span className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                            {inspection.certificateNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {inspection.recordedByEmail || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        {inspection.notes ? (
                          <span className="line-clamp-2">{inspection.notes}</span>
                        ) : (
                          <span className="text-gray-400 italic">No notes</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && selectedVehicle && inspectionHistory.length === 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Inspection History</h3>
          <p className="text-gray-600">
            No inspections have been recorded for {selectedVehicle.plateNo} yet.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Record the first inspection to start tracking compliance.
          </p>
        </div>
      )}

      {/* No Vehicle Selected */}
      {!loading && !selectedVehicle && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Vehicle</h3>
          <p className="text-gray-600">
            Choose a vehicle from the dropdown above to view its inspection history.
          </p>
        </div>
      )}
    </div>
  );
};

export default VehicleInspectionHistory;