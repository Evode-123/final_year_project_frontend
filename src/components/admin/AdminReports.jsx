import React, { useState, useEffect } from 'react';
import {
  Download, Calendar, X, Loader,
  Ticket, Users, MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import transportApiService from '../../services/transportApiService';
import packageApiService from '../../services/packageApiService';

const TABS = [
  { id: 'ticket',      label: 'Ticket Report',      icon: Ticket  },
  { id: 'driver',      label: 'Driver Report',       icon: Users   },
  { id: 'destination', label: 'Destination Report',  icon: MapPin  },
];

const AdminReports = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab]     = useState('ticket');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [allData, setAllData]         = useState(null);
  const [pdfLoading, setPdfLoading]   = useState({ ticket: false, driver: false, destination: false });
  const [dateRange, setDateRange]     = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate:   new Date().toISOString().split('T')[0],
  });

  useEffect(() => { loadAllData(); }, [dateRange]);

  // ─── Helper: clean route string ─────────────────────────────────────────────
  // cleanRoute() is used for the UI display (shows nice arrow)
  // cleanRoutePDF() is used inside jsPDF tables — Unicode → causes letter-spacing
  // bugs in some jsPDF builds, so we use the ASCII sequence " > " instead.
  const cleanRoute = (origin, destination) => {
    const c = (s) => {
      if (!s) return '';
      return s
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b(\w)\s(?=\w\b)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    };
    return c(origin) + ' \u2192 ' + c(destination);
  };

  const cleanRoutePDF = (origin, destination) => {
    // Some DB values come with spaced-out chars like "K i g a l i"
    // Step 1: collapse all whitespace down to single spaces
    // Step 2: remove spaces between single letters (e.g. "K i g" -> "Kig")
    const c = (s) => {
      if (!s) return '';
      return s
        .replace(/\s+/g, ' ')               // collapse multiple spaces
        .trim()
        .replace(/\b(\w)\s(?=\w\b)/g, '$1') // "K i g a l i" -> "Kigali"
        .replace(/\s+/g, ' ')               // final cleanup
        .trim();
    };
    return c(origin) + '  -->  ' + c(destination);
  };

  // ─── LOAD ALL DATA ───────────────────────────────────────────────────────────
  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [bookings, vehicles, drivers, routes] = await Promise.all([
        transportApiService.getAllBookingsHistory(),
        transportApiService.getAllVehicles(),
        transportApiService.getAllDrivers(),
        transportApiService.getAllRoutes(),
      ]);

      const inRange = (d) => {
        const dt = new Date(d);
        return dt >= new Date(dateRange.startDate) && dt <= new Date(dateRange.endDate);
      };

      const filteredBookings = bookings.filter(b => inRange(b.bookingDate));

      // ── Driver trip counts (within range) ──
      const vehicleDriverMap = {};
      drivers.forEach(d => {
        if (d.assignedVehiclePlateNo) vehicleDriverMap[d.assignedVehiclePlateNo] = d;
      });

      const driverTripCount = {};
      filteredBookings.forEach(b => {
        const plate = b.dailyTrip?.vehicle?.plateNo;
        if (plate && vehicleDriverMap[plate]) {
          const id = vehicleDriverMap[plate].id;
          driverTripCount[id] = (driverTripCount[id] || 0) + 1;
        }
      });

      // ── Route stats (within range) ──
      const routeStats = {};
      filteredBookings.forEach(b => {
        if (b.dailyTrip?.route) {
          const key = b.dailyTrip.route.id;
          if (!routeStats[key]) routeStats[key] = { vehicle: null, trips: 0 };
          routeStats[key].trips += 1;
          if (b.dailyTrip.vehicle && !routeStats[key].vehicle)
            routeStats[key].vehicle = b.dailyTrip.vehicle;
        }
      });

      // ── Ticket rows ──
      const ticketRows = filteredBookings
        .filter(b => b.bookingStatus === 'CONFIRMED')
        .map((b, i) => ({
          idx:           i + 1,
          route:         b.dailyTrip?.route
                           ? cleanRoute(b.dailyTrip.route.origin, b.dailyTrip.route.destination)
                           : '-',
          routePDF:      b.dailyTrip?.route
                           ? cleanRoutePDF(b.dailyTrip.route.origin, b.dailyTrip.route.destination)
                           : '-',
          passengerName: b.customer?.names ?? '-',
          phoneNumber:   b.customer?.phoneNumber ?? '-',
          travelDate:    b.dailyTrip?.tripDate
                           ? new Date(b.dailyTrip.tripDate).toLocaleDateString()
                           : '-',
          vehicle:       b.dailyTrip?.vehicle?.plateNo ?? '-',
          seatNumber:    b.seatNumber ?? '-',
          price:         b.price != null
                           ? Number(b.price).toLocaleString()
                           : '-',
          paymentMethod: b.paymentMethod ?? '-',
        }));

      // ── Driver rows ──
      const driverRows = drivers.map((d, i) => ({
        idx:               i + 1,
        driverName:        d.names ?? '-',
        phoneNumber:       d.phoneNumber ?? '-',
        address:           d.address ?? '-',
        hiredDate:         d.hiredDate
                             ? new Date(d.hiredDate).toLocaleDateString()
                             : '-',
        vehicleAssignment: d.assignedVehiclePlateNo ?? 'Unassigned',
        driverStatus:      d.status ?? '-',
        trips:             driverTripCount[d.id] ?? 0,
      }));

      // ── Destination rows ──
      const destinationRows = routes.map((r, i) => {
        const stat = routeStats[r.id];
        return {
          idx:         i + 1,
          destination: cleanRoute(r.origin, r.destination),
          destPDF:     cleanRoutePDF(r.origin, r.destination),
          price:       r.price != null
                         ? `${Number(r.price).toLocaleString()} RWF`
                         : '-',
          duration:    r.durationMinutes != null
                         ? `${Math.floor(r.durationMinutes / 60)}h ${r.durationMinutes % 60}min`
                         : '-',
          vehicle:     stat?.vehicle?.plateNo ?? '-',
          seats:       stat?.vehicle?.capacity ?? r.totalSeats ?? '-',
          trips:       stat?.trips ?? 0,
          status:      r.status ?? 'ACTIVE',
        };
      });

      setAllData({ ticketRows, driverRows, destinationRows });
    } catch (err) {
      setError('Failed to load report data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── LOGO ────────────────────────────────────────────────────────────────────
  const loadLogoAsBase64 = () => new Promise((resolve) => {
    fetch(`/Logo.avif?cb=${Date.now()}`)
      .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          try {
            const c = document.createElement('canvas');
            c.width = img.naturalWidth || 200;
            c.height = img.naturalHeight || 200;
            c.getContext('2d').drawImage(img, 0, 0);
            resolve(c.toDataURL('image/png'));
          } catch { resolve(null); }
          URL.revokeObjectURL(url);
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
      })
      .catch(() => resolve(null));
  });

  // ─── PDF HEADER ──────────────────────────────────────────────────────────────
  const buildHeader = async (doc, title) => {
    const pw     = doc.internal.pageSize.width;
    const margin = 14;
    const cx     = pw / 2;
    let   y      = 8;

    const logo = await loadLogoAsBase64();
    if (logo) {
      doc.addImage(logo, 'PNG', cx - 9, y, 18, 18);
      y += 21;
    }

    doc.setFontSize(18); doc.setFont(undefined, 'bold'); doc.setTextColor(37, 99, 235);
    doc.text('Brothers Express', cx, y, { align: 'center' }); y += 7;

    doc.setFontSize(8.5); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 100, 100);
    doc.text('Kigali, Rwanda  |  +250 788 000 000  |  info@tdms.gov.rw', cx, y, { align: 'center' }); y += 7;

    doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(20, 20, 20);
    doc.text(title, cx, y, { align: 'center' }); y += 6;

    doc.setFontSize(8.5); doc.setFont(undefined, 'normal'); doc.setTextColor(90, 90, 90);
    doc.text(
      `Period: ${dateRange.startDate}  \u2013  ${dateRange.endDate}     |     Generated: ${new Date().toLocaleString()}`,
      cx, y, { align: 'center' }
    ); y += 5;

    doc.setDrawColor(37, 99, 235); doc.setLineWidth(0.6);
    doc.line(margin, y, pw - margin, y); y += 8;

    return y;
  };

  // ─── PDF SIGNATURE ───────────────────────────────────────────────────────────
  const buildSignature = (doc, y) => {
    const pw     = doc.internal.pageSize.width;
    const ph     = doc.internal.pageSize.height;
    const margin = 14;
    if (y + 50 > ph - 20) { doc.addPage(); y = 20; }
    const bw = (pw - 3 * margin) / 2;

    const drawBox = (x, label, role) => {
      doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.4);
      doc.roundedRect(x, y, bw, 38, 3, 3);
      doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.setTextColor(37, 99, 235);
      doc.text(label, x + bw / 2, y + 10, { align: 'center' });
      doc.setDrawColor(37, 99, 235); doc.setLineWidth(0.5);
      doc.line(x + 12, y + 23, x + bw - 12, y + 23);
      doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(60, 60, 60);
      doc.text(role, x + bw / 2, y + 29, { align: 'center' });
      doc.text('Date: __________', x + bw / 2, y + 35, { align: 'center' });
    };
    drawBox(margin, 'Prepared By', 'System Administrator');
    drawBox(margin + bw + margin, 'Approved By', 'Director of Operations');
  };

  // ─── PDF FOOTER ──────────────────────────────────────────────────────────────
  const buildFooter = (doc) => {
    const pw = doc.internal.pageSize.width;
    const ph = doc.internal.pageSize.height;
    const m  = 14;
    const pc = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pc; i++) {
      doc.setPage(i);
      doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.3);
      doc.line(m, ph - 14, pw - m, ph - 14);
      doc.setFontSize(7.5); doc.setFont(undefined, 'normal'); doc.setTextColor(140, 140, 140);
      doc.text('Generated by Transport & Delivery Management System', pw / 2, ph - 8, { align: 'center' });
      doc.text(`\u00A9 ${new Date().getFullYear()} Brothers Express`, pw / 2, ph - 4, { align: 'center' });
      doc.setFont(undefined, 'bold');
      doc.text(`Page ${i} of ${pc}`, pw - m, ph - 4, { align: 'right' });
    }
  };

  // ─── SHARED TABLE STYLE ──────────────────────────────────────────────────────
  const ts = {
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], textColor: [255, 255, 255],
      fontStyle: 'bold', fontSize: 8.5, halign: 'center', cellPadding: 3.5,
    },
    bodyStyles:         { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [240, 245, 255] },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PDF 1 — TICKET REPORT  (no Payment Status column)
  // ══════════════════════════════════════════════════════════════════════════
  const downloadTicketPDF = async () => {
    if (!allData) return;
    setPdfLoading(p => ({ ...p, ticket: true }));
    try {
      const { jsPDF } = window.jspdf;
      require('jspdf-autotable');
      const doc    = new jsPDF({ orientation: 'landscape' });
      const margin = 14;
      const y      = await buildHeader(doc, 'Ticket Report');

      doc.autoTable({
        ...ts, startY: y, margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 18 },   // Ticket Id
          1: { cellWidth: 48 },   // Route  ← wider so text fits without weird spacing
          2: { cellWidth: 30 },   // Passenger Name
          3: { cellWidth: 28 },   // Phone Number
          4: { cellWidth: 22 },   // Travel Date
          5: { cellWidth: 22 },   // Vehicle
          6: { cellWidth: 16 },   // Seat No.
          7: { cellWidth: 24 },   // Price
          8: { cellWidth: 30 },   // Payment Method
        },
        head: [['Ticket Id', 'Route', 'Passenger Name', 'Phone Number', 'Travel Date', 'Vehicle', 'Seat No.', 'Price (RWF)', 'Payment Method']],
        body: allData.ticketRows.length
          ? allData.ticketRows.map(r => [r.idx, r.routePDF, r.passengerName, r.phoneNumber, r.travelDate, r.vehicle, r.seatNumber, r.price, r.paymentMethod])
          : [['No confirmed bookings found in selected period', '', '', '', '', '', '', '', '']],
      });

      buildSignature(doc, doc.lastAutoTable.finalY + 18);
      buildFooter(doc);
      doc.save(`TicketReport_${dateRange.startDate}_${dateRange.endDate}.pdf`);
    } catch (err) { setError('PDF error: ' + err.message); }
    finally { setPdfLoading(p => ({ ...p, ticket: false })); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PDF 2 — DRIVER REPORT  (no ID, Backup, License No., License Expiry)
  // ══════════════════════════════════════════════════════════════════════════
  const downloadDriverPDF = async () => {
    if (!allData) return;
    setPdfLoading(p => ({ ...p, driver: true }));
    try {
      const { jsPDF } = window.jspdf;
      require('jspdf-autotable');
      const doc    = new jsPDF({ orientation: 'landscape' });
      const margin = 14;
      const y      = await buildHeader(doc, 'Driver Report');

      doc.autoTable({
        ...ts, startY: y, margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 18 },   // Driver Id
          1: { cellWidth: 38 },   // Driver Name
          2: { cellWidth: 30 },   // Phone Number
          3: { cellWidth: 36 },   // Address
          4: { cellWidth: 24 },   // Hired Date
          5: { cellWidth: 30 },   // Vehicle Assignment
          6: { cellWidth: 26 },   // Driver Status
          7: { cellWidth: 16 },   // TRIPS
        },
        head: [['Driver Id', 'Driver Name', 'Phone Number', 'Address', 'Hired Date', 'Vehicle Assignment', 'Driver Status', 'TRIPS']],
        body: allData.driverRows.length
          ? allData.driverRows.map(r => [r.idx, r.driverName, r.phoneNumber, r.address, r.hiredDate, r.vehicleAssignment, r.driverStatus, r.trips])
          : [['No drivers found', '', '', '', '', '', '', '']],
        didParseCell: (data) => {
          if (data.section === 'body') {
            if (data.column.index === 6) {
              const v = data.cell.raw;
              if (v === 'ACTIVE')   data.cell.styles.textColor = [22, 163, 74];
              if (v === 'INACTIVE') data.cell.styles.textColor = [220, 38, 38];
            }
            if (data.column.index === 7) {
              data.cell.styles.fontStyle  = 'bold';
              data.cell.styles.textColor  = [37, 99, 235];
            }
          }
        },
      });

      buildSignature(doc, doc.lastAutoTable.finalY + 18);
      buildFooter(doc);
      doc.save(`DriverReport_${dateRange.startDate}_${dateRange.endDate}.pdf`);
    } catch (err) { setError('PDF error: ' + err.message); }
    finally { setPdfLoading(p => ({ ...p, driver: false })); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PDF 3 — DESTINATION REPORT  (no Distance, clean arrow)
  // ══════════════════════════════════════════════════════════════════════════
  const downloadDestinationPDF = async () => {
    if (!allData) return;
    setPdfLoading(p => ({ ...p, destination: true }));
    try {
      const { jsPDF } = window.jspdf;
      require('jspdf-autotable');
      const doc    = new jsPDF({ orientation: 'landscape' });
      const margin = 14;
      const y      = await buildHeader(doc, 'Destination Report');

      doc.autoTable({
        ...ts, startY: y, margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 18 },   // Route Id
          1: { cellWidth: 62 },   // Destination  ← wider
          2: { cellWidth: 28 },   // Price
          3: { cellWidth: 26 },   // Duration
          4: { cellWidth: 26 },   // Vehicle
          5: { cellWidth: 18 },   // Seats
          6: { cellWidth: 16 },   // Trips
          7: { cellWidth: 22 },   // Status
        },
        head: [['Route Id', 'Destination', 'Price', 'Duration', 'Vehicle', 'Seats', 'Trips', 'Status']],
        body: allData.destinationRows.length
          ? allData.destinationRows.map(r => [r.idx, r.destPDF, r.price, r.duration, r.vehicle, r.seats, r.trips, r.status])
          : [['No routes found', '', '', '', '', '', '', '']],
        didParseCell: (data) => {
          if (data.section === 'body') {
            if (data.column.index === 6) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = [37, 99, 235];
            }
            if (data.column.index === 7) {
              const v = data.cell.raw;
              if (v === 'ACTIVE')   data.cell.styles.textColor = [22, 163, 74];
              if (v === 'INACTIVE') data.cell.styles.textColor = [220, 38, 38];
            }
          }
        },
      });

      buildSignature(doc, doc.lastAutoTable.finalY + 18);
      buildFooter(doc);
      doc.save(`DestinationReport_${dateRange.startDate}_${dateRange.endDate}.pdf`);
    } catch (err) { setError('PDF error: ' + err.message); }
    finally { setPdfLoading(p => ({ ...p, destination: false })); }
  };

  // ─── STATUS BADGE ────────────────────────────────────────────────────────────
  const Badge = ({ value }) => {
    const map = {
      ACTIVE:       'bg-green-100  text-green-700',
      INACTIVE:     'bg-red-100    text-red-700',
      PAID:         'bg-green-100  text-green-700',
      PENDING:      'bg-yellow-100 text-yellow-700',
      FAILED:       'bg-red-100    text-red-700',
      CONFIRMED:    'bg-green-100  text-green-700',
      CANCELLED:    'bg-red-100    text-red-700',
      MOBILE_MONEY: 'bg-purple-100 text-purple-700',
      CASH:         'bg-gray-100   text-gray-700',
    };
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[value] ?? 'bg-gray-100 text-gray-600'}`}>
        {value ?? '-'}
      </span>
    );
  };

  // ─── TABLE RENDERER ──────────────────────────────────────────────────────────
  const DataTable = ({ columns, rows, emptyMsg }) => (
    <div className="overflow-x-auto">
      {rows.length === 0
        ? <div className="py-14 text-center text-gray-400 text-sm">{emptyMsg}</div>
        : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-600">
                {columns.map((col, i) => (
                  <th key={i} className={`px-3 py-3 text-xs font-semibold text-white whitespace-nowrap
                    ${col.right ? 'text-right' : 'text-center'}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors
                  ${ri % 2 === 0 ? 'bg-white' : 'bg-blue-50/20'}`}>
                  {columns.map((col, ci) => (
                    <td key={ci} className={`px-3 py-2.5 whitespace-nowrap
                      ${col.right  ? 'text-right font-semibold text-gray-800' : 'text-gray-700'}
                      ${col.bold   ? 'font-semibold text-gray-900' : ''}
                      ${col.blue   ? 'font-bold text-blue-600' : ''}
                      ${col.center ? 'text-center' : ''}
                    `}>
                      {col.badge  ? <Badge value={row[col.key]} />
                       : col.render ? col.render(row)
                       : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </div>
  );

  // ─── ACTIVE TAB CONTENT ──────────────────────────────────────────────────────
  const renderTabContent = () => {
    if (loading) return (
      <div className="flex items-center justify-center h-56">
        <div className="text-center">
          <Loader className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading data…</p>
        </div>
      </div>
    );

    if (!allData) return null;

    if (activeTab === 'ticket') return (
      <DataTable
        emptyMsg="No confirmed bookings in the selected period."
        columns={[
          { label: 'Ticket Id',      key: 'idx',           center: true, bold: true },
          { label: 'Route',          key: 'route'                                   },
          { label: 'Passenger Name', key: 'passengerName', bold: true               },
          { label: 'Phone Number',   key: 'phoneNumber'                             },
          { label: 'Travel Date',    key: 'travelDate'                              },
          { label: 'Vehicle',        key: 'vehicle',       bold: true               },
          { label: 'Seat No.',       key: 'seatNumber',    center: true             },
          { label: 'Price (RWF)',    key: 'price',         right: true              },
          { label: 'Payment Method', key: 'paymentMethod', badge: true              },
        ]}
        rows={allData.ticketRows}
      />
    );

    if (activeTab === 'driver') return (
      <DataTable
        emptyMsg="No drivers found."
        columns={[
          { label: 'Driver Id',         key: 'idx',               center: true, bold: true },
          { label: 'Driver Name',       key: 'driverName',        bold: true               },
          { label: 'Phone Number',      key: 'phoneNumber'                                 },
          { label: 'Address',           key: 'address'                                     },
          { label: 'Hired Date',        key: 'hiredDate'                                   },
          { label: 'Vehicle Assignment',key: 'vehicleAssignment', bold: true               },
          { label: 'Driver Status',     key: 'driverStatus',      badge: true              },
          { label: 'TRIPS',             key: 'trips',             blue: true, right: true  },
        ]}
        rows={allData.driverRows}
      />
    );

    if (activeTab === 'destination') return (
      <DataTable
        emptyMsg="No routes found."
        columns={[
          { label: 'Route Id',    key: 'idx',         center: true, bold: true },
          { label: 'Destination', key: 'destination', bold: true               },
          { label: 'Price',       key: 'price',       right: true              },
          { label: 'Duration',    key: 'duration'                              },
          { label: 'Vehicle',     key: 'vehicle',     bold: true               },
          { label: 'Seats',       key: 'seats',       center: true             },
          { label: 'Trips',       key: 'trips',       blue: true, right: true  },
          { label: 'Status',      key: 'status',      badge: true              },
        ]}
        rows={allData.destinationRows}
      />
    );
  };

  // ─── ACTIVE DOWNLOAD HANDLER ─────────────────────────────────────────────────
  const handleDownload = () => {
    if (activeTab === 'ticket')      return downloadTicketPDF();
    if (activeTab === 'driver')      return downloadDriverPDF();
    if (activeTab === 'destination') return downloadDestinationPDF();
  };

  const activeTabData = TABS.find(t => t.id === activeTab);
  const isDownloading  = pdfLoading[activeTab];
  const rowCount       = allData
    ? (activeTab === 'ticket'      ? allData.ticketRows.length
     : activeTab === 'driver'      ? allData.driverRows.length
     : allData.destinationRows.length)
    : 0;

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16">

      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Admin Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Select a report tab · download as PDF</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Date range */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-700">Date Range</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['Start Date', 'startDate'], ['End Date', 'endDate']].map(([lbl, key]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{lbl}</label>
              <input
                type="date"
                value={dateRange[key]}
                onChange={e => setDateRange(d => ({ ...d, [key]: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── TAB CARD ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

        {/* Tab bar + download button */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0 border-b border-gray-100">

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(tab => {
              const Icon    = tab.icon;
              const active  = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl border-b-2 transition-all
                    ${active
                      ? 'border-blue-600 text-blue-600 bg-blue-50/60'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Download button — always visible, for the active tab */}
          <div className="pb-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading || !allData || loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl
                transition-colors shadow-sm"
            >
              {isDownloading
                ? <><Loader className="w-4 h-4 animate-spin" /> Generating…</>
                : <><Download className="w-4 h-4" /> Download PDF</>
              }
            </button>
          </div>
        </div>

        {/* Tab subtitle row */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          {activeTabData && (
            <>
              <activeTabData.icon className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">{activeTabData.label}</span>
              {allData && !loading && (
                <span className="ml-2 text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                  {rowCount} record{rowCount !== 1 ? 's' : ''}
                </span>
              )}
            </>
          )}
        </div>

        {/* Tab content */}
        <div className="min-h-[200px]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;