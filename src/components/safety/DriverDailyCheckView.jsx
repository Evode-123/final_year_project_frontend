import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Car,
  Plus,
  AlertTriangle,
  X,
  MapPin,
  Fuel,
  Shield,
  Droplets,
  FileText,
  AlertCircle,
  Save,
  Eye,
  EyeOff
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

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await transportApiService.getDriverVehicleInfo();
      setVehicleData(response);
      if (response.latestCheck) setLatestCheck(response.latestCheck);
    } catch (err) {
      setError(err.message || 'Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  // ── Validators ─────────────────────────────────────────────────────────────
  const validators = {
    checkLocation: (v) => {
      if (!v) return 'Check location is required.';
      return '';
    },
    problemsDescription: (v) => {
      if (formData.hasProblems && !v.trim()) return 'Please describe the problems found.';
      if (v.length > 500) return 'Description cannot exceed 500 characters.';
      return '';
    },
    driverNotes: (v) => {
      if (v.length > 300) return 'Notes cannot exceed 300 characters.';
      return '';
    }
  };

  const validate = (field, value) => {
    const fn = validators[field];
    return fn ? fn(value) : '';
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const err = validate(field, value);
    setFormErrors(prev => ({ ...prev, [field]: err }));
  };

  // Hard-block notes at 300 chars
  const handleNotesChange = (e) => {
    const raw = e.target.value.slice(0, 300);
    handleChange('driverNotes', raw);
  };

  // Hard-block description at 500 chars
  const handleDescriptionChange = (e) => {
    const raw = e.target.value.slice(0, 500);
    handleChange('problemsDescription', raw);
  };

  const runAllValidations = () => {
    const errors = {};
    const fields = ['checkLocation', 'driverNotes'];
    if (formData.hasProblems) fields.push('problemsDescription');
    fields.forEach(f => {
      const err = validate(f, formData[f] ?? '');
      if (err) errors[f] = err;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!runAllValidations()) return;

    setSubmitting(true);
    try {
      if (!vehicleData?.vehicle?.id) throw new Error('No vehicle assigned');

      const submitData = {
        vehicleId: vehicleData.vehicle.id,
        driverId: 1, // TEMPORARY: Should be from user context
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
    setFormErrors({});
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'GOOD':     return 'bg-green-100 text-green-800 border-green-300';
      case 'HAS_ISSUES': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'URGENT':   return 'bg-red-100 text-red-800 border-red-300';
      default:         return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Reusable error message — matches DriversManagement
  const FieldError = ({ field }) => formErrors[field] ? (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {formErrors[field]}
    </p>
  ) : null;

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
      formErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  // Compact toggle checkbox — same visual style as DriversManagement checkboxes
  const CheckItem = ({ field, label, inverted = false }) => {
    const checked = inverted ? !formData[field] : formData[field];
    return (
      <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            [field]: inverted ? !e.target.checked : e.target.checked
          }))}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs font-medium text-gray-700">{label}</span>
      </label>
    );
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
        <p className="text-gray-600">You don't have a vehicle assigned. Please contact your manager.</p>
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

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Daily Vehicle Check</h2>
          <p className="text-gray-600 mt-1">Submit your daily pre-trip inspection</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

      {/* ── MODAL ── compact style matching DriversManagement ─────────────── */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); resetForm(); } }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

            {/* Sticky Header — identical pattern to DriversManagement */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-800">Submit Daily Vehicle Check</h2>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="daily-check-form" onSubmit={handleSubmit} className="p-5 space-y-5">

              {/* Vehicle Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
                <Car className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Your Vehicle</p>
                  <p className="text-base font-bold text-blue-900 leading-tight">
                    {vehicleData.vehicle.plateNo}
                    <span className="text-sm font-normal text-blue-700 ml-2">{vehicleData.vehicle.vehicleType}</span>
                  </p>
                </div>
              </div>

              {/* Check Location */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Check Location
                </p>
                <select
                  value={formData.checkLocation}
                  onChange={(e) => handleChange('checkLocation', e.target.value)}
                  className={inputClass('checkLocation')}
                  required
                >
                  <option value="WASH_GARAGE">Wash Garage</option>
                  <option value="BEFORE_TRIP">Before Trip</option>
                  <option value="DEPOT">Depot</option>
                </select>
                <FieldError field="checkLocation" />
              </div>

              {/* Visual Checks */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Visual Checks
                </p>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                  <div className="grid grid-cols-2 gap-1">
                    <CheckItem field="tiresOk"      label="🚗 Tires OK" />
                    <CheckItem field="lightsOk"     label="💡 Lights OK" />
                    <CheckItem field="brakesOk"     label="🛑 Brakes OK" />
                    <CheckItem field="mirrorsOk"    label="🪞 Mirrors OK" />
                    <CheckItem field="windshieldOk" label="🪟 Windshield OK" />
                    <CheckItem field="wipersOk"     label="🌧️ Wipers OK" />
                    <CheckItem field="cleanlinessOk" label="✨ Clean" />
                    <CheckItem field="bodyDamage"   label="⚠️ Body Damage" inverted />
                  </div>
                </div>
              </div>

              {/* Safety Equipment */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Safety Equipment
                </p>
                <div className="bg-orange-50 rounded-lg border border-orange-200 p-3">
                  <div className="grid grid-cols-1 gap-1">
                    <CheckItem field="fireExtinguisher" label="🧯 Fire Extinguisher present" />
                    <CheckItem field="firstAidKit"      label="🩹 First Aid Kit present" />
                    <CheckItem field="warningTriangle"  label="⚠️ Warning Triangle present" />
                  </div>
                </div>
              </div>

              {/* Fluids & Fuel */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" /> Fluids & Fuel
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 col-span-2 sm:col-span-1">
                    <div className="space-y-1">
                      <CheckItem field="oilLevelOk"     label="🛢️ Oil Level OK" />
                      <CheckItem field="coolantLevelOk" label="🌡️ Coolant Level OK" />
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fuel Level</label>
                    <select
                      value={formData.fuelLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, fuelLevel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="FULL">⛽ Full</option>
                      <option value="HALF">⛽ Half</option>
                      <option value="LOW">⛽ Low</option>
                      <option value="EMPTY">⛽ Empty</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Report Problems */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Problems
                </p>
                <div className={`rounded-lg border p-3 ${formData.hasProblems ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={formData.hasProblems}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, hasProblems: e.target.checked, problemsDescription: '' }));
                        setFormErrors(prev => ({ ...prev, problemsDescription: '' }));
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm font-semibold text-gray-800">Report a problem</span>
                  </label>

                  {formData.hasProblems && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Problem Description *
                        </label>
                        <textarea
                          value={formData.problemsDescription}
                          onChange={handleDescriptionChange}
                          className={`${inputClass('problemsDescription')} resize-none`}
                          rows="3"
                          placeholder="Describe the problems in detail..."
                          maxLength={500}
                        />
                        <div className="flex items-center justify-between">
                          <FieldError field="problemsDescription" />
                          <span className={`text-xs ml-auto ${formData.problemsDescription.length >= 500 ? 'text-red-500' : 'text-gray-400'}`}>
                            {formData.problemsDescription.length}/500
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Safe to Drive?</label>
                          <div className="flex gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                checked={formData.isSafeToDrive === true}
                                onChange={() => setFormData(prev => ({ ...prev, isSafeToDrive: true }))}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-sm font-medium text-gray-700">Yes</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                checked={formData.isSafeToDrive === false}
                                onChange={() => setFormData(prev => ({ ...prev, isSafeToDrive: false }))}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-sm font-medium text-gray-700">No</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Urgency Level</label>
                          <select
                            value={formData.urgencyLevel}
                            onChange={(e) => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
              </div>

              {/* Driver Notes */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Additional Notes
                </p>
                <textarea
                  value={formData.driverNotes}
                  onChange={handleNotesChange}
                  className={`${inputClass('driverNotes')} resize-none`}
                  rows="3"
                  placeholder="Any additional observations..."
                  maxLength={300}
                />
                <div className="flex items-center justify-between">
                  <FieldError field="driverNotes" />
                  <span className={`text-xs ml-auto ${formData.driverNotes.length >= 300 ? 'text-red-500' : 'text-gray-400'}`}>
                    {formData.driverNotes.length}/300
                  </span>
                </div>
              </div>

              {/* Actions — same pattern as DriversManagement */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Check
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDailyCheckView;