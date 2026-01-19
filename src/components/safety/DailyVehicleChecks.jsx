import React, { useState, useEffect } from 'react';
import { 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Car,
  User,
  Clock,
  Plus,
  Eye,
  X
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const DailyVehicleChecks = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [todaysChecks, setTodaysChecks] = useState([]);
  const [problemChecks, setProblemChecks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    checkDate: new Date().toISOString().split('T')[0],
    checkLocation: 'WASH_GARAGE',
    tiresOk: true,
    lightsOk: true,
    brakesOk: true,
    mirrorsOk: true,
    windshieldOk: true,
    wipersOk: true,
    bodyDamage: false,
    cleanlinessOk: true,
    fireExtinguisher: true,
    firstAidKit: true,
    warningTriangle: true,
    oilLevelOk: true,
    coolantLevelOk: true,
    fuelLevel: 'FULL',
    hasProblems: false,
    problemsDescription: '',
    isSafeToDrive: true,
    urgencyLevel: 'LOW',
    driverNotes: ''
  });

  const [reviewData, setReviewData] = useState({
    managerNotes: '',
    actionTaken: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, driversData, todaysData, problemsData, dashboardData] = await Promise.all([
        transportApiService.getAllVehicles(),
        transportApiService.getAllDrivers(),
        transportApiService.getTodaysChecks(),
        transportApiService.getChecksWithProblems(),
        transportApiService.getDailyChecksDashboard()
      ]);

      setVehicles(vehiclesData);
      setDrivers(driversData);
      setTodaysChecks(todaysData);
      setProblemChecks(problemsData);
      setDashboard(dashboardData);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleReview = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await transportApiService.reviewCheck(selectedCheck.id, reviewData);
      setSuccess('Check reviewed successfully!');
      setShowReviewModal(false);
      setSelectedCheck(null);
      setReviewData({ managerNotes: '', actionTaken: '' });
      await loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to review check: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      driverId: '',
      checkDate: new Date().toISOString().split('T')[0],
      checkLocation: 'WASH_GARAGE',
      tiresOk: true,
      lightsOk: true,
      brakesOk: true,
      mirrorsOk: true,
      windshieldOk: true,
      wipersOk: true,
      bodyDamage: false,
      cleanlinessOk: true,
      fireExtinguisher: true,
      firstAidKit: true,
      warningTriangle: true,
      oilLevelOk: true,
      coolantLevelOk: true,
      fuelLevel: 'FULL',
      hasProblems: false,
      problemsDescription: '',
      isSafeToDrive: true,
      urgencyLevel: 'LOW',
      driverNotes: ''
    });
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
          <h1 className="text-3xl font-bold text-gray-800">Daily Vehicle Checks</h1>
          <p className="text-gray-600 mt-1">Wash garage routine inspections</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-5 h-5" /></button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Today's Checks</span>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-800">
            {dashboard?.totalChecksToday || 0}
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-700 text-sm font-semibold">All Good</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-700">
            {dashboard?.goodChecks || 0}
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-700 text-sm font-semibold">Has Issues</span>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-700">
            {dashboard?.checksWithIssues || 0}
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-700 text-sm font-semibold">Urgent</span>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-700">
            {dashboard?.urgentChecks || 0}
          </div>
        </div>
      </div>

      {/* Today's Checks */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Today's Checks ({todaysChecks.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Problems</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {todaysChecks.map((check) => (
                <tr key={check.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {check.vehiclePlateNo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {check.driverName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(check.createdAt).toLocaleTimeString()}
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
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedCheck(check);
                        setShowReviewModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
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

      {/* Review Modal */}
      {showReviewModal && selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Check Details & Review</h2>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedCheck(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Vehicle:</span>
                  <p className="font-semibold">{selectedCheck.vehiclePlateNo}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Driver:</span>
                  <p className="font-semibold">{selectedCheck.driverName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedCheck.overallStatus)}`}>
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

              {selectedCheck.hasProblems && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="font-semibold text-yellow-800 mb-2">Problems Reported:</p>
                  <p className="text-gray-700">{selectedCheck.problemsDescription}</p>
                  <p className="text-sm text-yellow-700 mt-2">Urgency: {selectedCheck.urgencyLevel}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Manager Notes
                </label>
                <textarea
                  value={reviewData.managerNotes}
                  onChange={(e) => setReviewData({ ...reviewData, managerNotes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                  placeholder="Your review notes..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Action Taken
                </label>
                <textarea
                  value={reviewData.actionTaken}
                  onChange={(e) => setReviewData({ ...reviewData, actionTaken: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="2"
                  placeholder="What action was taken..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedCheck(null);
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyVehicleChecks;