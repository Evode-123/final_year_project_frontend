import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, User, Car, Phone, CreditCard, Calendar, MapPin, AlertCircle, Mail } from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const DRIVER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  BACKUP: 'BACKUP'
};

const DriversManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    names: '',
    phoneNumber: '',
    email: '',
    licenseNo: '',
    idNumber: '',
    licenseExpiryDate: '',
    address: '',
    status: DRIVER_STATUS.ACTIVE,
    isBackup: false,
    hiredDate: new Date().toISOString().split('T')[0],
    assignVehicle: false,
    assignedVehicleId: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [driversData, vehiclesData] = await Promise.all([
        transportApiService.getAllDrivers(),
        transportApiService.getAllVehicles()
      ]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Validators ──────────────────────────────────────────────
  const validators = {
    names: (v) => {
      if (!v.trim()) return 'Full name is required.';
      if (v.trim().length < 3) return 'Name must be at least 3 characters.';
      if (v.length > 70) return 'Full name cannot exceed 70 characters.';
      if (!/^[a-zA-Z\s'-]+$/.test(v)) return 'Name can only contain letters, spaces, hyphens, or apostrophes.';
      if (!v.trim().includes(' ')) return 'Please enter both first and last name.';
      const words = v.trim().split(/\s+/);
      if (words.some(w => w.length > 20)) return 'Each part of the name cannot exceed 20 characters.';
      return '';
    },
    phoneNumber: (v) => {
      if (!v.trim()) return 'Phone number is required.';
      if (!/^\d+$/.test(v)) return 'Phone must contain digits only.';
      if (v.length !== 10) return 'Phone number must be exactly 10 digits.';
      if (!v.startsWith('07')) return 'Phone number must start with 07.';
      return '';
    },
    email: (v) => {
      if (!v.trim()) return ''; // optional
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
      return '';
    },
    licenseNo: (v) => {
      if (!v.trim()) return 'License number is required.';
      if (!/^\d+$/.test(v)) return 'License number must contain digits only.';
      if (v.length !== 16) return 'License number must be exactly 16 digits.';
      return '';
    },
    idNumber: (v) => {
      if (!v.trim()) return ''; // optional
      if (!/^\d+$/.test(v)) return 'ID number must contain digits only.';
      if (v.length !== 16) return 'ID number must be exactly 16 digits.';
      return '';
    },
    licenseExpiryDate: (v) => {
      if (!v) return ''; // optional
      if (new Date(v) <= new Date()) return 'Expiry date must be in the future.';
      return '';
    },
    address: (v) => {
      if (v.length > 50) return 'Address cannot exceed 50 characters.';
      const words = v.trim().split(/\s+/);
      if (words.some(w => w.length > 20)) return 'Each word in the address cannot exceed 20 characters.';
      return '';
    },
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

  // Name: letters/spaces/hyphens/apostrophes only, max 70 total, max 20 per word
  const handleNamesChange = (e) => {
    const raw = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
    if (raw.length > 70) return;
    const words = raw.trim().split(/\s+/);
    if (words.some(w => w.length > 20)) return;
    handleChange('names', raw);
  };

  // Phone: digits only, max 10, must start with 07
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    // Only allow if it starts with 07 or is still being typed (less than 2 chars)
    if (raw.length >= 2 && !raw.startsWith('07')) return;
    handleChange('phoneNumber', raw);
  };

  // ID: digits only, exactly 16
  const handleIdChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    handleChange('idNumber', raw);
  };

  // License: digits only, exactly 16
  const handleLicenseChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    handleChange('licenseNo', raw);
  };

  // Address: max 50 total chars, no single word > 20 chars (hard block while typing)
  const handleAddressChange = (e) => {
    const raw = e.target.value;
    // Hard block: find the longest word — if it exceeds 20, reject the entire new input
    const words = raw.trim().split(/\s+/);
    if (words.some(w => w.length > 20)) return;
    // Hard block: total chars capped at 50
    if (raw.length > 50) return;
    setFormData(prev => ({ ...prev, address: raw }));
    setFormErrors(prev => ({ ...prev, address: '' }));
  };

  const runAllValidations = () => {
    const fields = ['names', 'phoneNumber', 'email', 'licenseNo', 'idNumber', 'licenseExpiryDate', 'address'];
    const errors = {};
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

    try {
      const driverData = {
        names: formData.names,
        phoneNumber: formData.phoneNumber,
        email: formData.email || null,
        licenseNo: formData.licenseNo,
        idNumber: formData.idNumber || null,
        licenseExpiryDate: formData.licenseExpiryDate || null,
        address: formData.address || null,
        status: formData.status,
        isBackup: formData.isBackup,
        hiredDate: formData.hiredDate
      };

      let savedDriver;
      if (editingDriver) {
        savedDriver = await transportApiService.updateDriver(editingDriver.id, driverData);
        setSuccess('Driver updated successfully!');
      } else {
        savedDriver = await transportApiService.createDriver(driverData);
        setSuccess(formData.email?.trim()
          ? 'Driver created! Login credentials sent to their email.'
          : 'Driver created! (No email — user account not created)');
      }

      if (formData.assignVehicle && formData.assignedVehicleId && !formData.isBackup) {
        try {
          await transportApiService.assignDriverToVehicle(savedDriver.id, parseInt(formData.assignedVehicleId));
          setSuccess(prev => prev + ' Vehicle assigned successfully!');
        } catch (err) {
          setError('Driver saved but vehicle assignment failed: ' + err.message);
        }
      } else if (editingDriver && editingDriver.assignedVehicleId && !formData.assignVehicle) {
        try {
          await transportApiService.unassignDriver(editingDriver.id);
        } catch (err) {
          console.error('Failed to unassign driver:', err);
        }
      }

      await loadData();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError('Failed to save driver: ' + err.message);
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      names: driver.names,
      phoneNumber: driver.phoneNumber,
      email: driver.email || '',
      licenseNo: driver.licenseNo,
      idNumber: driver.idNumber || '',
      licenseExpiryDate: driver.licenseExpiryDate || '',
      address: driver.address || '',
      status: driver.status,
      isBackup: driver.isBackup || false,
      hiredDate: driver.hiredDate || new Date().toISOString().split('T')[0],
      assignVehicle: !!driver.assignedVehicleId,
      assignedVehicleId: driver.assignedVehicleId || ''
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      await transportApiService.deleteDriver(id);
      setSuccess('Driver deleted successfully!');
      loadData();
    } catch (err) {
      setError('Failed to delete driver: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      names: '',
      phoneNumber: '',
      email: '',
      licenseNo: '',
      idNumber: '',
      licenseExpiryDate: '',
      address: '',
      status: DRIVER_STATUS.ACTIVE,
      isBackup: false,
      hiredDate: new Date().toISOString().split('T')[0],
      assignVehicle: false,
      assignedVehicleId: ''
    });
    setFormErrors({});
    setEditingDriver(null);
  };

  const getAvailableVehicles = () => {
    return vehicles.filter(vehicle => {
      if (vehicle.status !== 'AVAILABLE' || !vehicle.isActive) return false;
      if (editingDriver && vehicle.id === editingDriver.assignedVehicleId) return true;
      return !drivers.some(driver =>
        driver.id !== editingDriver?.id &&
        driver.assignedVehicleId === vehicle.id
      );
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case DRIVER_STATUS.ACTIVE: return 'bg-green-100 text-green-800';
      case DRIVER_STATUS.ON_LEAVE: return 'bg-yellow-100 text-yellow-800';
      case DRIVER_STATUS.INACTIVE: return 'bg-gray-100 text-gray-800';
      case DRIVER_STATUS.BACKUP: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Reusable error message
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

  const inputWithIconClass = (field) =>
    `w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
      formErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Drivers Management</h1>
          <p className="text-gray-600 mt-1">Manage drivers and their vehicle assignments</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Driver
        </button>
      </div>

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

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">

              {/* Personal Info */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Personal Information
                </p>
                <div className="grid grid-cols-2 gap-3">

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Names *</label>
                    <input
                      type="text"
                      value={formData.names}
                      onChange={handleNamesChange}
                      className={inputClass('names')}
                      placeholder="John Doe"
                      maxLength={70}
                    />
                    <div className="flex items-center justify-between mt-0.5">
                      <FieldError field="names" />
                      <span className={`text-xs ml-auto ${formData.names.length >= 70 ? 'text-red-500' : 'text-gray-400'}`}>
                        {formData.names.length}/70
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email {!editingDriver && <span className="font-normal text-gray-400">(for login)</span>}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className={`${inputWithIconClass('email')} ${editingDriver ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="john@example.com"
                        disabled={!!editingDriver}
                      />
                    </div>
                    <FieldError field="email" />
                    {!editingDriver && !formErrors.email && (
                      <p className="text-xs text-gray-400 mt-0.5">Credentials will be sent here</p>
                    )}
                    {editingDriver && (
                      <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handlePhoneChange}
                        className={inputWithIconClass('phoneNumber')}
                        placeholder="07XXXXXXXX"
                        maxLength={10}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <FieldError field="phoneNumber" />
                      <span className={`text-xs ml-auto ${formData.phoneNumber.length === 10 ? 'text-green-500' : 'text-gray-400'}`}>
                        {formData.phoneNumber.length}/10
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ID Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.idNumber}
                        onChange={handleIdChange}
                        className={inputWithIconClass('idNumber')}
                        placeholder="16-digit ID number"
                        maxLength={16}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <FieldError field="idNumber" />
                      <span className={`text-xs ml-auto ${formData.idNumber.length === 16 ? 'text-green-500' : 'text-gray-400'}`}>
                        {formData.idNumber.length}/16
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hired Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.hiredDate}
                        onChange={(e) => setFormData({ ...formData, hiredDate: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                      <textarea
                        value={formData.address}
                        onChange={handleAddressChange}
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${formErrors.address ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Full address"
                        rows="2"
                        maxLength={50}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <FieldError field="address" />
                      <span className={`text-xs ml-auto ${formData.address.length >= 50 ? 'text-red-500' : 'text-gray-400'}`}>
                        {formData.address.length}/50
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* License Info */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">License Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">License Number *</label>
                    <input
                      type="text"
                      value={formData.licenseNo}
                      onChange={handleLicenseChange}
                      className={inputClass('licenseNo')}
                      placeholder="16-digit license number"
                      maxLength={16}
                    />
                    <div className="flex items-center justify-between mt-0.5">
                      <FieldError field="licenseNo" />
                      <span className={`text-xs ml-auto ${formData.licenseNo.length === 16 ? 'text-green-500' : 'text-gray-400'}`}>
                        {formData.licenseNo.length}/16
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.licenseExpiryDate}
                        onChange={(e) => handleChange('licenseExpiryDate', e.target.value)}
                        className={inputWithIconClass('licenseExpiryDate')}
                      />
                    </div>
                    <FieldError field="licenseExpiryDate" />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">Status</p>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Driver Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {Object.values(DRIVER_STATUS).map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center mt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isBackup}
                        onChange={(e) => setFormData({
                          ...formData,
                          isBackup: e.target.checked,
                          assignVehicle: e.target.checked ? false : formData.assignVehicle,
                          assignedVehicleId: e.target.checked ? '' : formData.assignedVehicleId
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-xs font-semibold text-gray-700">
                        Backup Driver
                        <span className="block font-normal text-gray-400">Cannot be assigned to vehicles</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Vehicle Assignment */}
              {!formData.isBackup && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" /> Vehicle Assignment
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.assignVehicle}
                        onChange={(e) => setFormData({
                          ...formData,
                          assignVehicle: e.target.checked,
                          assignedVehicleId: e.target.checked ? formData.assignedVehicleId : ''
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-xs font-medium text-gray-700">Assign Vehicle</span>
                    </label>
                  </div>

                  {formData.assignVehicle && (
                    getAvailableVehicles().length > 0 ? (
                      <select
                        value={formData.assignedVehicleId}
                        onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required={formData.assignVehicle}
                      >
                        <option value="">Select a vehicle...</option>
                        {getAvailableVehicles().map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.plateNo} — {vehicle.vehicleType} ({vehicle.capacity} seats)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>No vehicles available. You can assign one later.</p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  {editingDriver ? 'Update Driver' : 'Add Driver'}
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

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{driver.names}</h3>
                  <p className="text-sm text-gray-600">{driver.licenseNo}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(driver.status)}`}>
                {driver.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{driver.phoneNumber}</span>
              </div>
              {driver.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{driver.email}</span>
                </div>
              )}
              {driver.assignedVehiclePlateNo && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Car className="w-4 h-4" />
                  <span className="font-medium text-blue-600">{driver.assignedVehiclePlateNo}</span>
                </div>
              )}
              {driver.isBackup && (
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium inline-block">
                  Backup Driver
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEdit(driver)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(driver.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {drivers.length === 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No drivers found. Add your first driver to get started.</p>
        </div>
      )}
    </div>
  );
};

export default DriversManagement;