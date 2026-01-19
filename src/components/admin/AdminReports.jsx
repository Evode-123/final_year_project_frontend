import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Car,
  Package,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Filter,
  X,
  Loader,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import transportApiService from '../../services/transportApiService';
import feedbackApiService from '../../services/feedbackApiService';
import incidentApiService from '../../services/incidentApiService';
import packageApiService from '../../services/packageApiService';

const AdminReports = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Report data states
  const [overviewData, setOverviewData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [operationalData, setOperationalData] = useState(null);
  const [safetyData, setSafetyData] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  useEffect(() => {
    loadReportData();
  }, [selectedReport, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    setError('');
    
    try {
      switch (selectedReport) {
        case 'overview':
          await loadOverviewData();
          break;
        case 'financial':
          await loadFinancialData();
          break;
        case 'operational':
          await loadOperationalData();
          break;
        case 'safety':
          await loadSafetyData();
          break;
        case 'customer':
          await loadCustomerData();
          break;
        default:
          await loadOverviewData();
      }
    } catch (err) {
      setError('Failed to load report data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewData = async () => {
    try {
      const [bookings, vehicles, drivers, routes, packages, feedback, incidents] = await Promise.all([
        transportApiService.getAllBookingsHistory(),
        transportApiService.getAllVehicles(),
        transportApiService.getAllDrivers(),
        transportApiService.getAllRoutes(),
        packageApiService.getAllPackages(),
        feedbackApiService.getAllFeedback(),
        incidentApiService.getAllIncidents()
      ]);

      // Calculate metrics
      const totalRevenue = bookings
        .filter(b => b.paymentStatus === 'PAID')
        .reduce((sum, b) => sum + parseFloat(b.price || 0), 0);

      const activeVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
      const activeDrivers = drivers.filter(d => d.status === 'ACTIVE').length;
      
      const confirmedBookings = bookings.filter(b => b.bookingStatus === 'CONFIRMED').length;
      const cancelledBookings = bookings.filter(b => b.bookingStatus === 'CANCELLED').length;
      const cancellationRate = bookings.length > 0 
        ? ((cancelledBookings / bookings.length) * 100).toFixed(1)
        : 0;

      const deliveredPackages = packages.filter(p => p.packageStatus === 'COLLECTED').length;
      const inTransitPackages = packages.filter(p => p.packageStatus === 'IN_TRANSIT').length;

      const avgRating = feedback.length > 0
        ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
        : 0;

      const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL').length;
      const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED').length;

      setOverviewData({
        totalRevenue,
        totalBookings: bookings.length,
        confirmedBookings,
        cancelledBookings,
        cancellationRate,
        totalVehicles: vehicles.length,
        activeVehicles,
        totalDrivers: drivers.length,
        activeDrivers,
        totalRoutes: routes.length,
        totalPackages: packages.length,
        deliveredPackages,
        inTransitPackages,
        avgRating,
        totalFeedback: feedback.length,
        totalIncidents: incidents.length,
        criticalIncidents,
        resolvedIncidents
      });
    } catch (error) {
      throw error;
    }
  };

  const loadFinancialData = async () => {
    try {
      const bookings = await transportApiService.getAllBookingsHistory();
      const packages = await packageApiService.getAllPackages();

      // Filter by date range
      const filteredBookings = bookings.filter(b => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= new Date(dateRange.startDate) && 
               bookingDate <= new Date(dateRange.endDate);
      });

      const filteredPackages = packages.filter(p => {
        const bookingDate = new Date(p.bookingDate);
        return bookingDate >= new Date(dateRange.startDate) && 
               bookingDate <= new Date(dateRange.endDate);
      });

      // Calculate revenue
      const bookingRevenue = filteredBookings
        .filter(b => b.paymentStatus === 'PAID')
        .reduce((sum, b) => sum + parseFloat(b.price || 0), 0);

      const packageRevenue = filteredPackages
        .filter(p => p.paymentStatus === 'PAID')
        .reduce((sum, p) => sum + parseFloat(p.price || 0), 0);

      const totalRevenue = bookingRevenue + packageRevenue;

      // Payment methods breakdown
      const paymentMethods = {};
      [...filteredBookings, ...filteredPackages].forEach(item => {
        if (item.paymentStatus === 'PAID') {
          paymentMethods[item.paymentMethod] = 
            (paymentMethods[item.paymentMethod] || 0) + parseFloat(item.price || 0);
        }
      });

      // Revenue by route
      const revenueByRoute = {};
      filteredBookings.forEach(b => {
        if (b.paymentStatus === 'PAID' && b.dailyTrip?.route) {
          const routeKey = `${b.dailyTrip.route.origin} - ${b.dailyTrip.route.destination}`;
          revenueByRoute[routeKey] = (revenueByRoute[routeKey] || 0) + parseFloat(b.price || 0);
        }
      });

      // Daily revenue trend
      const dailyRevenue = {};
      [...filteredBookings, ...filteredPackages].forEach(item => {
        if (item.paymentStatus === 'PAID') {
          const date = new Date(item.bookingDate).toLocaleDateString();
          dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(item.price || 0);
        }
      });

      setFinancialData({
        totalRevenue,
        bookingRevenue,
        packageRevenue,
        totalTransactions: filteredBookings.length + filteredPackages.length,
        paymentMethods,
        revenueByRoute,
        dailyRevenue
      });
    } catch (error) {
      throw error;
    }
  };

  const loadOperationalData = async () => {
    try {
      const [bookings, vehicles, drivers] = await Promise.all([
        transportApiService.getAllBookingsHistory(),
        transportApiService.getAllVehicles(),
        transportApiService.getAllDrivers()
      ]);

      // Filter by date range
      const filteredBookings = bookings.filter(b => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= new Date(dateRange.startDate) && 
               bookingDate <= new Date(dateRange.endDate);
      });

      // Trip completion rate
      const completedTrips = filteredBookings.filter(b => 
        b.bookingStatus === 'CONFIRMED' && 
        new Date(b.dailyTrip?.tripDate) < new Date()
      ).length;

      const totalTrips = filteredBookings.length;
      const completionRate = totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(1) : 0;

      // Vehicle utilization
      const vehicleUtilization = {};
      filteredBookings.forEach(b => {
        if (b.dailyTrip?.vehicle) {
          const plateNo = b.dailyTrip.vehicle.plateNo;
          vehicleUtilization[plateNo] = (vehicleUtilization[plateNo] || 0) + 1;
        }
      });

      // Most popular routes
      const routePopularity = {};
      filteredBookings.forEach(b => {
        if (b.dailyTrip?.route) {
          const routeKey = `${b.dailyTrip.route.origin} - ${b.dailyTrip.route.destination}`;
          routePopularity[routeKey] = (routePopularity[routeKey] || 0) + 1;
        }
      });

      // Peak booking times
      const hourlyBookings = {};
      filteredBookings.forEach(b => {
        const hour = new Date(b.bookingDate).getHours();
        hourlyBookings[hour] = (hourlyBookings[hour] || 0) + 1;
      });

      setOperationalData({
        totalTrips,
        completedTrips,
        completionRate,
        vehicleUtilization,
        routePopularity,
        hourlyBookings,
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter(v => v.status === 'AVAILABLE').length,
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter(d => d.status === 'ACTIVE').length
      });
    } catch (error) {
      throw error;
    }
  };

  const loadSafetyData = async () => {
    try {
      const [inspectionDashboard, dailyChecksDashboard, incidents] = await Promise.all([
        transportApiService.getInspectionDashboard(),
        transportApiService.getDailyChecksDashboard(),
        incidentApiService.getAllIncidents()
      ]);

      // Filter incidents by date range
      const filteredIncidents = incidents.filter(i => {
        const incidentDate = new Date(i.incidentTime);
        return incidentDate >= new Date(dateRange.startDate) && 
               incidentDate <= new Date(dateRange.endDate);
      });

      // Incidents by severity
      const incidentsBySeverity = {
        MINOR: filteredIncidents.filter(i => i.severity === 'MINOR').length,
        MODERATE: filteredIncidents.filter(i => i.severity === 'MODERATE').length,
        MAJOR: filteredIncidents.filter(i => i.severity === 'MAJOR').length,
        CRITICAL: filteredIncidents.filter(i => i.severity === 'CRITICAL').length
      };

      // Incidents by type
      const incidentsByType = {};
      filteredIncidents.forEach(i => {
        incidentsByType[i.incidentType] = (incidentsByType[i.incidentType] || 0) + 1;
      });

      setSafetyData({
        ...inspectionDashboard,
        dailyChecks: dailyChecksDashboard,
        totalIncidents: filteredIncidents.length,
        incidentsBySeverity,
        incidentsByType,
        resolvedIncidents: filteredIncidents.filter(i => i.status === 'RESOLVED').length,
        pendingIncidents: filteredIncidents.filter(i => i.status !== 'RESOLVED').length
      });
    } catch (error) {
      throw error;
    }
  };

  const loadCustomerData = async () => {
    try {
      const [bookings, feedback] = await Promise.all([
        transportApiService.getAllBookingsHistory(),
        feedbackApiService.getAllFeedback()
      ]);

      // Filter by date range
      const filteredBookings = bookings.filter(b => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= new Date(dateRange.startDate) && 
               bookingDate <= new Date(dateRange.endDate);
      });

      const filteredFeedback = feedback.filter(f => {
        const feedbackDate = new Date(f.createdAt);
        return feedbackDate >= new Date(dateRange.startDate) && 
               feedbackDate <= new Date(dateRange.endDate);
      });

      // Booking statistics
      const totalBookings = filteredBookings.length;
      const confirmedBookings = filteredBookings.filter(b => b.bookingStatus === 'CONFIRMED').length;
      const cancelledBookings = filteredBookings.filter(b => b.bookingStatus === 'CANCELLED').length;
      const cancellationRate = totalBookings > 0 
        ? ((cancelledBookings / totalBookings) * 100).toFixed(1) 
        : 0;

      // Feedback analysis
      const avgRating = filteredFeedback.length > 0
        ? (filteredFeedback.reduce((sum, f) => sum + f.rating, 0) / filteredFeedback.length).toFixed(1)
        : 0;

      const feedbackBySentiment = {
        POSITIVE: filteredFeedback.filter(f => f.sentiment === 'POSITIVE').length,
        NEUTRAL: filteredFeedback.filter(f => f.sentiment === 'NEUTRAL').length,
        NEGATIVE: filteredFeedback.filter(f => f.sentiment === 'NEGATIVE').length
      };

      const feedbackByCategory = {};
      filteredFeedback.forEach(f => {
        feedbackByCategory[f.feedbackCategory] = (feedbackByCategory[f.feedbackCategory] || 0) + 1;
      });

      setCustomerData({
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        cancellationRate,
        totalFeedback: filteredFeedback.length,
        avgRating,
        feedbackBySentiment,
        feedbackByCategory
      });
    } catch (error) {
      throw error;
    }
  };

  const generatePDF = async () => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      let yPos = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      
      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('TDMS Admin Report', 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 23, { align: 'center' });

      yPos = 40;
      doc.setTextColor(0, 0, 0);

      // Report content based on selected report
      if (selectedReport === 'overview' && overviewData) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Business Overview Report', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Report Period: ${dateRange.startDate} to ${dateRange.endDate}`, margin, yPos);
        yPos += 15;

        // Financial Summary
        checkNewPage(40);
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, yPos, 170, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Financial Summary', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont(undefined, 'normal');
        doc.text(`Total Revenue: RWF ${overviewData.totalRevenue.toLocaleString()}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Total Bookings: ${overviewData.totalBookings}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Confirmed: ${overviewData.confirmedBookings}`, margin + 10, yPos);
        yPos += 6;
        doc.text(`Cancelled: ${overviewData.cancelledBookings} (${overviewData.cancellationRate}%)`, margin + 10, yPos);
        yPos += 10;

        // Operations Summary
        checkNewPage(40);
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, yPos, 170, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Operations Summary', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont(undefined, 'normal');
        doc.text(`Total Vehicles: ${overviewData.totalVehicles} (Active: ${overviewData.activeVehicles})`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Total Drivers: ${overviewData.totalDrivers} (Active: ${overviewData.activeDrivers})`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Total Routes: ${overviewData.totalRoutes}`, margin + 5, yPos);
        yPos += 10;

        // Package Delivery
        checkNewPage(30);
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, yPos, 170, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Package Delivery', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont(undefined, 'normal');
        doc.text(`Total Packages: ${overviewData.totalPackages}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Delivered: ${overviewData.deliveredPackages}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`In Transit: ${overviewData.inTransitPackages}`, margin + 5, yPos);
        yPos += 10;

        // Customer Service
        checkNewPage(30);
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, yPos, 170, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Customer Service', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont(undefined, 'normal');
        doc.text(`Total Feedback: ${overviewData.totalFeedback}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Average Rating: ${overviewData.avgRating}/5.0`, margin + 5, yPos);
        yPos += 10;

        // Safety & Incidents
        checkNewPage(30);
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, yPos, 170, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Safety & Incidents', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont(undefined, 'normal');
        doc.text(`Total Incidents: ${overviewData.totalIncidents}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Critical: ${overviewData.criticalIncidents}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Resolved: ${overviewData.resolvedIncidents}`, margin + 5, yPos);
      }

      // Similar detailed sections for other report types...
      // (Financial, Operational, Safety, Customer reports)

      if (selectedReport === 'financial' && financialData) {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Financial Report', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, margin, yPos);
        yPos += 15;

        // Revenue Summary
        checkNewPage(40);
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, yPos, 170, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Revenue Summary', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont(undefined, 'normal');
        doc.text(`Total Revenue: RWF ${financialData.totalRevenue.toLocaleString()}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Booking Revenue: RWF ${financialData.bookingRevenue.toLocaleString()}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Package Revenue: RWF ${financialData.packageRevenue.toLocaleString()}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Total Transactions: ${financialData.totalTransactions}`, margin + 5, yPos);
        yPos += 10;

        // Payment Methods
        checkNewPage(30);
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, yPos, 170, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Payment Methods Breakdown', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont(undefined, 'normal');
        Object.entries(financialData.paymentMethods).forEach(([method, amount]) => {
          checkNewPage(6);
          doc.text(`${method}: RWF ${amount.toLocaleString()}`, margin + 5, yPos);
          yPos += 6;
        });
        yPos += 5;

        // Top Routes by Revenue
        checkNewPage(30);
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, yPos, 170, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Top Routes by Revenue', margin + 2, yPos + 5);
        yPos += 12;

        doc.setFont(undefined, 'normal');
        const sortedRoutes = Object.entries(financialData.revenueByRoute)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);
        
        sortedRoutes.forEach(([route, revenue]) => {
          checkNewPage(6);
          doc.text(`${route}: RWF ${revenue.toLocaleString()}`, margin + 5, yPos);
          yPos += 6;
        });
      }

      // Footer
      const addFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          doc.text(
            `Page ${i} of ${pageCount}`,
            105,
            pageHeight - 10,
            { align: 'center' }
          );
          doc.text(
            'TDMS - Transport & Delivery Management System',
            105,
            pageHeight - 5,
            { align: 'center' }
          );
        }
      };

      addFooter();

      // Save the PDF
      const fileName = `TDMS_${selectedReport}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  };

  const reportTypes = [
    { id: 'overview', label: 'Business Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'financial', label: 'Financial Report', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'operational', label: 'Operations Report', icon: <Activity className="w-5 h-5" /> },
    { id: 'safety', label: 'Safety Report', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'customer', label: 'Customer Service', icon: <Users className="w-5 h-5" /> }
  ];

  const renderOverviewReport = () => {
    if (!overviewData) return null;

    return (
      <div className="space-y-6">
        {/* Financial Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Financial Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                RWF {overviewData.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-600">
                {overviewData.totalBookings}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Cancellation Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {overviewData.cancellationRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Operations Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            Operations Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Vehicles</p>
              <p className="text-2xl font-bold text-blue-600">
                {overviewData.activeVehicles}/{overviewData.totalVehicles}
              </p>
              <p className="text-xs text-gray-500">Active/Total</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Drivers</p>
              <p className="text-2xl font-bold text-indigo-600">
                {overviewData.activeDrivers}/{overviewData.totalDrivers}
              </p>
              <p className="text-xs text-gray-500">Active/Total</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Routes</p>
              <p className="text-2xl font-bold text-teal-600">
                {overviewData.totalRoutes}
              </p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Packages</p>
              <p className="text-2xl font-bold text-cyan-600">
                {overviewData.deliveredPackages}/{overviewData.totalPackages}
              </p>
              <p className="text-xs text-gray-500">Delivered/Total</p>
            </div>
          </div>
        </div>

        {/* Customer Service Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Customer Service
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Feedback</span>
                <span className="font-bold text-gray-800">{overviewData.totalFeedback}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Rating</span>
                <span className="font-bold text-yellow-600">{overviewData.avgRating}/5.0</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Safety & Incidents
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Incidents</span>
                <span className="font-bold text-gray-800">{overviewData.totalIncidents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Critical</span>
                <span className="font-bold text-red-600">{overviewData.criticalIncidents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Resolved</span>
                <span className="font-bold text-green-600">{overviewData.resolvedIncidents}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialReport = () => {
    if (!financialData) return null;

    return (
      <div className="space-y-6">
        {/* Revenue Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                RWF {financialData.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Booking Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                RWF {financialData.bookingRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Package Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                RWF {financialData.packageRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-indigo-600">
                {financialData.totalTransactions}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Methods Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(financialData.paymentMethods).map(([method, amount]) => (
              <div key={method} className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-700 font-medium">{method}</span>
                <span className="text-gray-900 font-bold">RWF {amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Routes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Routes by Revenue</h3>
          <div className="space-y-3">
            {Object.entries(financialData.revenueByRoute)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([route, revenue]) => (
                <div key={route} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-700">{route}</span>
                  <span className="text-gray-900 font-bold">RWF {revenue.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderOperationalReport = () => {
    if (!operationalData) return null;

    return (
      <div className="space-y-6">
        {/* Trip Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Trip Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-blue-600">
                {operationalData.totalTrips}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {operationalData.completedTrips}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {operationalData.completionRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle Utilization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Vehicle Utilization</h3>
          <div className="space-y-3">
            {Object.entries(operationalData.vehicleUtilization)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([vehicle, trips]) => (
                <div key={vehicle} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-700">{vehicle}</span>
                  <span className="text-gray-900 font-bold">{trips} trips</span>
                </div>
              ))}
          </div>
        </div>

        {/* Popular Routes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Most Popular Routes</h3>
          <div className="space-y-3">
            {Object.entries(operationalData.routePopularity)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([route, bookings]) => (
                <div key={route} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-700">{route}</span>
                  <span className="text-gray-900 font-bold">{bookings} bookings</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSafetyReport = () => {
    if (!safetyData) return null;

    return (
      <div className="space-y-6">
        {/* Inspection Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Vehicle Inspection Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold text-blue-600">
                {safetyData.totalVehicles}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Inspected</p>
              <p className="text-2xl font-bold text-green-600">
                {safetyData.inspectedVehicles}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Due Soon</p>
              <p className="text-2xl font-bold text-yellow-600">
                {safetyData.dueSoonCount}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {safetyData.overdueCount}
              </p>
            </div>
          </div>
        </div>

        {/* Incidents Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Incidents Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">By Severity</h4>
              <div className="space-y-2">
                {Object.entries(safetyData.incidentsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-700">{severity}</span>
                    <span className={`font-bold ${
                      severity === 'CRITICAL' ? 'text-red-600' :
                      severity === 'MAJOR' ? 'text-orange-600' :
                      severity === 'MODERATE' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-700">Total Incidents</span>
                  <span className="font-bold text-gray-900">{safetyData.totalIncidents}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-700">Resolved</span>
                  <span className="font-bold text-green-600">{safetyData.resolvedIncidents}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-700">Pending</span>
                  <span className="font-bold text-orange-600">{safetyData.pendingIncidents}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Incidents by Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Incidents by Type</h3>
          <div className="space-y-3">
            {Object.entries(safetyData.incidentsByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-700">{type}</span>
                  <span className="text-gray-900 font-bold">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerReport = () => {
    if (!customerData) return null;

    return (
      <div className="space-y-6">
        {/* Booking Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-600">
                {customerData.totalBookings}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {customerData.confirmedBookings}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">
                {customerData.cancelledBookings}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Cancellation Rate</p>
              <p className="text-2xl font-bold text-orange-600">
                {customerData.cancellationRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Feedback</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {customerData.avgRating}/5.0
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-800">
                  {customerData.totalFeedback}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Sentiment Analysis</h4>
              <div className="space-y-2">
                {Object.entries(customerData.feedbackBySentiment).map(([sentiment, count]) => (
                  <div key={sentiment} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className={`font-medium ${
                      sentiment === 'POSITIVE' ? 'text-green-600' :
                      sentiment === 'NEGATIVE' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>{sentiment}</span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Feedback by Category</h3>
          <div className="space-y-3">
            {Object.entries(customerData.feedbackByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div key={category} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-700">{category}</span>
                  <span className="text-gray-900 font-bold">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Reports</h1>
          <p className="text-gray-600 mt-1">Generate comprehensive business reports</p>
        </div>
        <button
          onClick={generatePDF}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          {loading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Report Type Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Report Type</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedReport(type.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                selectedReport === type.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.icon}
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Date Range</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-center">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading report data...</p>
          </div>
        </div>
      ) : (
        <>
          {selectedReport === 'overview' && renderOverviewReport()}
          {selectedReport === 'financial' && renderFinancialReport()}
          {selectedReport === 'operational' && renderOperationalReport()}
          {selectedReport === 'safety' && renderSafetyReport()}
          {selectedReport === 'customer' && renderCustomerReport()}
        </>
      )}
    </div>
  );
};

export default AdminReports;