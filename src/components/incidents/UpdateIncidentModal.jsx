import React, { useState } from 'react';
import { X, CheckCircle, FileText } from 'lucide-react';
import incidentApiService from '../../services/incidentApiService';

const INCIDENT_STATUSES = {
  REPORTED: 'REPORTED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED'
};

const UpdateIncidentModal = ({ incident, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    status: incident.status,
    resolutionNotes: incident.resolutionNotes || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await incidentApiService.updateIncident(incident.id, formData);
      onSuccess();
    } catch (err) {
      setError('Failed to update incident: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RESOLVED': return 'border-green-600 bg-green-50 text-green-700';
      case 'IN_PROGRESS': return 'border-blue-600 bg-blue-50 text-blue-700';
      case 'ACKNOWLEDGED': return 'border-yellow-600 bg-yellow-50 text-yellow-700';
      case 'REPORTED': return 'border-orange-600 bg-orange-50 text-orange-700';
      case 'CANCELLED': return 'border-gray-600 bg-gray-50 text-gray-700';
      default: return 'border-gray-300 bg-white text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            Update Incident
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

          {/* Current Incident Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Incident</h3>
            <p className="text-gray-800 font-medium">{incident.incidentType.replace(/_/g, ' ')}</p>
            <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
          </div>

          {/* Status Update */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Update Status *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(INCIDENT_STATUSES).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: value })}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.status === value
                      ? getStatusColor(value)
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="text-xs font-medium">{value.replace('_', ' ')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              {formData.status === 'RESOLVED' ? 'Resolution Notes *' : 'Notes (Optional)'}
            </label>
            <textarea
              value={formData.resolutionNotes}
              onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder={
                formData.status === 'RESOLVED'
                  ? 'Describe how the incident was resolved...'
                  : 'Add any notes or updates...'
              }
              required={formData.status === 'RESOLVED'}
            />
          </div>

          {/* Info Message */}
          {formData.status === 'RESOLVED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              ✓ Marking this incident as resolved will notify the reporter and close the incident.
            </div>
          )}

          {formData.status === 'ACKNOWLEDGED' && incident.status === 'REPORTED' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              ℹ️ Acknowledging this incident lets the reporter know it has been seen.
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
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Update Incident
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateIncidentModal;