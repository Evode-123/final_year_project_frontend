import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, User, Car, Phone, CreditCard, Calendar, MapPin, AlertCircle } from 'lucide-react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const driverData = {
        names: formData.names,
        phoneNumber: formData.phoneNumber,
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
        setSuccess('Driver created successfully!');
      }

      if (formData.assignVehicle && formData.assignedVehicleId && !formData.isBackup) {
        try {
          await transportApiService.assignDriverToVehicle(
            savedDriver.id,
            parseInt(formData.assignedVehicleId)
          );
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
      case DRIVER_STATUS.ACTIVE:
        return 'bg-green-100 text-green-800';
      case DRIVER_STATUS.ON_LEAVE:
        return 'bg-yellow-100 text-yellow-800';
      case DRIVER_STATUS.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      case DRIVER_STATUS.BACKUP:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Drivers Management</h1>
          <p className="text-gray-600 mt-1">Manage drivers and their vehicle assignments</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Driver
        </button>
      </div>

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

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {editingDriver ? 'Edit Driver' : 'Add New Driver'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Names *
                  </label>
                  <input
                    type="text"
                    value={formData.names}
                    onChange={(e) => setFormData({ ...formData, names: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0788123456"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1234567890123456"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hired Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.hiredDate}
                      onChange={(e) => setFormData({ ...formData, hiredDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter full address"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">License Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    License Number *
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNo}
                    onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="DL123456"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    License Expiry Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.licenseExpiryDate}
                      onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Driver Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {Object.values(DRIVER_STATUS).map((status) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isBackup}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        isBackup: e.target.checked,
                        assignVehicle: e.target.checked ? false : formData.assignVehicle,
                        assignedVehicleId: e.target.checked ? '' : formData.assignedVehicleId
                      })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Backup Driver
                      <span className="block text-xs font-normal text-gray-500">
                        Backup drivers cannot be assigned to vehicles
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {!formData.isBackup && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    Vehicle Assignment
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignVehicle}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        assignVehicle: e.target.checked,
                        assignedVehicleId: e.target.checked ? formData.assignedVehicleId : ''
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Assign Vehicle</span>
                  </label>
                </div>

                {formData.assignVehicle && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Vehicle
                    </label>
                    {getAvailableVehicles().length > 0 ? (
                      <select
                        value={formData.assignedVehicleId}
                        onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={formData.assignVehicle}
                      >
                        <option value="">Select a vehicle...</option>
                        {getAvailableVehicles().map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.plateNo} - {vehicle.vehicleType} ({vehicle.capacity} seats)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">No vehicles available</p>
                          <p className="text-sm mt-1">All vehicles are either assigned or not available. You can assign a vehicle later.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-6 border-t">
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                {editingDriver ? 'Update Driver' : 'Add Driver'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
              {driver.assignedVehiclePlateNo && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Car className="w-4 h-4" />
                  <span className="font-medium text-blue-600">
                    {driver.assignedVehiclePlateNo}
                  </span>
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