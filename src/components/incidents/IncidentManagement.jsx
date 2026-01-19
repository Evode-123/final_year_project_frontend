import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Filter,
  Clock,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import incidentApiService from '../../services/incidentApiService';
import ReportIncidentModal from './ReportIncidentModal';
import IncidentDetailsModal from './IncidentDetailsModal';
import UpdateIncidentModal from './UpdateIncidentModal';

const IncidentManagement = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);

  const isManagement = user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.MANAGER;
  const isDriver = user?.role === USER_ROLES.DRIVER;

  useEffect(() => {
    loadData();
    if (isDriver) {
      loadUnviewedCount();
    }
  }, [filterStatus]);

  const loadUnviewedCount = async () => {
    try {
      const response = await incidentApiService.getUnviewedCount();
      setUnviewedCount(response.count || 0);
    } catch (err) {
      console.error('Failed to load unviewed count:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      let incidentData;
      if (isDriver) {
        // Drivers see their incidents based on filter
        switch (filterStatus) {
          case 'pending':
            incidentData = await incidentApiService.getMyPendingIncidents();
            break;
          case 'resolved':
            incidentData = await incidentApiService.getMyResolvedIncidents();
            break;
          default:
            incidentData = await incidentApiService.getMyIncidents();
        }
      } else {
        // Management sees incidents based on filter
        switch (filterStatus) {
          case 'unresolved':
            incidentData = await incidentApiService.getUnresolvedIncidents();
            break;
          case 'critical':
            incidentData = await incidentApiService.getCriticalIncidents();
            break;
          case 'today':
            incidentData = await incidentApiService.getTodayIncidents();
            break;
          default:
            incidentData = await incidentApiService.getAllIncidents();
        }
      }
      
      setIncidents(incidentData);

      // Load statistics for management
      if (isManagement) {
        const stats = await incidentApiService.getStatistics();
        setStatistics(stats);
      }
    } catch (err) {
      setError('Failed to load incidents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentReported = () => {
    setShowReportModal(false);
    setSuccess('Incident reported successfully!');
    setTimeout(() => setSuccess(''), 3000);
    loadData();
    if (isDriver) {
      loadUnviewedCount();
    }
  };

  const handleIncidentUpdated = () => {
    setShowUpdateModal(false);
    setSelectedIncident(null);
    setSuccess('Incident updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
    loadData();
  };

  const handleViewDetails = async (incident) => {
    setSelectedIncident(incident);
    setShowDetailsModal(true);
    
    // If driver is viewing their own incident with unviewed update, mark as viewed
    if (isDriver && incident.hasUnviewedStatusUpdate) {
      try {
        await incidentApiService.markIncidentAsViewed(incident.id);
        loadUnviewedCount();
        loadData(); // Refresh to update the badge
      } catch (err) {
        console.error('Failed to mark as viewed:', err);
      }
    }
  };

  const handleUpdateIncident = (incident) => {
    setSelectedIncident(incident);
    setShowUpdateModal(true);
  };

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            Incident Management
            {isDriver && unviewedCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                {unviewedCount} New Update{unviewedCount > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            {isDriver ? 'Report and track your incidents' : 'Monitor and manage all incidents'}
          </p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Report Incident
        </button>
      </div>

      {/* Alert Messages */}
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

      {/* Statistics Cards - Only for Management */}
      {isManagement && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Incidents</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{statistics.totalIncidents}</p>
              </div>
              <Activity className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unresolved</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{statistics.reportedIncidents}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{statistics.criticalIncidents}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Delay</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {statistics.averageDelayMinutes ? Math.round(statistics.averageDelayMinutes) : 0}m
                </p>
              </div>
              <Clock className="w-12 h-12 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-gray-600" />
          
          {isDriver ? (
            // Driver filter options
            <>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All My Incidents
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === 'resolved'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Resolved
              </button>
            </>
          ) : (
            // Management filter options
            <>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Incidents
              </button>
              <button
                onClick={() => setFilterStatus('unresolved')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === 'unresolved'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unresolved
              </button>
              <button
                onClick={() => setFilterStatus('critical')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === 'critical'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setFilterStatus('today')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
            </>
          )}
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {isDriver ? 'My Reported Incidents' : 'Incident Reports'} ({incidents.length})
          </h2>
        </div>

        {incidents.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No incidents to display</p>
            <p className="text-gray-400 text-sm mt-2">
              {isDriver ? 'You have not reported any incidents yet' : 'All clear! No incidents reported'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer relative ${
                  incident.hasUnviewedStatusUpdate && isDriver ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
                onClick={() => handleViewDetails(incident)}
              >
                {/* ✅ ONLY SHOW "New Update" BADGE FOR DRIVERS */}
                {incident.hasUnviewedStatusUpdate && isDriver && (
                  <div className="absolute top-4 right-4">
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                      <Eye className="w-3 h-3" />
                      New Update
                    </span>
                  </div>
                )}
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(incident.status)}`}>
                        {incident.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {incident.incidentType.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {incident.description}
                    </h3>

                    {/* ✅ SHOW RESOLUTION NOTES FOR DRIVERS */}
                    {isDriver && incident.resolutionNotes && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800 mb-1">
                          📝 Admin Response:
                        </p>
                        <p className="text-sm text-green-700">
                          {incident.resolutionNotes}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      {incident.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{incident.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(incident.incidentTime)}</span>
                      </div>

                      {incident.tripRoute && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>{incident.tripRoute}</span>
                        </div>
                      )}

                      {!isDriver && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{incident.reportedByName}</span>
                        </div>
                      )}
                    </div>

                    {incident.delayMinutes && incident.delayMinutes > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-800 rounded text-xs">
                        <AlertCircle className="w-3 h-3" />
                        Delay: {incident.delayMinutes} minutes
                      </div>
                    )}
                  </div>

                  {/* ✅ ONLY SHOW "Update Status" BUTTON FOR MANAGEMENT (NOT DRIVERS) */}
                  {isManagement && incident.status !== 'RESOLVED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateIncident(incident);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showReportModal && (
        <ReportIncidentModal
          onClose={() => setShowReportModal(false)}
          onSuccess={handleIncidentReported}
        />
      )}

      {showDetailsModal && selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedIncident(null);
          }}
        />
      )}

      {showUpdateModal && selectedIncident && (
        <UpdateIncidentModal
          incident={selectedIncident}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedIncident(null);
          }}
          onSuccess={handleIncidentUpdated}
        />
      )}
    </div>
  );
};

export default IncidentManagement;