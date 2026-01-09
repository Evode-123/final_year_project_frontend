import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, MapPin, Clock, Car } from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const RoutesManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    price: '',
    durationMinutes: '',
    selectedTimeSlots: [],
    selectedVehicles: []
  });

  const [newTimeSlot, setNewTimeSlot] = useState({
    departureTime: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesData, vehiclesData, timeSlotsData] = await Promise.all([
        transportApiService.getAllRoutes(),
        transportApiService.getAllVehicles(),
        transportApiService.getAllTimeSlots()
      ]);
      setRoutes(routesData);
      setVehicles(vehiclesData);
      setTimeSlots(timeSlotsData);
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
      // Step 1: Create/Update Route
      const routeData = {
        origin: formData.origin,
        destination: formData.destination,
        price: parseFloat(formData.price),
        durationMinutes: parseInt(formData.durationMinutes),
        isActive: true
      };

      let savedRoute;
      if (editingRoute) {
        savedRoute = await transportApiService.updateRoute(editingRoute.id, routeData);
        setSuccess('Route updated successfully!');
      } else {
        savedRoute = await transportApiService.createRoute(routeData);
        setSuccess('Route created successfully!');
      }

      // Step 2: Assign Time Slots to Route
      if (formData.selectedTimeSlots.length > 0) {
        for (const timeSlotId of formData.selectedTimeSlots) {
          try {
            await transportApiService.assignTimeSlotToRoute(savedRoute.id, timeSlotId);
          } catch (err) {
            console.error('Error assigning time slot:', err);
          }
        }
      }

      // Step 3: Assign Vehicles to Route
      if (formData.selectedVehicles.length > 0) {
        for (const vehicleId of formData.selectedVehicles) {
          try {
            await transportApiService.assignVehicleToRoute(savedRoute.id, vehicleId);
          } catch (err) {
            console.error('Error assigning vehicle:', err);
          }
        }
      }

      // Reload data and reset form
      await loadData();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError('Failed to save route: ' + err.message);
    }
  };

  const handleCreateTimeSlot = async () => {
    if (!newTimeSlot.departureTime) {
      setError('Please fill in time slot details');
      return;
    }

    try {
      const created = await transportApiService.createTimeSlot({
        departureTime: newTimeSlot.departureTime,
        isActive: true
      });
      
      setTimeSlots([...timeSlots, created]);
      setNewTimeSlot({ departureTime: '' });
      setSuccess('Time slot created successfully!');
    } catch (err) {
      setError('Failed to create time slot: ' + err.message);
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      origin: route.origin,
      destination: route.destination,
      price: route.price,
      durationMinutes: route.durationMinutes || '',
      selectedTimeSlots: [],
      selectedVehicles: []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;

    try {
      await transportApiService.deleteRoute(id);
      setSuccess('Route deleted successfully!');
      loadData();
    } catch (err) {
      setError('Failed to delete route: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      origin: '',
      destination: '',
      price: '',
      durationMinutes: '',
      selectedTimeSlots: [],
      selectedVehicles: []
    });
    setEditingRoute(null);
  };

  const handleTimeSlotToggle = (timeSlotId) => {
    setFormData(prev => ({
      ...prev,
      selectedTimeSlots: prev.selectedTimeSlots.includes(timeSlotId)
        ? prev.selectedTimeSlots.filter(id => id !== timeSlotId)
        : [...prev.selectedTimeSlots, timeSlotId]
    }));
  };

  const handleVehicleToggle = (vehicleId) => {
    setFormData(prev => ({
      ...prev,
      selectedVehicles: prev.selectedVehicles.includes(vehicleId)
        ? prev.selectedVehicles.filter(id => id !== vehicleId)
        : [...prev.selectedVehicles, vehicleId]
    }));
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
          <h1 className="text-3xl font-bold text-gray-800">Routes Management</h1>
          <p className="text-gray-600 mt-1">Manage transport routes, schedules, and vehicle assignments</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Route
        </button>
      </div>

      {/* Alert Messages */}
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

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {editingRoute ? 'Edit Route' : 'Create New Route'}
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Route Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Origin *
                </label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Kigali"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Destination *
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Musanze"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (RWF) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="120"
                />
              </div>
            </div>

            {/* Time Slots Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Departure Times
                </h3>
              </div>

              {/* Create New Time Slot */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Create New Time Slot</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="time"
                    value={newTimeSlot.departureTime}
                    onChange={(e) => setNewTimeSlot({ ...newTimeSlot, departureTime: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="08:00"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTimeSlot}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Time Slot
                  </button>
                </div>
              </div>

              {/* Select Existing Time Slots */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleTimeSlotToggle(slot.id)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.selectedTimeSlots.includes(slot.id)
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold">{slot.departureTime}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Assignment Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Assign Vehicles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => handleVehicleToggle(vehicle.id)}
                    className={`p-4 rounded-lg border-2 transition-colors text-left ${
                      formData.selectedVehicles.includes(vehicle.id)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{vehicle.plateNo}</div>
                    <div className="text-sm text-gray-600">{vehicle.vehicleType}</div>
                    <div className="text-xs text-gray-500 mt-1">{vehicle.capacity} seats</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-3 pt-6 border-t">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                {editingRoute ? 'Update Route' : 'Create Route'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Routes List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">All Routes ({routes.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-800">
                        {route.origin} → {route.destination}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-800">RWF {route.price}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">
                      {route.durationMinutes ? `${Math.floor(route.durationMinutes / 60)}h ${route.durationMinutes % 60}m` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      route.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {route.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(route)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoutesManagement;