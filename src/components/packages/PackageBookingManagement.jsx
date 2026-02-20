import React, { useState, useEffect } from 'react';
import { 
  Package as PackageIcon, 
  Search, 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  CheckCircle,
  AlertCircle,
  Send,
  Weight,
  DollarSign,
  Home
} from 'lucide-react';
import transportApiService from '../../services/transportApiService';
import packageApiService from '../../services/packageApiService';

const PAYMENT_METHODS = {
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY',
  CARD: 'CARD'
};

// ── Validators ──────────────────────────────────────────────
const validators = {
  senderNames: (v) => {
    if (!v.trim()) return 'Sender full name is required.';
    if (v.trim().length < 3) return 'Name must be at least 3 characters.';
    if (v.length > 70) return 'Name cannot exceed 70 characters.';
    if (!/^[a-zA-Z\s'-]+$/.test(v)) return 'Only letters, spaces, hyphens, or apostrophes.';
    if (!v.trim().includes(' ')) return 'Please enter both first and last name.';
    return '';
  },
  senderPhone: (v) => {
    if (!v.trim()) return 'Sender phone is required.';
    if (!/^\d+$/.test(v)) return 'Phone must contain digits only.';
    if (v.length !== 10) return 'Phone must be exactly 10 digits.';
    if (!v.startsWith('07')) return 'Phone must start with 07.';
    return '';
  },
  senderEmail: (v) => {
    if (!v.trim()) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
  },
  senderAddress: (v) => {
    if (!v.trim()) return '';
    if (v.length > 100) return 'Address cannot exceed 100 characters.';
    return '';
  },
  receiverNames: (v) => {
    if (!v.trim()) return 'Receiver full name is required.';
    if (v.trim().length < 3) return 'Name must be at least 3 characters.';
    if (v.length > 70) return 'Name cannot exceed 70 characters.';
    if (!/^[a-zA-Z\s'-]+$/.test(v)) return 'Only letters, spaces, hyphens, or apostrophes.';
    if (!v.trim().includes(' ')) return 'Please enter both first and last name.';
    return '';
  },
  receiverPhone: (v) => {
    if (!v.trim()) return 'Receiver phone is required.';
    if (!/^\d+$/.test(v)) return 'Phone must contain digits only.';
    if (v.length !== 10) return 'Phone must be exactly 10 digits.';
    if (!v.startsWith('07')) return 'Phone must start with 07.';
    return '';
  },
  receiverEmail: (v) => {
    if (!v.trim()) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
  },
  receiverIdNumber: (v) => {
    if (!v.trim()) return 'Receiver National ID is required.';
    if (!/^\d+$/.test(v)) return 'ID must contain digits only.';
    if (v.length !== 16) return 'ID must be exactly 16 digits.';
    return '';
  },
  receiverAddress: (v) => {
    if (!v.trim()) return '';
    if (v.length > 100) return 'Address cannot exceed 100 characters.';
    return '';
  },
  packageWeight: (v) => {
    if (!v) return 'Package weight is required.';
    if (parseFloat(v) <= 0) return 'Weight must be greater than 0.';
    if (parseFloat(v) > 500) return 'Weight cannot exceed 500 kg.';
    return '';
  },
  paymentMethod: (v) => {
    if (!v) return 'Please select a payment method.';
    return '';
  },
};

const validate = (field, value) => {
  const fn = validators[field];
  return fn ? fn(value) : '';
};

const PackageBookingManagement = () => {
  const [availableTrips, setAvailableTrips] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('book');

  const [searchData, setSearchData] = useState({
    origin: '',
    destination: '',
    travelDate: new Date().toISOString().split('T')[0]
  });

  const emptyForm = {
    senderNames: '', senderPhone: '', senderEmail: '', senderIdNumber: '', senderAddress: '',
    receiverNames: '', receiverPhone: '', receiverEmail: '', receiverIdNumber: '', receiverAddress: '',
    packageDescription: '', packageWeight: '', packageValue: '', isFragile: false, paymentMethod: ''
  };

  const [packageData, setPackageData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [trips, routesData] = await Promise.all([
        transportApiService.getAvailableTrips(),
        transportApiService.getAllRoutes()
      ]);
      setAvailableTrips(trips);
      setRoutes(routesData);
      setOrigins([...new Set(routesData.map(r => r.origin))].sort());
      setDestinations([...new Set(routesData.map(r => r.destination))].sort());
      await loadBookingHistory();
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBookingHistory = async () => {
    try {
      const [inTransit, arrived, collected] = await Promise.all([
        packageApiService.getInTransitPackages(),
        packageApiService.getArrivedPackages(),
        packageApiService.getCollectedPackages()
      ]);
      const all = [...inTransit, ...arrived, ...collected];
      all.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
      setBookingHistory(all);
    } catch (err) {
      console.error('Failed to load booking history:', err);
    }
  };

  // ── Field change handler with validation ──
  const handleChange = (field, value) => {
    setPackageData(prev => ({ ...prev, [field]: value }));
    const err = validate(field, value);
    setFormErrors(prev => ({ ...prev, [field]: err }));
  };

  // ── Controlled input handlers ──
  const handleNamesChange = (field) => (e) => {
    const raw = e.target.value.replace(/[^a-zA-Z\s'-]/g, '').slice(0, 70);
    handleChange(field, raw);
  };

  const handlePhoneChange = (field) => (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (raw.length >= 2 && !raw.startsWith('07')) return;
    handleChange(field, raw);
  };

  const handleIdChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    handleChange('receiverIdNumber', raw);
  };

  const runAllValidations = () => {
    const requiredFields = ['senderNames', 'senderPhone', 'senderEmail', 'senderAddress',
      'receiverNames', 'receiverPhone', 'receiverEmail', 'receiverIdNumber', 'receiverAddress',
      'packageWeight', 'paymentMethod'];
    const errors = {};
    requiredFields.forEach(f => {
      const err = validate(f, packageData[f] ?? '');
      if (err) errors[f] = err;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSearchTrips = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const trips = await transportApiService.searchTrips(searchData);
      setAvailableTrips(trips);
      setSuccess(`Found ${trips.length} available trip(s)`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to search trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = async () => {
    setError(''); setSuccess('');
    setSearchData({ origin: '', destination: '', travelDate: new Date().toISOString().split('T')[0] });
    try {
      setLoading(true);
      const trips = await transportApiService.getAvailableTrips();
      setAvailableTrips(trips);
    } catch (err) {
      setError('Failed to load trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    setShowBookingForm(true);
  };

  const calculateEstimatedPrice = () => {
    if (!packageData.packageWeight || !selectedTrip) return 'TBD';
    const weight = parseFloat(packageData.packageWeight);
    const total = weight * 1000 + parseFloat(selectedTrip.price) * 0.30;
    return Math.max(total, 2000).toFixed(0);
  };

  const handleBookPackage = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!selectedTrip) { setError('Please select a trip first'); return; }
    if (!runAllValidations()) { setError('Please fix the errors below before submitting.'); return; }

    try {
      setBookingLoading(true);
      const bookingData = {
        ...packageData,
        dailyTripId: selectedTrip.dailyTripId,
        packageWeight: parseFloat(packageData.packageWeight),
        packageValue: packageData.packageValue ? parseFloat(packageData.packageValue) : null
      };
      const result = await packageApiService.bookPackage(bookingData);
      setSuccess(`Package booked! Tracking: ${result.trackingNumber}. Sender & receiver notified.`);
      resetForm();
      await loadInitialData();
      setTimeout(() => setViewMode('history'), 2000);
    } catch (err) {
      setError('Failed to book package: ' + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const resetForm = () => {
    setPackageData(emptyForm);
    setFormErrors({});
    setSelectedTrip(null);
    setShowBookingForm(false);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // ── Reusable FieldError ──
  const FieldError = ({ field }) => formErrors[field] ? (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {formErrors[field]}
    </p>
  ) : null;

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
      formErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  const inputWithIconClass = (field) =>
    `w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
      formErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  if (loading && availableTrips.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Package Booking</h1>
            <p className="text-gray-600 mt-1">Book packages for delivery on scheduled trips</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('book')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              viewMode === 'book' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PackageIcon className="w-5 h-5" /> Book New Package
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              viewMode === 'history' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Search className="w-5 h-5" /> Booking History ({bookingHistory.length})
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

      {/* Booking History View */}
      {viewMode === 'history' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">All Bookings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Tracking #', 'Status', 'Sender', 'Receiver', 'Route', 'Booking Date', 'Price'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookingHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <PackageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No bookings yet</p>
                      <button onClick={() => setViewMode('book')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Book Your First Package
                      </button>
                    </td>
                  </tr>
                ) : bookingHistory.map((pkg) => {
                  const badges = {
                    'IN_TRANSIT': { color: 'bg-blue-100 text-blue-800', icon: '🚚', text: 'In Transit' },
                    'ARRIVED': { color: 'bg-yellow-100 text-yellow-800', icon: '📍', text: 'Arrived' },
                    'COLLECTED': { color: 'bg-green-100 text-green-800', icon: '✅', text: 'Collected' },
                    'CANCELLED': { color: 'bg-red-100 text-red-800', icon: '❌', text: 'Cancelled' }
                  };
                  const badge = badges[pkg.packageStatus] || badges['IN_TRANSIT'];
                  return (
                    <tr key={pkg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{pkg.trackingNumber}</div>
                        <div className="text-xs text-gray-500">{pkg.packageWeight}kg</div>
                        {pkg.isFragile && <div className="text-xs text-orange-600">⚠️ Fragile</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                          {badge.icon} {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{pkg.senderNames}</div>
                        <div className="text-xs text-gray-600">{pkg.senderPhone}</div>
                        {pkg.senderAddress && <div className="text-xs text-gray-500">{pkg.senderAddress}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{pkg.receiverNames}</div>
                        <div className="text-xs text-gray-600">{pkg.receiverPhone}</div>
                        {pkg.receiverAddress && <div className="text-xs text-gray-500">{pkg.receiverAddress}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{pkg.origin} → {pkg.destination}</div>
                        <div className="text-xs text-gray-600">{new Date(pkg.travelDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{new Date(pkg.bookingDate).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-600">{new Date(pkg.bookingDate).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-800">{pkg.price?.toLocaleString()} RWF</div>
                        <div className="text-xs text-gray-600">{pkg.paymentMethod}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {bookingHistory.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-gray-600">Total:</span> <span className="ml-2 font-semibold">{bookingHistory.length}</span></div>
                <div><span className="text-gray-600">In Transit:</span> <span className="ml-2 font-semibold text-blue-600">{bookingHistory.filter(p => p.packageStatus === 'IN_TRANSIT').length}</span></div>
                <div><span className="text-gray-600">Arrived:</span> <span className="ml-2 font-semibold text-yellow-600">{bookingHistory.filter(p => p.packageStatus === 'ARRIVED').length}</span></div>
                <div><span className="text-gray-600">Collected:</span> <span className="ml-2 font-semibold text-green-600">{bookingHistory.filter(p => p.packageStatus === 'COLLECTED').length}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Book New Package View */}
      {viewMode === 'book' && (
        <>
          {/* Filter */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">Filter Available Trips</h2>
            </div>
            <form onSubmit={handleSearchTrips} className="grid grid-cols-1 md:grid-cols-7 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Origin</label>
                <select value={searchData.origin} onChange={(e) => setSearchData({ ...searchData, origin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">All Origins</option>
                  {origins.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Destination</label>
                <select value={searchData.destination} onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">All Destinations</option>
                  {destinations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Travel Date</label>
                <input type="date" value={searchData.travelDate} onChange={(e) => setSearchData({ ...searchData, travelDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-1 flex flex-col gap-2 items-end justify-end">
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <Search className="w-5 h-5" /> Filter
                </button>
                <button type="button" onClick={handleClearFilter}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  <X className="w-4 h-4" /> Clear
                </button>
              </div>
            </form>
          </div>

          {/* Available Trips */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Available Trips ({availableTrips.length})</h2>
              <p className="text-sm text-gray-600 mt-1">Select a trip to book your package</p>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : availableTrips.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No trips available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableTrips.map((trip) => (
                    <div key={trip.dailyTripId} onClick={() => handleSelectTrip(trip)}
                      className="border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-gray-800">{trip.origin} → {trip.destination}</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{formatDate(trip.tripDate)}</span></div>
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{trip.departureTime}</span></div>
                        <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" /><span className="font-bold text-blue-600">RWF {trip.price}</span></div>
                        <div className="text-xs">{trip.availableSeats}/{trip.totalSeats} seats available</div>
                      </div>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Select Trip
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Compact Booking Modal (DriversManagement style) ── */}
      {showBookingForm && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-lg font-bold text-gray-800">Book Package for Delivery</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookPackage} className="p-5 space-y-5">

              {/* Selected Trip */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-0.5">Selected Trip</p>
                  <p className="font-semibold text-gray-800 text-sm">{selectedTrip.origin} → {selectedTrip.destination}</p>
                  <p className="text-xs text-gray-600">{formatDate(selectedTrip.tripDate)} at {selectedTrip.departureTime}</p>
                </div>
                <button type="button" onClick={() => { setSelectedTrip(null); setShowBookingForm(false); }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline">Change</button>
              </div>

              {/* ── Sender Information ── */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Sender Information
                </p>
                <div className="grid grid-cols-2 gap-3">

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={packageData.senderNames}
                      onChange={handleNamesChange('senderNames')}
                      className={inputClass('senderNames')} placeholder="John Doe" maxLength={70} />
                    <FieldError field="senderNames" />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input type="tel" value={packageData.senderPhone}
                        onChange={handlePhoneChange('senderPhone')}
                        className={inputWithIconClass('senderPhone')} placeholder="07XXXXXXXX" maxLength={10} />
                    </div>
                    <div className="flex items-center justify-between">
                      <FieldError field="senderPhone" />
                      <span className={`text-xs ml-auto ${packageData.senderPhone.length === 10 ? 'text-green-500' : 'text-gray-400'}`}>
                        {packageData.senderPhone.length}/10
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Optional)</label>
                    <input type="email" value={packageData.senderEmail}
                      onChange={(e) => handleChange('senderEmail', e.target.value)}
                      className={inputClass('senderEmail')} placeholder="sender@email.com" />
                    <FieldError field="senderEmail" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ID Number (Optional)</label>
                    <input type="text" value={packageData.senderIdNumber}
                      onChange={(e) => setPackageData({ ...packageData, senderIdNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                      className={inputClass('senderIdNumber')} placeholder="16-digit ID" maxLength={16} />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <span className="flex items-center gap-1"><Home className="w-3 h-3" /> Address (Optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                      <textarea value={packageData.senderAddress}
                        onChange={(e) => handleChange('senderAddress', e.target.value.slice(0, 100))}
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none ${formErrors.senderAddress ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Sender's address" rows="2" maxLength={100} />
                    </div>
                    <div className="flex items-center justify-between">
                      <FieldError field="senderAddress" />
                      <span className={`text-xs ml-auto ${packageData.senderAddress.length >= 100 ? 'text-red-500' : 'text-gray-400'}`}>
                        {packageData.senderAddress.length}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Receiver Information ── */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Receiver Information
                </p>
                <div className="grid grid-cols-2 gap-3">

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={packageData.receiverNames}
                      onChange={handleNamesChange('receiverNames')}
                      className={inputClass('receiverNames')} placeholder="Jane Doe" maxLength={70} />
                    <FieldError field="receiverNames" />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input type="tel" value={packageData.receiverPhone}
                        onChange={handlePhoneChange('receiverPhone')}
                        className={inputWithIconClass('receiverPhone')} placeholder="07XXXXXXXX" maxLength={10} />
                    </div>
                    <div className="flex items-center justify-between">
                      <FieldError field="receiverPhone" />
                      <span className={`text-xs ml-auto ${packageData.receiverPhone.length === 10 ? 'text-green-500' : 'text-gray-400'}`}>
                        {packageData.receiverPhone.length}/10
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Optional)</label>
                    <input type="email" value={packageData.receiverEmail}
                      onChange={(e) => handleChange('receiverEmail', e.target.value)}
                      className={inputClass('receiverEmail')} placeholder="receiver@email.com" />
                    <FieldError field="receiverEmail" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      National ID * <AlertCircle className="w-3 h-3 text-yellow-600" />
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input type="text" value={packageData.receiverIdNumber}
                        onChange={handleIdChange}
                        className={inputWithIconClass('receiverIdNumber')} placeholder="1234567890123456" maxLength={16} />
                    </div>
                    <div className="flex items-center justify-between">
                      <FieldError field="receiverIdNumber" />
                      <span className={`text-xs ml-auto ${packageData.receiverIdNumber.length === 16 ? 'text-green-500' : 'text-gray-400'}`}>
                        {packageData.receiverIdNumber.length}/16
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <span className="flex items-center gap-1"><Home className="w-3 h-3" /> Address (Optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                      <textarea value={packageData.receiverAddress}
                        onChange={(e) => handleChange('receiverAddress', e.target.value.slice(0, 100))}
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none ${formErrors.receiverAddress ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Receiver's address" rows="2" maxLength={100} />
                    </div>
                    <div className="flex items-center justify-between">
                      <FieldError field="receiverAddress" />
                      <span className={`text-xs ml-auto ${packageData.receiverAddress.length >= 100 ? 'text-red-500' : 'text-gray-400'}`}>
                        {packageData.receiverAddress.length}/100
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
                  ⚠️ Receiver must present this National ID to collect the package
                </div>
              </div>

              {/* ── Package Details ── */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1">
                  <PackageIcon className="w-3.5 h-3.5" /> Package Details
                </p>
                <div className="grid grid-cols-2 gap-3">

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                    <textarea value={packageData.packageDescription}
                      onChange={(e) => setPackageData({ ...packageData, packageDescription: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                      placeholder="e.g., Electronics, Documents, Clothing..." rows="2" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg) *</label>
                    <div className="relative">
                      <Weight className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input type="number" step="0.1" value={packageData.packageWeight}
                        onChange={(e) => handleChange('packageWeight', e.target.value)}
                        className={inputWithIconClass('packageWeight')} placeholder="2.5" />
                    </div>
                    <FieldError field="packageWeight" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Declared Value (RWF)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input type="number" value={packageData.packageValue}
                        onChange={(e) => setPackageData({ ...packageData, packageValue: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="50000" />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={packageData.isFragile}
                        onChange={(e) => setPackageData({ ...packageData, isFragile: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                      <span className="text-xs font-semibold text-gray-700">⚠️ Fragile Package — Handle with care</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Payment Method ── */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">Payment Method *</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                    <button key={key} type="button"
                      onClick={() => handleChange('paymentMethod', value)}
                      className={`p-2.5 rounded-lg border-2 transition-colors text-sm ${
                        packageData.paymentMethod === value
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                      }`}>
                      <CreditCard className="w-4 h-4 mx-auto mb-1" />
                      {value.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <FieldError field="paymentMethod" />
              </div>

              {/* Price Estimate */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Estimated Price</p>
                  <p className="text-xs text-gray-500">Min charge: RWF 2,000</p>
                </div>
                <span className="text-2xl font-bold text-green-600">RWF {calculateEstimatedPrice()}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t">
                <button type="submit" disabled={bookingLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium">
                  {bookingLoading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Booking...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Book Package</>
                  )}
                </button>
                <button type="button" onClick={resetForm} disabled={bookingLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50">
                  Cancel
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">📱 Automatic Notifications:</p>
                <p>Sender & receiver notified via Email on booking, arrival, and collection.</p>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageBookingManagement;