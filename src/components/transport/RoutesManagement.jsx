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
  const [loadingRouteDetails, setLoadingRouteDetails] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, title: '', message: '', onConfirm: null,
    confirmText: 'Confirm', cancelText: 'Cancel', type: 'danger'
  });

  const [formData, setFormData] = useState({
    origin: '', destination: '', price: '', durationMinutes: '',
    selectedTimeSlots: [], selectedVehicles: [],
    existingTimeSlots: [], existingVehicles: []
  });

  const [formErrors, setFormErrors] = useState({});

  const [newTimeSlot, setNewTimeSlot] = useState({ departureTime: '' });
  const [showTimeSlotManager, setShowTimeSlotManager] = useState(false);

  // ── Validators ───────────────────────────────────────────────
  const validators = {
    origin: (v) => {
      if (!v.trim()) return 'Origin is required.';
      if (v.trim().length < 2) return 'Origin must be at least 2 characters.';
      if (v.trim().length > 30) return 'Origin cannot exceed 30 characters.';
      const words = v.trim().split(/\s+/);
      if (words.some(w => w.length > 20)) return 'Each word cannot exceed 20 characters.';
      if (!/^[a-zA-Z\s'-]+$/.test(v)) return 'Only letters, spaces, hyphens, or apostrophes allowed.';
      return '';
    },
    destination: (v) => {
      if (!v.trim()) return 'Destination is required.';
      if (v.trim().length < 2) return 'Destination must be at least 2 characters.';
      if (v.trim().length > 30) return 'Destination cannot exceed 30 characters.';
      const words = v.trim().split(/\s+/);
      if (words.some(w => w.length > 20)) return 'Each word cannot exceed 20 characters.';
      if (!/^[a-zA-Z\s'-]+$/.test(v)) return 'Only letters, spaces, hyphens, or apostrophes allowed.';
      return '';
    },
    price: (v) => {
      if (!v) return 'Price is required.';
      if (isNaN(v) || Number(v) <= 0) return 'Price must be a positive number.';
      if (Number(v) > 999999) return 'Price seems too high (max 999,999 RWF).';
      return '';
    },
    durationMinutes: (v) => {
      if (!v) return ''; // optional
      if (!/^\d+$/.test(v)) return 'Duration must be a whole number.';
      if (Number(v) <= 0) return 'Duration must be greater than 0.';
      if (Number(v) > 1440) return 'Duration cannot exceed 1,440 minutes (24 hrs).';
      return '';
    },
  };

  const validate = (field, value) => validators[field] ? validators[field](value) : '';

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: validate(field, value) }));
  };

  // Location: letters/spaces/hyphens/apostrophes, max 30 total, max 20 per word
  const handleLocationChange = (field, e) => {
    const raw = e.target.value;
    const words = raw.trim().split(/\s+/);
    if (words.some(w => w.length > 20)) return;
    if (raw.length > 30) return;
    handleChange(field, raw);
  };

  // Price: digits and one dot only, max 6 digits
  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^\d.]/g, '');
    const parts = raw.split('.');
    if (parts.length > 2) return;
    if (parts[0].length > 6) return;
    handleChange('price', raw);
  };

  // Duration: digits only, max 4 digits (up to 1440)
  const handleDurationChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    handleChange('durationMinutes', raw);
  };

  const runAllValidations = () => {
    const fields = ['origin', 'destination', 'price', 'durationMinutes'];
    const errors = {};
    fields.forEach(f => {
      const err = validate(f, formData[f] ?? '');
      if (err) errors[f] = err;
    });
    // Cross-field: origin !== destination
    if (
      formData.origin.trim() &&
      formData.destination.trim() &&
      formData.origin.trim().toLowerCase() === formData.destination.trim().toLowerCase()
    ) {
      errors.destination = 'Destination must be different from origin.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Confirm dialog ───────────────────────────────────────────
  const showConfirmDialog = (title, message, onConfirm, type = 'danger', confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm, confirmText, cancelText, type });
  };
  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', cancelText: 'Cancel', type: 'danger' });
  };
  const handleConfirm = () => {
    if (confirmDialog.onConfirm) confirmDialog.onConfirm();
    closeConfirmDialog();
  };

  useEffect(() => { loadData(); }, []);

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
      return { timeSlotIds: [], vehicleIds: [], existingTimeSlots: [], existingVehicles: [] };
    } finally {
      setLoadingRouteDetails(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!runAllValidations()) return;

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

      for (const timeSlotId of formData.selectedTimeSlots) {
        try { await transportApiService.assignTimeSlotToRoute(savedRoute.id, timeSlotId); }
        catch (err) { console.error('Error assigning time slot:', err); }
      }

      for (const vehicleId of formData.selectedVehicles) {
        try { await transportApiService.assignVehicleToRoute(savedRoute.id, vehicleId); }
        catch (err) { console.error('Error assigning vehicle:', err); }
      }

      await loadData();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError('Failed to save route: ' + err.message);
    }
  };

  const handleCreateTimeSlot = async () => {
    if (!newTimeSlot.departureTime) { setError('Please select a departure time.'); return; }
    try {
      const created = await transportApiService.createTimeSlot({ departureTime: newTimeSlot.departureTime, isActive: true });
      setTimeSlots([...timeSlots, created]);
      setNewTimeSlot({ departureTime: '' });
      setSuccess('Time slot created successfully!');
    } catch (err) {
      setError('Failed to create time slot: ' + err.message);
    }
  };

  const handleDeleteTimeSlot = async (timeSlotId) => {
    showConfirmDialog('Delete Time Slot', 'This will remove the time slot from all routes using it.', async () => {
      try {
        await transportApiService.deleteTimeSlot(timeSlotId);
        setTimeSlots(timeSlots.filter(ts => ts.id !== timeSlotId));
        setFormData(prev => ({ ...prev, selectedTimeSlots: prev.selectedTimeSlots.filter(id => id !== timeSlotId) }));
        setSuccess('Time slot deleted.');
      } catch (err) { setError('Failed to delete time slot: ' + err.message); }
    }, 'danger', 'Delete', 'Cancel');
  };

  const handleRemoveTimeSlot = async (assignmentId) => {
    showConfirmDialog('Remove Time Slot', 'Remove this time slot from the route?', async () => {
      try {
        await transportApiService.removeTimeSlotFromRoute(assignmentId);
        setSuccess('Time slot removed.');
        if (editingRoute) {
          const details = await loadRouteDetails(editingRoute.id);
          setFormData(prev => ({ ...prev, existingTimeSlots: details.existingTimeSlots }));
        }
      } catch (err) { setError('Failed to remove time slot: ' + err.message); }
    }, 'warning', 'Remove', 'Cancel');
  };

  const handleRemoveVehicle = async (assignmentId) => {
    showConfirmDialog('Remove Vehicle', 'Remove this vehicle from the route?', async () => {
      try {
        await transportApiService.removeVehicleFromRoute(assignmentId);
        setSuccess('Vehicle removed from route.');
        await loadData();
        if (editingRoute) {
          const details = await loadRouteDetails(editingRoute.id);
          setFormData(prev => ({ ...prev, existingVehicles: details.existingVehicles }));
        }
      } catch (err) { setError('Failed to remove vehicle: ' + err.message); }
    }, 'warning', 'Remove', 'Cancel');
  };

  const handleEdit = async (route) => {
    setEditingRoute(route);
    const details = await loadRouteDetails(route.id);
    setFormData({
      origin: route.origin, destination: route.destination,
      price: route.price, durationMinutes: route.durationMinutes || '',
      selectedTimeSlots: [], selectedVehicles: [],
      existingTimeSlots: details.existingTimeSlots,
      existingVehicles: details.existingVehicles
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    showConfirmDialog('Delete Route', 'Are you sure you want to delete this route? This action cannot be undone.', async () => {
      try {
        await transportApiService.deleteRoute(id);
        setSuccess('Route deleted successfully!');
        loadData();
      } catch (err) { setError('Failed to delete route: ' + err.message); }
    }, 'danger', 'Delete', 'Cancel');
  };

  const resetForm = () => {
    setFormData({ origin: '', destination: '', price: '', durationMinutes: '', selectedTimeSlots: [], selectedVehicles: [], existingTimeSlots: [], existingVehicles: [] });
    setFormErrors({});
    setEditingRoute(null);
  };

  const handleTimeSlotToggle = (id) => setFormData(prev => ({
    ...prev,
    selectedTimeSlots: prev.selectedTimeSlots.includes(id)
      ? prev.selectedTimeSlots.filter(s => s !== id)
      : [...prev.selectedTimeSlots, id]
  }));

  const handleVehicleToggle = (id) => setFormData(prev => ({
    ...prev,
    selectedVehicles: prev.selectedVehicles.includes(id)
      ? prev.selectedVehicles.filter(v => v !== id)
      : [...prev.selectedVehicles, id]
  }));

  const isTimeSlotAlreadyAssigned = (id) => formData.existingTimeSlots.some(ts => ts.timeSlot.id === id);
  const isVehicleAlreadyAssigned = (id) => formData.existingVehicles.some(rv => rv.vehicle.id === id);
  const isVehicleAssignedToAnyRoute = (vehicleId) =>
    allRouteVehicleAssignments.some(a => a.vehicle.id === vehicleId && !(editingRoute && a.route.id === editingRoute.id));

  const getAvailableVehicles = () => vehicles.filter(v => {
    if (editingRoute && isVehicleAlreadyAssigned(v.id)) return false;
    if (isVehicleAssignedToAnyRoute(v.id)) return false;
    return v.status === 'AVAILABLE' && v.isActive;
  });

  // Reusable error message
  const FieldError = ({ field }) => formErrors[field] ? (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />{formErrors[field]}
    </p>
  ) : null;

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Routes Management</h1>
          <p className="text-gray-600 mt-1">Manage transport routes, schedules, and vehicle assignments</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Route
        </button>
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

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {editingRoute ? 'Edit Route' : 'Create New Route'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingRouteDetails ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-5">

                {/* Route Info */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Route Information
                  </p>
                  <div className="grid grid-cols-2 gap-3">

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Origin *</label>
                      <input
                        type="text"
                        value={formData.origin}
                        onChange={(e) => handleLocationChange('origin', e)}
                        className={inputClass('origin')}
                        placeholder="e.g. Kigali"
                        maxLength={30}
                      />
                      <div className="flex items-center justify-between mt-0.5">
                        <FieldError field="origin" />
                        <span className={`text-xs ml-auto ${formData.origin.length >= 30 ? 'text-red-500' : 'text-gray-400'}`}>
                          {formData.origin.length}/30
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Destination *</label>
                      <input
                        type="text"
                        value={formData.destination}
                        onChange={(e) => handleLocationChange('destination', e)}
                        className={inputClass('destination')}
                        placeholder="e.g. Musanze"
                        maxLength={30}
                      />
                      <div className="flex items-center justify-between mt-0.5">
                        <FieldError field="destination" />
                        <span className={`text-xs ml-auto ${formData.destination.length >= 30 ? 'text-red-500' : 'text-gray-400'}`}>
                          {formData.destination.length}/30
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Price (RWF) *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.price}
                        onChange={handlePriceChange}
                        className={inputClass('price')}
                        placeholder="2500"
                      />
                      <FieldError field="price" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Minutes)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.durationMinutes}
                        onChange={handleDurationChange}
                        className={inputClass('durationMinutes')}
                        placeholder="120"
                        maxLength={4}
                      />
                      <FieldError field="durationMinutes" />
                    </div>

                  </div>
                </div>

                {/* Time Slots */}
                <div className="border-t pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Departure Times
                  </p>

                  {/* Existing assigned time slots */}
                  {editingRoute && formData.existingTimeSlots.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Currently Assigned</p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex flex-wrap gap-2">
                          {formData.existingTimeSlots.map((ts) => (
                            <div key={ts.id} className="relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-green-500 rounded-full text-sm font-semibold text-green-700 shadow-sm">
                              {ts.timeSlot.departureTime}
                              <button
                                type="button"
                                onClick={() => handleRemoveTimeSlot(ts.id)}
                                className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {editingRoute && formData.existingTimeSlots.length === 0 && (
                    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-yellow-800">⚠️ No time slots assigned yet. Add some below.</p>
                    </div>
                  )}

                  {/* Create new time slot */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-700">Create New Time Slot</p>
                      <button
                        type="button"
                        onClick={() => setShowTimeSlotManager(!showTimeSlotManager)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showTimeSlotManager ? 'Hide All' : 'Manage All'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={newTimeSlot.departureTime}
                        onChange={(e) => setNewTimeSlot({ departureTime: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleCreateTimeSlot}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>

                    {showTimeSlotManager && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <p className="text-xs font-semibold text-gray-600 mb-2">All System Time Slots ({timeSlots.length})</p>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {timeSlots.map((slot) => (
                            <div key={slot.id} className="relative inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-300 rounded-full text-xs text-gray-700">
                              {slot.departureTime}
                              <button
                                type="button"
                                onClick={() => handleDeleteTimeSlot(slot.id)}
                                className="w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Select additional time slots */}
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    {editingRoute ? 'Add More Time Slots' : 'Select Time Slots'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.filter(s => !isTimeSlotAlreadyAssigned(s.id)).map((slot) => (
                      <div key={slot.id} className="relative">
                        <button
                          type="button"
                          onClick={() => handleTimeSlotToggle(slot.id)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-colors ${
                            formData.selectedTimeSlots.includes(slot.id)
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                          }`}
                        >
                          {slot.departureTime}
                          {formData.selectedTimeSlots.includes(slot.id) && <span className="ml-1 text-xs">✓</span>}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteTimeSlot(slot.id); }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    {timeSlots.filter(s => !isTimeSlotAlreadyAssigned(s.id)).length === 0 && (
                      <p className="text-xs text-gray-400 italic">No additional time slots available.</p>
                    )}
                  </div>
                </div>

                {/* Vehicle Assignment */}
                <div className="border-t pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5" /> Vehicle Assignments
                  </p>

                  {/* Existing assigned vehicles */}
                  {editingRoute && formData.existingVehicles.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Currently Assigned</p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-2">
                          {formData.existingVehicles.map((rv) => (
                            <div key={rv.id} className="relative bg-white border-2 border-green-500 rounded-lg p-2.5 shadow-sm">
                              <button
                                type="button"
                                onClick={() => handleRemoveVehicle(rv.id)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className="font-bold text-green-700 text-sm">{rv.vehicle.plateNo}</div>
                              <div className="text-xs text-green-600">{rv.vehicle.vehicleType} · {rv.vehicle.capacity} seats</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {editingRoute && formData.existingVehicles.length === 0 && (
                    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-yellow-800">⚠️ No vehicles assigned yet. Add some below.</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-700">
                      {editingRoute ? 'Add More Vehicles' : 'Select Vehicles'}
                    </p>
                    <span className="text-xs text-gray-400">{getAvailableVehicles().length} available</span>
                  </div>

                  {getAvailableVehicles().length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {getAvailableVehicles().map((vehicle) => (
                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={() => handleVehicleToggle(vehicle.id)}
                          className={`p-3 rounded-lg border-2 transition-colors text-left ${
                            formData.selectedVehicles.includes(vehicle.id)
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-300 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="font-semibold text-gray-800 text-sm">{vehicle.plateNo}</div>
                          <div className="text-xs text-gray-500">{vehicle.vehicleType} · {vehicle.capacity} seats</div>
                          {formData.selectedVehicles.includes(vehicle.id) && (
                            <div className="text-xs text-blue-600 font-semibold mt-1">✓ Selected</div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 text-gray-500 px-4 py-4 rounded-lg text-center">
                      <Car className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs">
                        {editingRoute ? 'All available vehicles are already assigned.' : 'No vehicles available. Add vehicles first.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Save className="w-4 h-4" />
                    {editingRoute ? 'Update Route' : 'Create Route'}
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
            )}
          </div>
        </div>
      )}

      {/* Routes Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">All Routes ({routes.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Route</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Duration</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-gray-800">{route.origin} → {route.destination}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-800 text-sm">RWF {route.price?.toLocaleString()}</td>
                  <td className="px-5 py-4 text-gray-600 text-sm">
                    {route.durationMinutes
                      ? `${Math.floor(route.durationMinutes / 60)}h ${route.durationMinutes % 60}m`
                      : 'N/A'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${route.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {route.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(route)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(route.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

      {routes.length === 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No routes found. Add your first route to get started.</p>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm">
            <div className={`px-5 py-4 border-b rounded-t-lg ${confirmDialog.type === 'danger' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${confirmDialog.type === 'danger' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  <AlertCircle className={`w-5 h-5 ${confirmDialog.type === 'danger' ? 'text-red-600' : 'text-yellow-600'}`} />
                </div>
                <h3 className={`text-base font-bold ${confirmDialog.type === 'danger' ? 'text-red-900' : 'text-yellow-900'}`}>
                  {confirmDialog.title}
                </h3>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700">{confirmDialog.message}</p>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 rounded-b-lg">
              <button onClick={closeConfirmDialog} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                {confirmDialog.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white ${confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
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