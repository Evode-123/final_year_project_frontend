import React, { useState, useEffect } from 'react';
import { 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Car,
  User,
  Clock,
  Eye,
  X,
  Filter,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckSquare
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';

const DailyChecksManagement = () => {
  const [allChecks, setAllChecks] = useState([]);
  const [filteredChecks, setFilteredChecks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    status: 'ALL', // ALL, GOOD, HAS_ISSUES, URGENT
    reviewed: 'ALL', // ALL, REVIEWED, UNREVIEWED
    problems: 'ALL', // ALL, WITH_PROBLEMS, NO_PROBLEMS
    dateRange: 'TODAY' // TODAY, WEEK, MONTH
  });

  const [reviewData, setReviewData] = useState({
    managerNotes: '',
    actionTaken: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, allChecks]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [todaysChecks, problemChecks, unreviewedChecks, dashboardData] = await Promise.all([
        transportApiService.getTodaysChecks(),
        transportApiService.getChecksWithProblems(),
        transportApiService.getUnreviewedProblems(),
        transportApiService.getDailyChecksDashboard()
      ]);

      // Combine and deduplicate checks
      const checksMap = new Map();
      [...todaysChecks, ...problemChecks, ...unreviewedChecks].forEach(check => {
        checksMap.set(check.id, check);
      });
      
      const combined = Array.from(checksMap.values());
      setAllChecks(combined);
      setDashboard(dashboardData);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allChecks];

    // Status filter
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(c => c.overallStatus === filters.status);
    }

    // Reviewed filter
    if (filters.reviewed === 'REVIEWED') {
      filtered = filtered.filter(c => c.reviewed);
    } else if (filters.reviewed === 'UNREVIEWED') {
      filtered = filtered.filter(c => !c.reviewed);
    }

    // Problems filter
    if (filters.problems === 'WITH_PROBLEMS') {
      filtered = filtered.filter(c => c.hasProblems);
    } else if (filters.problems === 'NO_PROBLEMS') {
      filtered = filtered.filter(c => !c.hasProblems);
    }

    // Date range filter
    const now = new Date();
    if (filters.dateRange === 'TODAY') {
      filtered = filtered.filter(c => {
        const checkDate = new Date(c.checkDate);
        return checkDate.toDateString() === now.toDateString();
      });
    } else if (filters.dateRange === 'WEEK') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(c => new Date(c.checkDate) >= weekAgo);
    } else if (filters.dateRange === 'MONTH') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(c => new Date(c.checkDate) >= monthAgo);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredChecks(filtered);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await transportApiService.reviewCheck(selectedCheck.id, reviewData);
      setSuccess('✅ Check reviewed successfully!');
      setShowReviewModal(false);
      setSelectedCheck(null);
      setReviewData({ managerNotes: '', actionTaken: '' });
      await loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to review check: ' + err.message);
    }
  };

  const openReviewModal = (check) => {
    setSelectedCheck(check);
    setReviewData({
      managerNotes: check.managerNotes || '',
      actionTaken: check.actionTaken || ''
    });
    setShowReviewModal(true);
  };

  const openDetailModal = (check) => {
    setSelectedCheck(check);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'GOOD':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'HAS_ISSUES':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'GOOD':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'HAS_ISSUES':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'URGENT':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-blue-600" />
            Daily Checks Management
          </h1>
          <p className="text-gray-600 mt-1">Review and manage vehicle daily inspections</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
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

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Checks</span>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-800">
            {dashboard?.totalChecksToday || 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Today</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-700 text-sm font-semibold">All Good</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-700">
            {dashboard?.goodChecks || 0}
          </div>
          <p className="text-xs text-green-600 mt-1">No issues found</p>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-700 text-sm font-semibold">Has Issues</span>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-700">
            {dashboard?.checksWithIssues || 0}
          </div>
          <p className="text-xs text-yellow-600 mt-1">Needs attention</p>
        </div>

        <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-700 text-sm font-semibold">Unreviewed</span>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-700">
            {dashboard?.unreviewedProblemsCount || 0}
          </div>
          <p className="text-xs text-red-600 mt-1">Requires review</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-800">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="GOOD">✅ Good</option>
              <option value="HAS_ISSUES">⚠️ Has Issues</option>
              <option value="URGENT">🔴 Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Review Status</label>
            <select
              value={filters.reviewed}
              onChange={(e) => setFilters({ ...filters, reviewed: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All</option>
              <option value="REVIEWED">✅ Reviewed</option>
              <option value="UNREVIEWED">❌ Unreviewed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Problems</label>
            <select
              value={filters.problems}
              onChange={(e) => setFilters({ ...filters, problems: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All</option>
              <option value="WITH_PROBLEMS">⚠️ With Problems</option>
              <option value="NO_PROBLEMS">✅ No Problems</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODAY">📅 Today</option>
              <option value="WEEK">📅 Last 7 Days</option>
              <option value="MONTH">📅 Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Checks Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            Daily Checks ({filteredChecks.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Vehicle</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Driver</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Problems</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Safe</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Reviewed</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredChecks.length > 0 ? (
                filteredChecks.map((check) => (
                  <tr key={check.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-800">
                            {new Date(check.checkDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(check.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-semibold text-gray-800">{check.vehiclePlateNo}</div>
                          <div className="text-xs text-gray-500">{check.vehicleType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-800">{check.driverName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(check.overallStatus)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(check.overallStatus)}`}>
                          {check.overallStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {check.hasProblems ? (
                        <div>
                          <span className="text-red-600 font-semibold">Yes</span>
                          {check.urgencyLevel && (
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              check.urgencyLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                              check.urgencyLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                              check.urgencyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {check.urgencyLevel}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-green-600">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={check.isSafeToDrive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {check.isSafeToDrive ? "✓ Yes" : "✗ No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {check.reviewed ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">No</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailModal(check)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!check.reviewed && (
                          <button
                            onClick={() => openReviewModal(check)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Review
                          </button>
                        )}
                        {check.reviewed && check.hasProblems && (
                          <button
                            onClick={() => openReviewModal(check)}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors font-medium"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No checks found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedCheck.reviewed ? 'Update Review' : 'Review Check'}
                </h2>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedCheck(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Check Summary */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Vehicle:</span>
                    <p className="text-gray-800 font-semibold">{selectedCheck.vehiclePlateNo}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Driver:</span>
                    <p className="text-gray-800 font-semibold">{selectedCheck.driverName}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Status:</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedCheck.overallStatus)}`}>
                      {selectedCheck.overallStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Safe to Drive:</span>
                    <p className={selectedCheck.isSafeToDrive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                      {selectedCheck.isSafeToDrive ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                {selectedCheck.hasProblems && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-blue-700 font-medium mb-2">⚠️ Problems Reported:</p>
                    <p className="text-gray-700 bg-white p-3 rounded border border-blue-200">
                      {selectedCheck.problemsDescription}
                    </p>
                    {selectedCheck.urgencyLevel && (
                      <p className="text-sm text-blue-700 mt-2">
                        Urgency Level: <span className="font-semibold">{selectedCheck.urgencyLevel}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Review Form */}
              <form onSubmit={handleReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Manager Notes *
                  </label>
                  <textarea
                    value={reviewData.managerNotes}
                    onChange={(e) => setReviewData({ ...reviewData, managerNotes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Enter your review notes and observations..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Action Taken *
                  </label>
                  <textarea
                    value={reviewData.actionTaken}
                    onChange={(e) => setReviewData({ ...reviewData, actionTaken: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Describe the action taken or planned..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                  >
                    {selectedCheck.reviewed ? 'Update Review' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false);
                      setSelectedCheck(null);
                    }}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Same as in DailyCheckHistory */}
      {showDetailModal && selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Check Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(selectedCheck.checkDate).toLocaleDateString()} at{' '}
                {new Date(selectedCheck.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Vehicle:</span>
                  <p className="font-semibold text-gray-800">{selectedCheck.vehiclePlateNo}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Driver:</span>
                  <p className="font-semibold text-gray-800">{selectedCheck.driverName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Location:</span>
                  <p className="font-semibold text-gray-800">{selectedCheck.checkLocation || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedCheck.overallStatus)}`}>
                    {selectedCheck.overallStatus}
                  </span>
                </div>
              </div>

              {/* Check Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Check Items</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'tiresOk', label: 'Tires' },
                    { key: 'lightsOk', label: 'Lights' },
                    { key: 'brakesOk', label: 'Brakes' },
                    { key: 'mirrorsOk', label: 'Mirrors' },
                    { key: 'windshieldOk', label: 'Windshield' },
                    { key: 'wipersOk', label: 'Wipers' },
                    { key: 'cleanlinessOk', label: 'Clean' },
                    { key: 'fireExtinguisher', label: 'Fire Ext.' },
                    { key: 'firstAidKit', label: 'First Aid' },
                    { key: 'warningTriangle', label: 'Triangle' },
                    { key: 'oilLevelOk', label: 'Oil Level' },
                    { key: 'coolantLevelOk', label: 'Coolant' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      {selectedCheck[key] ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Problems */}
              {selectedCheck.hasProblems && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2">Problems Reported</h3>
                  <p className="text-gray-700 mb-2">{selectedCheck.problemsDescription}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={selectedCheck.isSafeToDrive ? "text-green-700" : "text-red-700"}>
                      Safe to Drive: {selectedCheck.isSafeToDrive ? "Yes" : "No"}
                    </span>
                    <span className="text-yellow-700">
                      Urgency: {selectedCheck.urgencyLevel}
                    </span>
                  </div>
                </div>
              )}

              {/* Driver Notes */}
              {selectedCheck.driverNotes && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Driver Notes</h3>
                  <p className="text-gray-700">{selectedCheck.driverNotes}</p>
                </div>
              )}

              {/* Manager Review */}
              {selectedCheck.reviewedAt && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">Manager Review</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-blue-700">Reviewed by:</span>
                      <span className="ml-2 text-gray-800">{selectedCheck.reviewedByEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Review date:</span>
                      <span className="ml-2 text-gray-800">
                        {new Date(selectedCheck.reviewedAt).toLocaleString()}
                      </span>
                    </div>
                    {selectedCheck.managerNotes && (
                      <div>
                        <span className="text-blue-700">Notes:</span>
                        <p className="mt-1 text-gray-700">{selectedCheck.managerNotes}</p>
                      </div>
                    )}
                    {selectedCheck.actionTaken && (
                      <div>
                        <span className="text-blue-700">Action Taken:</span>
                        <p className="mt-1 text-gray-700">{selectedCheck.actionTaken}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyChecksManagement;