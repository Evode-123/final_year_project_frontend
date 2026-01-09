import React, { useState, useEffect } from 'react';
import { Play, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const TripGenerationPanel = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      const status = await transportApiService.getSystemStatus();
      setSystemStatus(status);
    } catch (err) {
      setError('Failed to load system status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeTrips = async () => {
    if (!window.confirm('This will generate trips for the next 3 days. Continue?')) return;

    setError('');
    setSuccess('');
    setGenerating(true);

    try {
      const response = await transportApiService.initializeTrips();
      setSuccess(`Successfully generated ${response.totalTripsGenerated} trips!`);
      await loadSystemStatus();
    } catch (err) {
      setError('Failed to initialize trips: ' + err.message);
    } finally {
      setGenerating(false);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Trip Generation</h2>
        <p className="text-gray-600 mt-1">Initialize and manage trip generation</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* System Configuration Status */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">System Configuration Status</h3>
        
        <div className="space-y-3">
          <StatusItem
            label="Routes"
            value={systemStatus?.routes || 0}
            isGood={systemStatus?.routes > 0}
          />
          <StatusItem
            label="Time Slots"
            value={systemStatus?.timeSlots || 0}
            isGood={systemStatus?.timeSlots > 0}
          />
          <StatusItem
            label="Vehicles"
            value={systemStatus?.vehicles || 0}
            isGood={systemStatus?.vehicles > 0}
          />
          <StatusItem
            label="Route-TimeSlot Assignments"
            value={systemStatus?.routeTimeSlotAssignments || 0}
            isGood={systemStatus?.routeTimeSlotAssignments > 0}
          />
          <StatusItem
            label="Route-Vehicle Assignments"
            value={systemStatus?.routeVehicleAssignments || 0}
            isGood={systemStatus?.routeVehicleAssignments > 0}
          />
        </div>

        {systemStatus?.warnings && systemStatus.warnings.length > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800 mb-2">Configuration Issues:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {systemStatus.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Trips Status */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Current Trips Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Today</div>
            <div className="text-3xl font-bold text-blue-600">
              {systemStatus?.tripsToday || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">trips scheduled</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Tomorrow</div>
            <div className="text-3xl font-bold text-green-600">
              {systemStatus?.tripsTomorrow || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">trips scheduled</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Day After</div>
            <div className="text-3xl font-bold text-purple-600">
              {systemStatus?.tripsDayAfter || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">trips scheduled</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Total Upcoming Trips:</span>
            <span className="text-2xl font-bold text-gray-800">
              {systemStatus?.totalUpcomingTrips || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Actions</h3>
        
        <div className="space-y-4">
          {systemStatus?.canGenerateTrips ? (
            <button
              onClick={handleInitializeTrips}
              disabled={generating}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating Trips...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Initialize Trips (Next 3 Days)</span>
                </>
              )}
            </button>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-800">Cannot Generate Trips</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Please complete the system configuration first:
                  </p>
                  <ol className="list-decimal list-inside text-sm text-orange-700 mt-2 space-y-1">
                    <li>Create routes (Routes tab)</li>
                    <li>Create time slots (Routes tab)</li>
                    <li>Create vehicles (Vehicles tab)</li>
                    <li>Assign time slots to routes</li>
                    <li>Assign vehicles to routes</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={loadSystemStatus}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Automated Generation Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800">Automated Generation</p>
            <p className="text-sm text-blue-700 mt-1">
              After initial setup, trips are automatically generated every day at midnight for 2 days ahead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for status items
const StatusItem = ({ label, value, isGood }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <span className="text-gray-700 font-medium">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-gray-800">{value}</span>
      {isGood ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600" />
      )}
    </div>
  </div>
);

export default TripGenerationPanel;