import React from 'react';
import { X, MapPin, Clock, User, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

const IncidentDetailsModal = ({ incident, onClose }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'ACKNOWLEDGED': return 'bg-yellow-100 text-yellow-800';
      case 'REPORTED': return 'bg-orange-100 text-orange-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">Incident Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Severity */}
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getSeverityColor(incident.severity)}`}>
              {incident.severity}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(incident.status)}`}>
              {incident.status.replace('_', ' ')}
            </span>
          </div>

          {/* Incident Type and Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Incident Type</h3>
            <p className="text-lg text-gray-800">{incident.incidentType.replace(/_/g, ' ')}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Description</h3>
            <p className="text-gray-800">{incident.description}</p>
          </div>

          {/* Trip Information */}
          {incident.tripRoute && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Trip Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Route:</span>
                  <span className="ml-2 font-semibold text-gray-800">{incident.tripRoute}</span>
                </div>
                {incident.tripDate && (
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-semibold text-gray-800">{incident.tripDate}</span>
                  </div>
                )}
                {incident.tripTime && (
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <span className="ml-2 font-semibold text-gray-800">{incident.tripTime}</span>
                  </div>
                )}
                {incident.vehiclePlateNo && (
                  <div>
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="ml-2 font-semibold text-gray-800">{incident.vehiclePlateNo}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incident.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Location</h3>
                  <p className="text-gray-800">{incident.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <h3 className="text-sm font-semibold text-gray-600">Incident Time</h3>
                <p className="text-gray-800">{formatDateTime(incident.incidentTime)}</p>
              </div>
            </div>

            {incident.delayMinutes && incident.delayMinutes > 0 && (
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Delay</h3>
                  <p className="text-gray-800">{incident.delayMinutes} minutes</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <h3 className="text-sm font-semibold text-gray-600">Reported By</h3>
                <p className="text-gray-800">{incident.reportedByName}</p>
                <p className="text-sm text-gray-600">{incident.reportedByEmail}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <h3 className="text-sm font-semibold text-gray-600">Reported At</h3>
                <p className="text-gray-800">{formatDateTime(incident.reportedAt)}</p>
              </div>
            </div>

            {incident.driverName && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Driver</h3>
                  <p className="text-gray-800">{incident.driverName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-2">
            {incident.requiresMaintenance && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                ⚠️ Requires Maintenance
              </span>
            )}
            {incident.affectsSchedule && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                📅 Affects Schedule
              </span>
            )}
            {incident.passengersAffected && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                👥 Passengers Affected {incident.affectedPassengerCount && `(${incident.affectedPassengerCount})`}
              </span>
            )}
          </div>

          {/* Resolution Information */}
          {incident.status === 'RESOLVED' && incident.resolutionNotes && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-700">Resolution</h3>
              </div>
              <p className="text-gray-800 mb-3">{incident.resolutionNotes}</p>
              <div className="text-sm text-gray-600">
                Resolved by {incident.resolvedByName} on {formatDateTime(incident.resolvedAt)}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailsModal;