import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const DriverVehicleInspectionView = () => {
  const [vehicleData, setVehicleData] = useState(null);
  const [inspectionHistory, setInspectionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get driver's vehicle inspection status
      const vehicleResponse = await transportApiService.getDriverVehicleInspectionStatus();
      setVehicleData(vehicleResponse);

      // If has vehicle, get inspection history
      if (vehicleResponse.hasVehicle && vehicleResponse.vehicle) {
        const history = await transportApiService.getDriverVehicleInspectionHistory();
        setInspectionHistory(history);
      }
    } catch (err) {
      setError(err.message || 'Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'OK':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'DUE_SOON':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'NEVER_INSPECTED':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'OK':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'DUE_SOON':
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      case 'OVERDUE':
        return <XCircle className="w-8 h-8 text-red-600" />;
      case 'NEVER_INSPECTED':
        return <AlertCircle className="w-8 h-8 text-gray-600" />;
      default:
        return <Clock className="w-8 h-8 text-gray-600" />;
    }
  };

  const getUrgencyMessage = (urgency, daysUntilDue) => {
    switch (urgency) {
      case 'OK':
        return `Your vehicle inspection is valid for ${daysUntilDue} more days.`;
      case 'DUE_SOON':
        return `⚠️ Your vehicle inspection is due in ${daysUntilDue} days. Please schedule an inspection soon.`;
      case 'OVERDUE':
        return `🚨 URGENT: Your vehicle inspection is ${Math.abs(daysUntilDue)} days overdue! This vehicle should not be in operation.`;
      case 'NEVER_INSPECTED':
        return '⚠️ This vehicle has never been inspected. Please contact management immediately.';
      default:
        return 'Status unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your vehicle status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        <p className="font-semibold">Error loading vehicle data</p>
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
          You don't have a vehicle assigned to you yet. Please contact your manager.
        </p>
      </div>
    );
  }

  const { vehicle, inspection } = vehicleData;

  return (
    <div className="space-y-6">
      {/* Vehicle Information Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Car className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Your Assigned Vehicle</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-gray-600">Plate Number</span>
            <p className="font-bold text-lg text-gray-800">{vehicle.plateNo}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Vehicle Type</span>
            <p className="font-semibold text-gray-800">{vehicle.vehicleType}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Capacity</span>
            <p className="font-semibold text-gray-800">{vehicle.capacity} seats</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Vehicle ID</span>
            <p className="font-semibold text-gray-800">#{vehicle.id}</p>
          </div>
        </div>
      </div>

      {/* Government Inspection Status */}
      {inspection ? (
        <div className={`rounded-lg shadow-md border-2 p-6 ${getUrgencyColor(inspection.urgency)}`}>
          <div className="flex items-start gap-4">
            {getUrgencyIcon(inspection.urgency)}
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Government Inspection Status</h2>
              <p className="text-base mb-4">
                {getUrgencyMessage(inspection.urgency, inspection.daysUntilDue)}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white bg-opacity-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-semibold">Last Inspection</span>
                  </div>
                  <p className="font-bold text-lg">
                    {new Date(inspection.inspectionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="bg-white bg-opacity-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-semibold">Next Due Date</span>
                  </div>
                  <p className="font-bold text-lg">
                    {new Date(inspection.nextInspectionDue).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="bg-white bg-opacity-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-semibold">Days {inspection.daysUntilDue >= 0 ? 'Remaining' : 'Overdue'}</span>
                  </div>
                  <p className="font-bold text-lg">
                    {Math.abs(inspection.daysUntilDue)} days
                  </p>
                </div>
              </div>

              {inspection.certificateNumber && (
                <div className="mt-4 bg-white bg-opacity-50 p-3 rounded-lg">
                  <span className="text-sm font-semibold">Certificate Number: </span>
                  <span className="font-mono font-bold">{inspection.certificateNumber}</span>
                </div>
              )}

              {inspection.inspectionStatus && (
                <div className="mt-2">
                  <span className="text-sm font-semibold">Status: </span>
                  <span className="font-bold">{inspection.inspectionStatus}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg shadow-md border border-gray-300 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Inspection Records</h3>
          <p className="text-gray-600">
            This vehicle has not been inspected yet. Please contact your manager.
          </p>
        </div>
      )}

      {/* Inspection History */}
      {inspectionHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">Inspection History</h2>
                <p className="text-sm text-gray-600">Past inspections for your vehicle</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Inspection Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Next Due</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inspectionHistory
                  .sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))
                  .map((record, index) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {inspectionHistory.length - index}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-800">
                            {new Date(record.inspectionDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(record.nextInspectionDue).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          record.inspectionStatus === 'PASSED' ? 'bg-green-100 text-green-800' :
                          record.inspectionStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.inspectionStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {record.certificateNumber ? (
                          <span className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                            {record.certificateNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverVehicleInspectionView;