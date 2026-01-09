// utils/pdfTicketGenerator.js
// This utility generates PDF tickets from booking data

export const generateTicketPDF = (booking) => {
  // Create a new jsPDF instance
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set colors
  const primaryColor = [37, 99, 235]; // Blue
  const darkColor = [31, 41, 55]; // Dark gray
  const lightColor = [243, 244, 246]; // Light gray

  // Header with gradient effect (simulated with rectangles)
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Company name/logo
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('Transport Booking System', 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Your Journey Starts Here', 105, 25, { align: 'center' });

  // Ticket header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('TRAVEL TICKET', 105, 35, { align: 'center' });

  // Ticket number box
  doc.setFillColor(...lightColor);
  doc.roundedRect(15, 45, 180, 15, 3, 3, 'F');
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Ticket Number:', 20, 52);
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(booking.ticketNumber, 20, 57);

  // Booking status
  const statusColor = booking.bookingStatus === 'CONFIRMED' ? [34, 197, 94] : [239, 68, 68];
  doc.setFillColor(...statusColor);
  doc.roundedRect(150, 47, 40, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text(booking.bookingStatus, 170, 54, { align: 'center' });

  // Main content section
  let yPos = 70;

  // Passenger Information
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('PASSENGER INFORMATION', 20, yPos + 5.5);

  yPos += 12;
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  doc.text('Full Name:', 20, yPos);
  doc.setFont(undefined, 'bold');
  doc.text(booking.customer.names, 60, yPos);
  
  yPos += 7;
  doc.setFont(undefined, 'normal');
  doc.text('Phone Number:', 20, yPos);
  doc.setFont(undefined, 'bold');
  doc.text(booking.customer.phoneNumber, 60, yPos);

  yPos += 7;
  doc.setFont(undefined, 'normal');
  doc.text('Seat Number:', 20, yPos);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.text(booking.seatNumber.toString(), 60, yPos);

  // Journey Details
  yPos += 15;
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('JOURNEY DETAILS', 20, yPos + 5.5);

  yPos += 12;
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  // Route with arrow
  doc.text('Route:', 20, yPos);
  doc.setFont(undefined, 'bold');
  doc.text(booking.dailyTrip.route.origin, 60, yPos);
  doc.setFont(undefined, 'normal');
  doc.text('→', 110, yPos);
  doc.setFont(undefined, 'bold');
  doc.text(booking.dailyTrip.route.destination, 120, yPos);

  yPos += 7;
  doc.setFont(undefined, 'normal');
  doc.text('Travel Date:', 20, yPos);
  doc.setFont(undefined, 'bold');
  const travelDate = new Date(booking.dailyTrip.tripDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(travelDate, 60, yPos);

  yPos += 7;
  doc.setFont(undefined, 'normal');
  doc.text('Departure Time:', 20, yPos);
  doc.setFont(undefined, 'bold');
  doc.text(booking.dailyTrip.timeSlot.departureTime, 60, yPos);

  yPos += 7;
  doc.setFont(undefined, 'normal');
  doc.text('Vehicle:', 20, yPos);
  doc.setFont(undefined, 'bold');
  doc.text(booking.dailyTrip.vehicle.plateNo, 60, yPos);

  // Payment Information
  yPos += 15;
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('PAYMENT INFORMATION', 20, yPos + 5.5);

  yPos += 12;
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  doc.text('Payment Method:', 20, yPos);
  doc.setFont(undefined, 'bold');
  doc.text(booking.paymentMethod, 60, yPos);

  yPos += 7;
  doc.setFont(undefined, 'normal');
  doc.text('Payment Status:', 20, yPos);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(booking.paymentStatus, 60, yPos);

  yPos += 7;
  doc.setTextColor(...darkColor);
  doc.setFont(undefined, 'normal');
  doc.text('Amount Paid:', 20, yPos);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text(`RWF ${booking.price}`, 60, yPos);

  // Important Information Box
  yPos += 15;
  doc.setFillColor(254, 243, 199); // Light yellow
  doc.setDrawColor(251, 191, 36); // Yellow border
  doc.setLineWidth(0.5);
  doc.roundedRect(15, yPos, 180, 35, 3, 3, 'FD');

  doc.setTextColor(146, 64, 14); // Dark yellow/brown
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('⚠ IMPORTANT INFORMATION', 20, yPos + 6);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const instructions = [
    '• Please arrive 15 minutes before departure time',
    '• Present this ticket when boarding the vehicle',
    '• Keep this ticket safe for reference',
    '• No refunds on departure day',
    '• Contact us for any changes or inquiries'
  ];

  let instructionY = yPos + 12;
  instructions.forEach(instruction => {
    doc.text(instruction, 20, instructionY);
    instructionY += 5;
  });

  // Footer
  const footerY = 270;
  doc.setDrawColor(...lightColor);
  doc.setLineWidth(0.3);
  doc.line(15, footerY, 195, footerY);

  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Generated on: ' + new Date().toLocaleString(), 105, footerY + 5, { align: 'center' });
  doc.text('Thank you for choosing our service!', 105, footerY + 10, { align: 'center' });

  // Barcode/QR placeholder (optional - you can add actual barcode library if needed)
  doc.setFillColor(...lightColor);
  doc.rect(75, footerY + 13, 60, 15, 'F');
  doc.setTextColor(...darkColor);
  doc.setFontSize(7);
  doc.text(booking.ticketNumber, 105, footerY + 21, { align: 'center' });

  // Save the PDF
  doc.save(`Ticket_${booking.ticketNumber}.pdf`);
};

export default generateTicketPDF;