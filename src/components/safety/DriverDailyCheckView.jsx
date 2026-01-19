import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Car, 
  Plus,
  AlertTriangle,
  X
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const DriverDailyCheckView = () => {
  const [vehicleData, setVehicleData] = useState(null);
  const [latestCheck, setLatestCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await transportApiService.getDriverVehicleInfo();
      setVehicleData(response);
      
      if (response.latestCheck) {
        setLatestCheck(response.latestCheck);
      }
    } catch (err) {
      setError(err.message || 'Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!vehicleData?.vehicle?.id) {
        throw new Error('No vehicle assigned');
      }

      // Note: Backend will automatically identify the driver from JWT token
      // For now, we'll use a placeholder that should be replaced with actual driver ID
      // You need to either: 1) Get driverId from user context, or 2) Backend auto-fills it
      const submitData = {
        vehicleId: vehicleData.vehicle.id,
        driverId: 1, // TEMPORARY: Should be fetched from user context or backend should auto-fill
        checkDate: new Date().toISOString().split('T')[0],
        ...formData
      };

      await transportApiService.submitDailyCheck(submitData);
      setSuccess('✅ Daily check submitted successfully!');
      setShowForm(false);
      resetForm();
      await loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to submit daily check');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
        return 'bg-green-100 text-green-800 border-green-300';
      case 'HAS_ISSUES':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!vehicleData?.hasVehicle) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
        <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Vehicle Assigned</h3>
        <p className="text-gray-600">
          You don't have a vehicle assigned. Please contact your manager.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Header with Submit Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Daily Vehicle Check</h2>
          <p className="text-gray-600 mt-1">Submit your daily pre-trip inspection</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Submit Daily Check
        </button>
      </div>

      {/* Latest Check Status */}
      {latestCheck && (
        <div className={`rounded-lg shadow-md border-2 p-6 ${getStatusColor(latestCheck.overallStatus)}`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold mb-2">Latest Check Status</h3>
              <p className="text-sm mb-3">
                Checked on {new Date(latestCheck.checkDate).toLocaleDateString()} at{' '}
                {new Date(latestCheck.createdAt).toLocaleTimeString()}
              </p>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Status: {latestCheck.overallStatus}</span>
              </div>
              {latestCheck.hasProblems && (
                <div className="mt-3 bg-white bg-opacity-50 p-3 rounded">
                  <p className="font-semibold text-sm">⚠️ Problems Reported:</p>
                  <p className="text-sm mt-1">{latestCheck.problemsDescription}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowForm(false);
            resetForm();
          }
        }}>
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header - Sticky */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CheckCircle className="w-7 h-7" />
                    Submit Daily Vehicle Check
                  </h2>
                  <p className="text-blue-100 mt-1">Complete all checks before starting your trip</p>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
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
              <form id="daily-check-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Vehicle Info */}
                <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Car className="w-6 h-6 text-blue-600" />
                    <span className="font-bold text-blue-900 text-lg">Your Vehicle</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{vehicleData.vehicle.plateNo}</p>
                  <p className="text-blue-700">{vehicleData.vehicle.vehicleType}</p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Check Location *
                  </label>
                  <select
                    value={formData.checkLocation}
                    onChange={(e) => setFormData({ ...formData, checkLocation: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  >
                    <option value="WASH_GARAGE">🚿 Wash Garage</option>
                    <option value="BEFORE_TRIP">🚗 Before Trip</option>
                    <option value="DEPOT">🏢 Depot</option>
                  </select>
                </div>

                {/* Quick Checks */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Quick Visual Checks
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'tiresOk', label: '🚗 Tires OK' },
                      { key: 'lightsOk', label: '💡 Lights OK' },
                      { key: 'brakesOk', label: '🛑 Brakes OK' },
                      { key: 'mirrorsOk', label: '🪞 Mirrors OK' },
                      { key: 'windshieldOk', label: '🪟 Windshield OK' },
                      { key: 'wipersOk', label: '🌧️ Wipers OK' },
                      { key: 'cleanlinessOk', label: '✨ Clean' },
                      { key: 'bodyDamage', label: '⚠️ Body Damage', inverted: true }
                    ].map(({ key, label, inverted }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-white border border-transparent hover:border-gray-300 transition-all">
                        <input
                          type="checkbox"
                          checked={inverted ? !formData[key] : formData[key]}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            [key]: inverted ? !e.target.checked : e.target.checked 
                          })}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Safety Equipment */}
                <div className="bg-orange-50 p-5 rounded-lg border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Safety Equipment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'fireExtinguisher', label: '🧯 Fire Extinguisher' },
                      { key: 'firstAidKit', label: '🩹 First Aid Kit' },
                      { key: 'warningTriangle', label: '⚠️ Warning Triangle' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-white border border-transparent hover:border-orange-300 transition-all">
                        <input
                          type="checkbox"
                          checked={formData[key]}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fluids */}
                <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">💧 Fluids & Fuel</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-white border border-transparent hover:border-green-300">
                      <input
                        type="checkbox"
                        checked={formData.oilLevelOk}
                        onChange={(e) => setFormData({ ...formData, oilLevelOk: e.target.checked })}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-sm font-medium">🛢️ Oil Level OK</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-white border border-transparent hover:border-green-300">
                      <input
                        type="checkbox"
                        checked={formData.coolantLevelOk}
                        onChange={(e) => setFormData({ ...formData, coolantLevelOk: e.target.checked })}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-sm font-medium">🌡️ Coolant OK</span>
                    </label>

                    <div>
                      <select
                        value={formData.fuelLevel}
                        onChange={(e) => setFormData({ ...formData, fuelLevel: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="FULL">⛽ Fuel: Full</option>
                        <option value="HALF">⛽ Fuel: Half</option>
                        <option value="LOW">⛽ Fuel: Low</option>
                        <option value="EMPTY">⛽ Fuel: Empty</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Problems */}
                <div className="bg-yellow-50 p-5 rounded-lg border-2 border-yellow-300">
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasProblems}
                      onChange={(e) => setFormData({ ...formData, hasProblems: e.target.checked })}
                      className="w-6 h-6 text-blue-600"
                    />
                    <span className="text-lg font-bold text-gray-800">⚠️ Report Problems</span>
                  </label>

                  {formData.hasProblems && (
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-yellow-300">
                      <textarea
                        value={formData.problemsDescription}
                        onChange={(e) => setFormData({ ...formData, problemsDescription: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Describe the problems in detail..."
                        required={formData.hasProblems}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold mb-2 text-gray-700">Safe to Drive?</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={formData.isSafeToDrive === true}
                                onChange={() => setFormData({ ...formData, isSafeToDrive: true })}
                                className="w-4 h-4"
                              />
                              <span className="font-medium">✅ Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={formData.isSafeToDrive === false}
                                onChange={() => setFormData({ ...formData, isSafeToDrive: false })}
                                className="w-4 h-4"
                              />
                              <span className="font-medium">❌ No</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold mb-2 text-gray-700">Urgency Level</label>
                          <select
                            value={formData.urgencyLevel}
                            onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="LOW">🟢 Low</option>
                            <option value="MEDIUM">🟡 Medium</option>
                            <option value="HIGH">🟠 High</option>
                            <option value="CRITICAL">🔴 Critical</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Driver Notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📝 Additional Notes
                  </label>
                  <textarea
                    value={formData.driverNotes}
                    onChange={(e) => setFormData({ ...formData, driverNotes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Any additional observations..."
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="bg-gray-50 border-t border-gray-200 p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-600 font-medium">
                  ✓ Please ensure all checks are accurate before submitting
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="daily-check-form"
                    disabled={submitting}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl font-bold flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Submit Check
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDailyCheckView;