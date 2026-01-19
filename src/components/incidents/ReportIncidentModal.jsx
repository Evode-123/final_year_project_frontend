import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, MapPin, Clock, FileText, Truck } from 'lucide-react';
import incidentApiService from '../../services/incidentApiService';

const INCIDENT_TYPES = {
  ACCIDENT: 'ACCIDENT',
  BREAKDOWN: 'BREAKDOWN',
  TRAFFIC_DELAY: 'TRAFFIC_DELAY',
  WEATHER_DELAY: 'WEATHER_DELAY',
  MECHANICAL_ISSUE: 'MECHANICAL_ISSUE',
  FLAT_TIRE: 'FLAT_TIRE',
  ROAD_CLOSURE: 'ROAD_CLOSURE',
  FUEL_ISSUE: 'FUEL_ISSUE',
  DRIVER_ISSUE: 'DRIVER_ISSUE',
  PASSENGER_INCIDENT: 'PASSENGER_INCIDENT',
  OTHER: 'OTHER'
};

const INCIDENT_SEVERITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const ReportIncidentModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [myTrips, setMyTrips] = useState([]);
  
  const [formData, setFormData] = useState({
    dailyTripId: '',
    incidentType: '',
    severity: INCIDENT_SEVERITIES.MEDIUM,
    description: '',
    location: '',
    incidentTime: new Date().toISOString().slice(0, 16),
    delayMinutes: '',
    requiresMaintenance: false,
    affectsSchedule: false,
    passengersAffected: false,
    affectedPassengerCount: ''
  });

  useEffect(() => {
    loadMyScheduledTrips();
  }, []);

  const loadMyScheduledTrips = async () => {
    try {
      setLoadingTrips(true);
      const trips = await incidentApiService.getMyScheduledTrips();
      setMyTrips(trips);
    } catch (err) {
      console.error('Failed to load scheduled trips:', err);
      setError('Could not load your scheduled trips. You can still report without selecting a trip.');
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const reportData = {
        ...formData,
        dailyTripId: formData.dailyTripId ? parseInt(formData.dailyTripId) : null,
        delayMinutes: formData.delayMinutes ? parseInt(formData.delayMinutes) : null,
        affectedPassengerCount: formData.affectedPassengerCount ? parseInt(formData.affectedPassengerCount) : null
      };

      await incidentApiService.reportIncident(reportData);
      onSuccess();
    } catch (err) {
      setError('Failed to report incident: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Report Incident
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Trip Selection - Shows driver's scheduled trips */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Truck className="w-4 h-4 inline mr-1" />
              Associated Trip (Optional)
            </label>
            {loadingTrips ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading your trips...</span>
              </div>
            ) : (
              <select
                value={formData.dailyTripId}
                onChange={(e) => setFormData({ ...formData, dailyTripId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No associated trip (General incident)</option>
                {myTrips.length === 0 ? (
                  <option disabled>No upcoming trips scheduled</option>
                ) : (
                  myTrips.map((trip) => (
                    <option key={trip.dailyTripId} value={trip.dailyTripId}>
                      {trip.tripDate} | {trip.departureTime} - {trip.origin} → {trip.destination} ({trip.vehiclePlateNo})
                    </option>
                  ))
                )}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {myTrips.length === 0 
                ? "You can still report the incident without selecting a trip"
                : "Select a trip if this incident is related to a specific journey"}
            </p>
          </div>

          {/* Incident Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Incident Type *
            </label>
            <select
              value={formData.incidentType}
              onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select incident type</option>
              {Object.entries(INCIDENT_TYPES).map(([key, value]) => (
                <option key={key} value={value}>
                  {value.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Severity *
            </label>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(INCIDENT_SEVERITIES).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: value })}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.severity === value
                      ? value === 'CRITICAL' ? 'border-red-600 bg-red-50 text-red-700'
                      : value === 'HIGH' ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : value === 'MEDIUM' ? 'border-yellow-600 bg-yellow-50 text-yellow-700'
                      : 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="text-xs font-medium">{value}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Describe what happened in detail..."
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Near Nyabugogo station, KN 5 Ave"
            />
          </div>

          {/* Incident Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Incident Time *
            </label>
            <input
              type="datetime-local"
              value={formData.incidentTime}
              onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Delay Minutes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Delay (minutes)
            </label>
            <input
              type="number"
              value={formData.delayMinutes}
              onChange={(e) => setFormData({ ...formData, delayMinutes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              placeholder="0"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresMaintenance}
                onChange={(e) => setFormData({ ...formData, requiresMaintenance: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">
                Requires Maintenance
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.affectsSchedule}
                onChange={(e) => setFormData({ ...formData, affectsSchedule: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">
                Affects Schedule
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.passengersAffected}
                onChange={(e) => setFormData({ ...formData, passengersAffected: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">
                Passengers Affected
              </span>
            </label>
          </div>

          {/* Affected Passenger Count */}
          {formData.passengersAffected && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Affected Passengers
              </label>
              <input
                type="number"
                value={formData.affectedPassengerCount}
                onChange={(e) => setFormData({ ...formData, affectedPassengerCount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                placeholder="0"
              />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Reporting...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  Report Incident
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncidentModal;