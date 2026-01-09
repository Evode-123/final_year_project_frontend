import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Lock, Phone, Bell, HelpCircle, 
  Trash2, Save, X, AlertTriangle, CheckCircle, MessageCircle, Send, ChevronRight, Edit
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';

const SettingsPage = () => {
  const { user, token, updateUserState, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeModal, setActiveModal] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ===== CONTACT INFORMATION - UPDATE THESE VALUES =====
  const SUPPORT_CONTACT = {
    phone: '+250 788 123 456',
    whatsapp: '+250788123456',
    email: 'support@tdms.com'
  };
  // ====================================================

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });

  // Email state
  const [emailData, setEmailData] = useState({
    newEmail: '',
    currentPassword: ''
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const settings = await apiService.getUserSettings(token);
      setProfileData({
        firstName: settings.firstName || '',
        lastName: settings.lastName || '',
        phone: settings.phone || ''
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.updateProfile(token, profileData);
      updateUserState({
        firstName: profileData.firstName,
        lastName: profileData.lastName
      });
      showMessage('success', 'Profile updated successfully');
      setActiveModal(null);
    } catch (error) {
      showMessage('error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.updateEmail(token, emailData);
      updateUserState({ email: emailData.newEmail });
      showMessage('success', 'Email updated successfully. Please check both emails for confirmation.');
      setEmailData({ newEmail: '', currentPassword: '' });
      setActiveModal(null);
    } catch (error) {
      showMessage('error', error.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await apiService.changePassword(token, passwordData.currentPassword, passwordData.newPassword);
      showMessage('success', 'Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveModal(null);
    } catch (error) {
      showMessage('error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showMessage('error', 'Please enter your password');
      return;
    }
    // Show custom confirmation modal
    setShowDeleteConfirm(true);
  };

  // ← NEW: Actually deletes the account after confirmation
  const confirmDeleteAccount = async () => {
    setLoading(true);
    try {
      await apiService.deleteAccount(token, deletePassword);
      showMessage('success', 'Account deleted successfully. Redirecting...');
      
      // Close both modals
      setShowDeleteConfirm(false);
      setActiveModal(null);
      
      // Wait 2 seconds to show success message, then logout and redirect
      setTimeout(() => {
        // Clear all session data
        sessionStorage.clear();
        
        // Call logout from context to clear state
        logout();
        
        // Redirect to login page
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      showMessage('error', error.message || 'Failed to delete account');
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const openProfileModal = () => {
    // Reload current data before opening modal
    loadUserSettings();
    setActiveModal('profile');
  };

  const closeModal = () => {
    setActiveModal(null);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setEmailData({ newEmail: '', currentPassword: '' });
    setDeletePassword('');
  };

  const settingsCards = [
    {
      id: 'email',
      title: 'Email Address',
      description: 'Change your email address and notification preferences',
      icon: <Mail className="w-6 h-6" />,
      color: 'purple',
      gradient: 'from-purple-50 to-purple-100',
      border: 'border-purple-200',
      iconBg: 'bg-purple-600',
      onClick: () => setActiveModal('email')
    },
    {
      id: 'password',
      title: 'Password & Security',
      description: 'Update your password and secure your account',
      icon: <Lock className="w-6 h-6" />,
      color: 'green',
      gradient: 'from-green-50 to-green-100',
      border: 'border-green-200',
      iconBg: 'bg-green-600',
      onClick: () => setActiveModal('password')
    },
    {
      id: 'emergency',
      title: 'Emergency Support',
      description: 'For urgent issues outside business hours',
      icon: <Phone className="w-6 h-6" />,
      color: 'orange',
      gradient: 'from-orange-50 to-orange-100',
      border: 'border-orange-200',
      iconBg: 'bg-orange-600',
      isEmergency: true
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? 
            <CheckCircle className="w-5 h-5" /> : 
            <AlertTriangle className="w-5 h-5" />
          }
          <span>{message.text}</span>
        </div>
      )}

      {/* Current Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Current Profile</h2>
            <p className="text-gray-600 text-sm">Your account information</p>
          </div>
          <button
            onClick={openProfileModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Change Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Full Name</p>
              <p className="text-gray-800 font-medium">
                {profileData.firstName} {profileData.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email Address</p>
              <p className="text-gray-800 font-medium break-all">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone Number</p>
              <p className="text-gray-800 font-medium">
                {profileData.phone || 'Not provided'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Cards Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCards.map((card) => (
            <button
              key={card.id}
              onClick={card.onClick}
              className={`bg-gradient-to-br ${card.gradient} border-2 ${card.border} rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105 text-left group`}
            >
              <div className={`w-12 h-12 ${card.iconBg} rounded-full flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-between">
                {card.title}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </h3>
              <p className="text-sm text-gray-600">
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Contact Support Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Contact Support</h2>
          </div>
          <p className="text-gray-600 text-sm">
            Need help? Get in touch with our support team
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Phone Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Call Us</h3>
            <p className="text-sm text-gray-600 mb-3">
              Available Monday - Friday<br />9:00 AM - 5:00 PM
            </p>
            <a
              href={`tel:${SUPPORT_CONTACT.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {SUPPORT_CONTACT.phone}
            </a>
          </div>

          {/* WhatsApp Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">WhatsApp</h3>
            <p className="text-sm text-gray-600 mb-3">
              Chat with us instantly<br />Available 24/7
            </p>
            <a
              href={`https://wa.me/${SUPPORT_CONTACT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>

          {/* Email Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Email Us</h3>
            <p className="text-sm text-gray-600 mb-3">
              Send us a message<br />We'll respond within 24 hours
            </p>
            <a
              href={`mailto:${SUPPORT_CONTACT.email}`}
              className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors break-all"
            >
              <Send className="w-4 h-4 flex-shrink-0" />
              {SUPPORT_CONTACT.email}
            </a>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Before You Contact Us</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Check our FAQ section for quick answers to common questions</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Have your account information ready for faster assistance</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Include screenshots if reporting a technical issue</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Emergency Support Section */}
      <div id="emergency-support" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Emergency Support</h3>
              <p className="text-gray-600 mb-3">
                For urgent issues outside business hours, please call our emergency line:
              </p>
              <a
                href={`tel:${SUPPORT_CONTACT.phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {SUPPORT_CONTACT.phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
          </div>
          <p className="text-gray-600 text-sm">Irreversible actions that affect your account</p>
        </div>

        <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Account</h3>
              <p className="text-gray-600 text-sm mb-4">
                Once you delete your account, there is no going back. All your data will be permanently removed.
              </p>
              <button
                onClick={() => setActiveModal('danger')}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Update Profile</h3>
              </div>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-6">Update your personal information</p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {activeModal === 'email' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Change Email</h3>
              </div>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-6">Update your email address</p>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Current Email:</strong> {user?.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Email Address
                  </label>
                  <input
                    type="email"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({...emailData, newEmail: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password (for verification)
                  </label>
                  <input
                    type="password"
                    value={emailData.currentPassword}
                    onChange={(e) => setEmailData({...emailData, currentPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateEmail}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                    {loading ? 'Updating...' : 'Update Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Change Password</h3>
              </div>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required
                    minLength="8"
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum 8 characters and make use is strong</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* {/* Danger Zone Modal */}
        {activeModal === 'danger' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-red-600">Delete Account</h3>
                </div>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
                    <div>
                    <h4 className="text-lg font-semibold text-red-900 mb-2">
                        ⚠️ This action cannot be undone!
                    </h4>
                    <p className="text-red-800 text-sm mb-4">
                        Before you proceed, please understand:
                    </p>
                    <ul className="space-y-2 text-sm text-red-700">
                        <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>All your personal data will be <strong>permanently deleted</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>Your account <strong>cannot be recovered</strong> after deletion</span>
                        </li>
                        <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>You will be <strong>immediately logged out</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>You will need to <strong>create a new account</strong> to use our services again</span>
                        </li>
                    </ul>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Enter your password to confirm deletion
                    </label>
                    <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-lg"
                    placeholder="Your current password"
                    disabled={loading}
                    />
                    <p className="text-sm text-gray-600 mt-2">
                    You must enter your password to proceed with account deletion
                    </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                        <strong>Note:</strong> After clicking "Delete My Account", you will be asked to confirm twice more. This is your protection against accidental deletion.
                    </span>
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                    onClick={closeModal}
                    disabled={loading}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    >
                    Cancel - Keep My Account
                    </button>
                    <button
                    onClick={handleDeleteAccount}
                    disabled={loading || !deletePassword}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                    {loading ? (
                        <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting Account...
                        </>
                    ) : (
                        <>
                        <Trash2 className="w-5 h-5" />
                        Delete My Account
                        </>
                    )}
                    </button>
                </div>
                </div>
            </div>
            </div>
        </div>
        )}

        {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-200 scale-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Final Confirmation</h3>
                  <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-900 font-semibold mb-3 text-center text-lg">
                  Are you absolutely sure you want to delete your account?
                </p>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>All your data will be <strong>permanently deleted</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Your account <strong>cannot be recovered</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>You will be <strong>immediately logged out</strong></span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  This is your last chance to cancel. Once confirmed, this action is <strong>irreversible</strong>.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold border-2 border-gray-300 disabled:opacity-50"
              >
                Cancel - Keep My Account
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-bold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Yes, Delete Forever
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        
    </div>
  );
};

export default SettingsPage;