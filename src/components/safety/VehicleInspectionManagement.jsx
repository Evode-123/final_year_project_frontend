import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Plus,
  FileText,
  Clock,
  Car,
  X
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const VehicleInspectionManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [dueSoon, setDueSoon] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    vehicleId: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionStatus: 'PASSED',
    certificateNumber: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, dashboardData, dueSoonData, overdueData] = await Promise.all([
        transportApiService.getAllVehicles(),
        transportApiService.getInspectionDashboard(),
        transportApiService.getVehiclesDueSoon(),
        transportApiService.getOverdueVehicles()
      ]);

      setVehicles(vehiclesData);
      setDashboard(dashboardData);
      setDueSoon(dueSoonData);
      setOverdue(overdueData);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await transportApiService.recordInspection(formData);
      setSuccess('Inspection recorded successfully!');
      setShowRecordForm(false);
      resetForm();
      await loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to record inspection: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectionStatus: 'PASSED',
      certificateNumber: '',
      notes: ''
    });
    setSelectedVehicle(null);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'OK':
        return 'bg-green-100 text-green-800';
      case 'DUE_SOON':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'OK':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'DUE_SOON':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'OVERDUE':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vehicle Inspections</h1>
          <p className="text-gray-600 mt-1">Government 6-month inspection tracking</p>
        </div>
        {/* Record Inspection Button */}
        <button
          onClick={() => setShowRecordForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Record Inspection
        </button>

      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Vehicles</span>
            <Car className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-800">
            {dashboard?.totalVehicles || 0}
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-700 text-sm font-semibold">Compliant</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-700">
            {dashboard?.inspectedVehicles || 0}
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-700 text-sm font-semibold">Due Soon</span>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-700">
            {dashboard?.dueSoonCount || 0}
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-700 text-sm font-semibold">Overdue</span>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-700">
            {dashboard?.overdueCount || 0}
          </div>
        </div>
      </div>

      {/* Record Inspection Form Modal */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowRecordForm(false);
            resetForm();
          }
        }}>
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-7 h-7" />
                    Record Government Inspection
                  </h2>
                  <p className="text-green-100 mt-1">6-month validity period will be calculated automatically</p>
                </div>
                <button
                  onClick={() => {
                    setShowRecordForm(false);
                    resetForm();
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="inspection-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Vehicle *
                    </label>
                    <select
                      value={formData.vehicleId}
                      onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          🚗 {vehicle.plateNo} - {vehicle.vehicleType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Inspection Date *
                    </label>
                    <input
                      type="date"
                      value={formData.inspectionDate}
                      onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Inspection Status *
                    </label>
                    <select
                      value={formData.inspectionStatus}
                      onChange={(e) => setFormData({ ...formData, inspectionStatus: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="PASSED">✅ PASSED</option>
                      <option value="FAILED">❌ FAILED</option>
                      <option value="PENDING">⏳ PENDING</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Certificate Number
                    </label>
                    <input
                      type="text"
                      value={formData.certificateNumber}
                      onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="GOV-2026-123456"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📝 Inspection Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows="4"
                    placeholder="Any findings or remarks from the inspection..."
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium">
                    ℹ️ <strong>Auto-Calculation:</strong> The next inspection due date will be automatically set to 6 months from the inspection date.
                  </p>
                </div>
              </form>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="bg-gray-50 border-t border-gray-200 p-6">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecordForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="inspection-form"
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl font-bold flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Record Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Vehicles */}
      {overdue.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-red-200">
          <div className="p-6 border-b border-red-200 bg-red-50">
            <h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
              <XCircle className="w-6 h-6" />
              Overdue Inspections ({overdue.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Last Inspection</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Was Due</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Days Overdue</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {overdue.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{inspection.vehiclePlateNo}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(inspection.inspectionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(inspection.nextInspectionDue).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-red-700 font-bold">
                        {Math.abs(inspection.daysUntilDue)} days
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(inspection.urgency)}`}>
                        {inspection.urgency}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Due Soon Vehicles */}
      {dueSoon.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-yellow-200">
          <div className="p-6 border-b border-yellow-200 bg-yellow-50">
            <h2 className="text-xl font-bold text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Due Soon (Next 30 Days) ({dueSoon.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Last Inspection</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Days Until Due</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dueSoon.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{inspection.vehiclePlateNo}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(inspection.inspectionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(inspection.nextInspectionDue).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-yellow-700 font-semibold">
                        {inspection.daysUntilDue} days
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {inspection.certificateNumber || 'N/A'}
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

export default VehicleInspectionManagement;