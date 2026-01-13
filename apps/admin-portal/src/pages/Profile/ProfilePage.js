/**
 * Profile Page
 * User profile management with completion percentage
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/shared/Toast';
import { ProfileSettings } from './ProfileSettings';
import { MdPerson, MdEmail, MdPhone, MdBusiness, MdCameraAlt, MdLogout, MdPowerSettingsNew, MdPublic } from 'react-icons/md';
export function ProfilePage() {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isSaving, setIsSaving] = useState(false);
    const activeTab = searchParams.get('tab');
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        mobileNumber: '',
        companyName: '',
        companyUrl: '',
    });
    // Initialize profile data from user context
    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                userName: user.email?.split('@')[0] || '',
                email: user.email || '',
                mobileNumber: '',
                companyName: '',
                companyUrl: '',
            });
        }
    }, [user]);
    // Calculate profile completion percentage
    const calculateCompletionPercentage = () => {
        const requiredFields = [
            profileData.firstName,
            profileData.lastName,
            profileData.userName,
            profileData.email,
            profileData.mobileNumber,
            profileData.companyName,
        ];
        const optionalFields = [
            profileData.companyUrl,
            profileData.profilePicture,
        ];
        const requiredCount = requiredFields.filter(field => field && field.trim() !== '').length;
        const optionalCount = optionalFields.filter(field => field && field.trim() !== '').length;
        // Required fields are worth 85% (6 fields)
        // Optional fields are worth 15% (2 fields)
        const requiredPercentage = (requiredCount / 6) * 85;
        const optionalPercentage = (optionalCount / 2) * 15;
        return Math.round(requiredPercentage + optionalPercentage);
    };
    const completionPercentage = calculateCompletionPercentage();
    const handleInputChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value,
        }));
    };
    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file', 'error');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size should be less than 5MB', 'error');
                return;
            }
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData(prev => ({
                    ...prev,
                    profilePicture: reader.result,
                }));
            };
            reader.readAsDataURL(file);
        }
    };
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // TODO: Implement API call to save profile
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
            showToast('Profile updated successfully', 'success');
        }
        catch (error) {
            showToast('Failed to update profile', 'error');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleLogout = async () => {
        try {
            await logout();
            // Navigate to login page after logout
            navigate('/login', { replace: true });
        }
        catch (error) {
            console.error('Logout error:', error);
            // Even if logout fails, navigate to login
            navigate('/login', { replace: true });
        }
    };
    const handleLogoutAllDevices = async () => {
        if (!window.confirm('Are you sure you want to logout from all devices? This will invalidate all active sessions.')) {
            return;
        }
        try {
            // TODO: Implement API call to logout from all devices
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
            showToast('Logged out from all devices successfully', 'success');
            await logout();
            // Navigate to login page after logout
            navigate('/login', { replace: true });
        }
        catch (error) {
            showToast('Failed to logout from all devices', 'error');
            // Even if logout fails, navigate to login
            navigate('/login', { replace: true });
        }
    };
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Profile</h1>
        <p className="text-gray-600">Manage your profile information and settings</p>
      </div>

      {/* Profile Completion Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          {/* Left Side - Text Content */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Profile Completion</h2>
            <p className="text-sm text-gray-600">Complete your profile to get the most out of the platform</p>
          </div>
          
          {/* Right Side - Circular Progress Indicator */}
          <div className="flex-shrink-0 ml-6">
            <div className="relative w-20 h-20">
              <svg className="transform -rotate-90 w-20 h-20">
                <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none"/>
                <circle cx="40" cy="40" r="36" stroke="url(#gradient)" strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - completionPercentage / 100)}`} strokeLinecap="round" className="transition-all duration-500"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb"/>
                    <stop offset="100%" stopColor="#4f46e5"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Picture */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Profile Picture</label>
            <div className="flex items-center gap-6">
              <div className="relative">
                {profileData.profilePicture ? (<img src={profileData.profilePicture} alt="Profile" className="w-24 h-24 rounded-xl object-cover border-4 border-gray-200"/>) : (<div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center border-4 border-gray-200">
                    <MdPerson className="w-12 h-12 text-white"/>
                  </div>)}
                <label htmlFor="profile-picture" className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                  <MdCameraAlt className="w-4 h-4 text-white"/>
                  <input type="file" id="profile-picture" accept="image/*" onChange={handleProfilePictureChange} className="hidden"/>
                </label>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  Upload a profile picture. Recommended size: 400x400 pixels. Max size: 5MB
                </p>
                <button onClick={() => document.getElementById('profile-picture')?.click()} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Change Picture
                </button>
              </div>
            </div>
          </div>

          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-900 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input type="text" id="firstName" value={profileData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white" placeholder="Enter first name"/>
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-900 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input type="text" id="lastName" value={profileData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white" placeholder="Enter last name"/>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="userName" className="block text-sm font-semibold text-gray-900 mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MdPerson className="w-5 h-5 text-gray-400"/>
              </div>
              <input type="text" id="userName" value={profileData.userName} onChange={(e) => handleInputChange('userName', e.target.value)} className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white" placeholder="Enter username"/>
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MdEmail className="w-5 h-5 text-gray-400"/>
              </div>
              <input type="email" id="email" value={profileData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white" placeholder="Enter email"/>
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label htmlFor="mobileNumber" className="block text-sm font-semibold text-gray-900 mb-2">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MdPhone className="w-5 h-5 text-gray-400"/>
              </div>
              <input type="tel" id="mobileNumber" value={profileData.mobileNumber} onChange={(e) => handleInputChange('mobileNumber', e.target.value)} className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white" placeholder="Enter mobile number"/>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-semibold text-gray-900 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MdBusiness className="w-5 h-5 text-gray-400"/>
              </div>
              <input type="text" id="companyName" value={profileData.companyName} onChange={(e) => handleInputChange('companyName', e.target.value)} className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white" placeholder="Enter company name"/>
            </div>
          </div>

          {/* Company URL */}
          <div>
            <label htmlFor="companyUrl" className="block text-sm font-semibold text-gray-900 mb-2">
              Company URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MdPublic className="w-5 h-5 text-gray-400"/>
              </div>
              <input type="url" id="companyUrl" value={profileData.companyUrl} onChange={(e) => handleInputChange('companyUrl', e.target.value)} className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white" placeholder="https://example.com"/>
            </div>
          </div>

        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Profile Settings Component */}
      <ProfileSettings activeTab={activeTab || 'password'}/>

      {/* Account Actions Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Account Actions</h2>

        <div className="space-y-4">
          {/* Logout Button */}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700 text-sm font-medium">
            <MdLogout className="w-5 h-5 text-gray-500"/>
            <span>Logout</span>
          </button>

          {/* Logout from All Devices Button */}
          <button onClick={handleLogoutAllDevices} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-300 hover:bg-red-50 transition-colors text-red-600 text-sm font-medium">
            <MdPowerSettingsNew className="w-5 h-5"/>
            <span>Logout from All Devices</span>
          </button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=ProfilePage.js.map