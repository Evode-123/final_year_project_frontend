import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, MapPin, Clock, Car, AlertCircle } from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const RoutesManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [allRouteVehicleAssignments, setAllRouteVehicleAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger' // 'danger' or 'warning'
  });
  const [loadingRouteDetails, setLoadingRouteDetails] = useState(false);

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    price: '',
    durationMinutes: '',
    selectedTimeSlots: [],
    selectedVehicles: [],
    existingTimeSlots: [], // Track existing assignments for editing
    existingVehicles: []   // Track existing assignments for editing
  });

  const [newTimeSlot, setNewTimeSlot] = useState({
    departureTime: ''
  });

  const [showTimeSlotManager, setShowTimeSlotManager] = useState(false);

  const showConfirmDialog = (title, message, onConfirm, type = 'danger', confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      type
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'danger'
    });
  };

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    closeConfirmDialog();
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesData, vehiclesData, timeSlotsData, allAssignments] = await Promise.all([
        transportApiService.getAllRoutes(),
        transportApiService.getAllVehicles(),
        transportApiService.getAllTimeSlots(),
        transportApiService.getAllRouteVehicleAssignments()
      ]);
      setRoutes(routesData);
      setVehicles(vehiclesData);
      setTimeSlots(timeSlotsData);
      setAllRouteVehicleAssignments(allAssignments);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRouteDetails = async (routeId) => {
    try {
      setLoadingRouteDetails(true);
      const [routeTimeSlots, routeVehicleAssignments] = await Promise.all([
        transportApiService.getTimeSlotsForRoute(routeId),
        transportApiService.getRouteVehicleAssignments(routeId)
      ]);
      
      return {
        timeSlotIds: routeTimeSlots.map(rts => rts.timeSlot.id),
        vehicleIds: routeVehicleAssignments.map(rv => rv.vehicle.id),
        existingTimeSlots: routeTimeSlots,
        existingVehicles: routeVehicleAssignments
      };
    } catch (err) {
      console.error('Failed to load route details:', err);
      return {
        timeSlotIds: [],
        vehicleIds: [],
        existingTimeSlots: [],
        existingVehicles: []
      };
    } finally {
      setLoadingRouteDetails(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const routeData = {
        origin: formData.origin,
        destination: formData.destination,
        price: parseFloat(formData.price),
        durationMinutes: parseInt(formData.durationMinutes) || null,
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

      // Handle Time Slots
      if (formData.selectedTimeSlots.length > 0) {
        for (const timeSlotId of formData.selectedTimeSlots) {
          try {
            await transportApiService.assignTimeSlotToRoute(savedRoute.id, timeSlotId);
          } catch (err) {
            console.error('Error assigning time slot:', err);
          }
        }
      }

      // Handle Vehicles
      if (formData.selectedVehicles.length > 0) {
        for (const vehicleId of formData.selectedVehicles) {
          try {
            await transportApiService.assignVehicleToRoute(savedRoute.id, vehicleId);
          } catch (err) {
            console.error('Error assigning vehicle:', err);
          }
        }
      }

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

  const handleDeleteTimeSlot = async (timeSlotId) => {
    showConfirmDialog(
      'Delete Time Slot',
      'Are you sure you want to delete this time slot? This will remove it from all routes using it.',
      async () => {
        try {
          await transportApiService.deleteTimeSlot(timeSlotId);
          
          // Remove from time slots list
          setTimeSlots(timeSlots.filter(ts => ts.id !== timeSlotId));
          
          // Remove from selected time slots if it was selected
          setFormData(prev => ({
            ...prev,
            selectedTimeSlots: prev.selectedTimeSlots.filter(id => id !== timeSlotId)
          }));
          
          setSuccess('Time slot deleted successfully!');
        } catch (err) {
          setError('Failed to delete time slot: ' + err.message);
        }
      },
      'danger',
      'Delete',
      'Cancel'
    );
  };

  const handleRemoveTimeSlot = async (assignmentId) => {
    showConfirmDialog(
      'Remove Time Slot',
      'Are you sure you want to remove this time slot from the route?',
      async () => {
        try {
          await transportApiService.removeTimeSlotFromRoute(assignmentId);
          setSuccess('Time slot removed successfully!');
          
          // Refresh the route details
          if (editingRoute) {
            const details = await loadRouteDetails(editingRoute.id);
            setFormData(prev => ({
              ...prev,
              existingTimeSlots: details.existingTimeSlots
            }));
          }
        } catch (err) {
          setError('Failed to remove time slot: ' + err.message);
        }
      },
      'warning',
      'Remove',
      'Cancel'
    );
  };

  const handleRemoveVehicle = async (assignmentId) => {
    showConfirmDialog(
      'Remove Vehicle',
      'Are you sure you want to remove this vehicle from the route?',
      async () => {
        try {
          await transportApiService.removeVehicleFromRoute(assignmentId);
          setSuccess('Vehicle removed from route successfully!');
          
          // Refresh all data including assignments
          await loadData();
          
          // Refresh the route details
          if (editingRoute) {
            const details = await loadRouteDetails(editingRoute.id);
            setFormData(prev => ({
              ...prev,
              existingVehicles: details.existingVehicles
            }));
          }
        } catch (err) {
          setError('Failed to remove vehicle: ' + err.message);
        }
      },
      'warning',
      'Remove',
      'Cancel'
    );
  };

  const handleEdit = async (route) => {
    setEditingRoute(route);
    
    // Load existing assignments
    const details = await loadRouteDetails(route.id);
    
    setFormData({
      origin: route.origin,
      destination: route.destination,
      price: route.price,
      durationMinutes: route.durationMinutes || '',
      selectedTimeSlots: [],
      selectedVehicles: [],
      existingTimeSlots: details.existingTimeSlots,
      existingVehicles: details.existingVehicles
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    showConfirmDialog(
      'Delete Route',
      'Are you sure you want to delete this route? This action cannot be undone.',
      async () => {
        try {
          await transportApiService.deleteRoute(id);
          setSuccess('Route deleted successfully!');
          loadData();
        } catch (err) {
          setError('Failed to delete route: ' + err.message);
        }
      },
      'danger',
      'Delete',
      'Cancel'
    );
  };

  const resetForm = () => {
    setFormData({
      origin: '',
      destination: '',
      price: '',
      durationMinutes: '',
      selectedTimeSlots: [],
      selectedVehicles: [],
      existingTimeSlots: [],
      existingVehicles: []
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

  const isTimeSlotAlreadyAssigned = (timeSlotId) => {
    return formData.existingTimeSlots.some(ts => ts.timeSlot.id === timeSlotId);
  };

  const isVehicleAlreadyAssigned = (vehicleId) => {
    return formData.existingVehicles.some(rv => rv.vehicle.id === vehicleId);
  };

  const isVehicleAssignedToAnyRoute = (vehicleId) => {
    // Check if vehicle is assigned to any route (excluding current route when editing)
    return allRouteVehicleAssignments.some(assignment => {
      const isAssignedToThisVehicle = assignment.vehicle.id === vehicleId;
      const isCurrentRoute = editingRoute && assignment.route.id === editingRoute.id;
      return isAssignedToThisVehicle && !isCurrentRoute;
    });
  };

  const getAvailableVehicles = () => {
    return vehicles.filter(vehicle => {
      // If editing, exclude vehicles already assigned to this route
      if (editingRoute && isVehicleAlreadyAssigned(vehicle.id)) {
        return false;
      }
      
      // Exclude vehicles assigned to other routes
      if (isVehicleAssignedToAnyRoute(vehicle.id)) {
        return false;
      }
      
      // Only show available vehicles
      return vehicle.status === 'AVAILABLE' && vehicle.isActive;
    });
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

      {/* Modal Overlay and Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editingRoute ? 'Edit Route' : 'Create New Route'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingRouteDetails ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Route Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Route Information
                  </h3>
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
                </div>

                {/* Time Slots Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Departure Times
                  </h3>

                  {/* Existing Time Slots (for editing) */}
                  {editingRoute && formData.existingTimeSlots.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700">Currently Assigned Time Slots</p>
                        <span className="text-xs text-gray-500">{formData.existingTimeSlots.length} assigned</span>
                      </div>
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {formData.existingTimeSlots.map((ts) => (
                            <div
                              key={ts.id}
                              className="p-3 rounded-lg border-2 border-green-500 bg-white relative shadow-sm"
                            >
                              <button
                                type="button"
                                onClick={() => handleRemoveTimeSlot(ts.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition-colors"
                                title="Remove time slot"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="font-bold text-green-700 text-center">{ts.timeSlot.departureTime}</div>
                              <div className="text-xs text-green-600 text-center mt-1">✓ Assigned</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {editingRoute && formData.existingTimeSlots.length === 0 && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        ⚠️ No time slots currently assigned to this route. Please add time slots below.
                      </p>
                    </div>
                  )}

                  {/* Create New Time Slot */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-700">Create New Time Slot</p>
                      <button
                        type="button"
                        onClick={() => setShowTimeSlotManager(!showTimeSlotManager)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showTimeSlotManager ? 'Hide All Time Slots' : 'Manage All Time Slots'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="time"
                        value={newTimeSlot.departureTime}
                        onChange={(e) => setNewTimeSlot({ ...newTimeSlot, departureTime: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleCreateTimeSlot}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Add Time Slot
                      </button>
                    </div>

                    {/* Show all time slots with delete option */}
                    {showTimeSlotManager && (
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <p className="text-xs font-semibold text-gray-600 mb-3">
                          All System Time Slots ({timeSlots.length})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                          {timeSlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="relative p-2 rounded border border-gray-300 bg-white"
                            >
                              <button
                                type="button"
                                onClick={() => handleDeleteTimeSlot(slot.id)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                                title="Delete time slot"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className="text-sm font-medium text-gray-700 text-center pr-3">
                                {slot.departureTime}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Select Additional Time Slots */}
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {editingRoute ? 'Add More Time Slots' : 'Select Time Slots'}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {timeSlots
                      .filter(slot => !isTimeSlotAlreadyAssigned(slot.id))
                      .map((slot) => (
                        <div key={slot.id} className="relative">
                          <button
                            type="button"
                            onClick={() => handleTimeSlotToggle(slot.id)}
                            className={`w-full p-3 rounded-lg border-2 transition-colors ${
                              formData.selectedTimeSlots.includes(slot.id)
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                            }`}
                          >
                            <div className="font-semibold">{slot.departureTime}</div>
                            {formData.selectedTimeSlots.includes(slot.id) && (
                              <div className="text-xs text-blue-600 mt-1">✓ Selected</div>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTimeSlot(slot.id);
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition-colors z-10"
                            title="Delete this time slot from system"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Vehicle Assignment Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    Vehicle Assignments
                  </h3>

                  {/* Existing Vehicles (for editing) */}
                  {editingRoute && formData.existingVehicles.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700">Currently Assigned Vehicles</p>
                        <span className="text-xs text-gray-500">{formData.existingVehicles.length} assigned</span>
                      </div>
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {formData.existingVehicles.map((rv) => (
                            <div
                              key={rv.id}
                              className="p-4 rounded-lg border-2 border-green-500 bg-white relative shadow-sm"
                            >
                              <button
                                type="button"
                                onClick={() => handleRemoveVehicle(rv.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition-colors"
                                title="Remove vehicle"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="font-bold text-green-700">{rv.vehicle.plateNo}</div>
                              <div className="text-sm text-green-600">{rv.vehicle.vehicleType}</div>
                              <div className="text-xs text-green-600 mt-1">{rv.vehicle.capacity} seats</div>
                              <div className="text-xs text-green-700 font-semibold mt-2">✓ Assigned</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {editingRoute && formData.existingVehicles.length === 0 && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        ⚠️ No vehicles currently assigned to this route. Please add vehicles below.
                      </p>
                    </div>
                  )}

                  {/* Select Additional Vehicles */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-700">
                        {editingRoute ? 'Add More Vehicles' : 'Select Vehicles'}
                      </p>
                      {editingRoute && (
                        <span className="text-xs text-gray-500">
                          {getAvailableVehicles().length} available to add
                        </span>
                      )}
                    </div>
                    
                    {getAvailableVehicles().length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {getAvailableVehicles().map((vehicle) => (
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
                            {formData.selectedVehicles.includes(vehicle.id) && (
                              <div className="text-xs text-blue-600 font-semibold mt-2">✓ Selected</div>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-6 rounded-lg text-center">
                        <Car className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm">
                          {editingRoute 
                            ? 'All available vehicles have been assigned to this route.'
                            : 'No vehicles available. Please add vehicles first.'}
                        </p>
                      </div>
                    )}
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
            )}
          </div>
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

      {/* Empty State */}
      {routes.length === 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No routes found. Add your first route to get started.</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all">
            {/* Header */}
            <div className={`px-6 py-4 border-b ${
              confirmDialog.type === 'danger' 
                ? 'bg-red-50 border-red-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmDialog.type === 'danger'
                    ? 'bg-red-100'
                    : 'bg-yellow-100'
                }`}>
                  <AlertCircle className={`w-6 h-6 ${
                    confirmDialog.type === 'danger'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`} />
                </div>
                <h3 className={`text-lg font-bold ${
                  confirmDialog.type === 'danger'
                    ? 'text-red-900'
                    : 'text-yellow-900'
                }`}>
                  {confirmDialog.title}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              <p className="text-gray-700">
                {confirmDialog.message}
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-lg">
              <button
                onClick={closeConfirmDialog}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg transition-colors font-medium text-white ${
                  confirmDialog.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutesManagement;