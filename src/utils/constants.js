// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/auth';
export const TRANSPORT_API_URL = 'http://localhost:8080/api';

// User Roles
export const USER_ROLES = {
  ADMIN: 'ROLE_ADMIN',
  RECEPTIONIST: 'ROLE_RECEPTIONIST',
  MANAGER: 'ROLE_MANAGER',
  DRIVER: 'ROLE_DRIVER',
  OTHER_USER: 'ROLE_OTHER_USER'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user'
};

// Route Paths
export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  CHANGE_PASSWORD: '/change-password',
  COMPLETE_PROFILE: '/complete-profile',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  NOTIFICATIONS: '/notifications',
  ROUTES: '/routes',
  VEHICLES: '/vehicles',
  DRIVERS: '/drivers',
  BOOKINGS: '/bookings',
  PACKAGES: '/packages'
};

// Password Requirements
export const PASSWORD_MIN_LENGTH = 8;

// Vehicle Types
export const VEHICLE_TYPES = ['Bus', 'Coaster', 'Van', 'Minibus'];

// Vehicle Status
export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  MAINTENANCE: 'MAINTENANCE',
  INACTIVE: 'INACTIVE'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY',
  CARD: 'CARD'
};

// Booking Status
export const BOOKING_STATUS = {
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

// Driver Status
export const DRIVER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  BACKUP: 'BACKUP'
};

// Package Status
export const PACKAGE_STATUS = {
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  COLLECTED: 'COLLECTED',
  CANCELLED: 'CANCELLED'
};