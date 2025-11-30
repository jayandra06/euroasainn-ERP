/**
 * Profile Settings Component
 * Contains all profile settings: Password, Security, Language, Timezone, Date Format
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/shared/Toast';
import { authenticatedFetch } from '../../lib/api';
import { MdLock, MdSecurity, MdTranslate, MdAccessTime, MdCalendarToday, MdKeyboardArrowDown } from 'react-icons/md';

interface ProfileSettingsProps {
  activeTab?: 'password' | 'security' | 'language' | 'timezone' | 'date-format';
}

export function ProfileSettings({ activeTab = 'password' }: ProfileSettingsProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState<'password' | 'security' | 'language' | 'timezone' | 'date-format'>(activeTab);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: 'password' | 'security' | 'language' | 'timezone' | 'date-format') => {
    setCurrentTab(tab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tab);
    navigate(`/profile?${newSearchParams.toString()}`, { replace: true });
  };

  const tabs = [
    { id: 'password' as const, label: 'Change/Reset Password', icon: MdLock },
    { id: 'security' as const, label: 'Security Questions', icon: MdSecurity },
    { id: 'language' as const, label: 'Language Selection', icon: MdTranslate },
    { id: 'timezone' as const, label: 'Time Zone', icon: MdAccessTime },
    { id: 'date-format' as const, label: 'Date and Time Format', icon: MdCalendarToday },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h2>

      {/* Settings List - Vertical Layout */}
      <div className="space-y-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-gray-50 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
              </div>
              <MdKeyboardArrowDown
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                  isActive ? 'text-gray-900 rotate-180' : 'text-gray-400'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Content Area - Shows below settings list */}
      <div className="border-t border-gray-200 pt-6">
        {currentTab === 'password' && <PasswordSettings />}
        {currentTab === 'security' && <SecurityQuestionsSettings />}
        {currentTab === 'language' && <LanguageSettings />}
        {currentTab === 'timezone' && <TimezoneSettings />}
        {currentTab === 'date-format' && <DateFormatSettings />}
      </div>
    </div>
  );
}

// Password Settings Component
function PasswordSettings() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await authenticatedFetch('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h3>
        <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-900 mb-2">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-900 mb-2">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white"
            placeholder="Enter new password"
          />
          <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white"
            placeholder="Confirm new password"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}

// Security Questions Settings Component
function SecurityQuestionsSettings() {
  const { showToast } = useToast();
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const securityQuestions = [
    'What was the name of your first pet?',
    'What city were you born in?',
    'What was your mother\'s maiden name?',
    'What was the name of your elementary school?',
    'What was your favorite food as a child?',
  ];

  const handleSave = async () => {
    if (!selectedQuestion || !answer.trim()) {
      showToast('Please select a security question and provide an answer', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await authenticatedFetch('/api/v1/auth/security-question', {
        method: 'PUT',
        body: JSON.stringify({
          question: selectedQuestion,
          answer: answer.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save security question');
      }

      showToast('Security question saved successfully', 'success');
      setSelectedQuestion('');
      setAnswer('');
    } catch (error: any) {
      showToast(error.message || 'Failed to save security question', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Questions</h3>
        <p className="text-sm text-gray-600">Set up a security question to help recover your account</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="securityQuestion" className="block text-sm font-semibold text-gray-900 mb-2">
            Select a Security Question
          </label>
          <select
            id="securityQuestion"
            value={selectedQuestion}
            onChange={(e) => setSelectedQuestion(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white appearance-none pr-10"
          >
            <option value="">Select a security question</option>
            {securityQuestions.map((question, index) => (
              <option key={index} value={question}>
                {question}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="securityAnswer" className="block text-sm font-semibold text-gray-900 mb-2">
            Your Answer
          </label>
          <input
            type="text"
            id="securityAnswer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Security Question'}
        </button>
      </div>
    </div>
  );
}

// Language Settings Component
function LanguageSettings() {
  const { showToast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isSaving, setIsSaving] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'fr', name: 'French (Français)' },
    { code: 'es', name: 'Spanish (Español)' },
    { code: 'it', name: 'Italian (Italiano)' },
    { code: 'pt', name: 'Portuguese (Português)' },
    { code: 'nl', name: 'Dutch (Nederlands)' },
    { code: 'pl', name: 'Polish (Polski)' },
    { code: 'ru', name: 'Russian (Русский)' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch('/api/v1/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save language preference');
      }

      showToast('Language preference saved successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to save language preference', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Language Selection</h3>
        <p className="text-sm text-gray-600">Choose your preferred language for the interface</p>
      </div>

      <div>
        <label htmlFor="language" className="block text-sm font-semibold text-gray-900 mb-2">
          Select Language
        </label>
        <select
          id="language"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Language'}
        </button>
      </div>
    </div>
  );
}

// Timezone Settings Component
function TimezoneSettings() {
  const { showToast } = useToast();
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [isSaving, setIsSaving] = useState(false);

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch('/api/v1/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          timezone: selectedTimezone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save timezone');
      }

      showToast('Timezone saved successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to save timezone', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Zone</h3>
        <p className="text-sm text-gray-600">Set your timezone to display dates and times correctly</p>
      </div>

      <div>
        <label htmlFor="timezone" className="block text-sm font-semibold text-gray-900 mb-2">
          Select Time Zone
        </label>
        <select
          id="timezone"
          value={selectedTimezone}
          onChange={(e) => setSelectedTimezone(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Timezone'}
        </button>
      </div>
    </div>
  );
}

// Date Format Settings Component
function DateFormatSettings() {
  const { showToast } = useToast();
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [isSaving, setIsSaving] = useState(false);

  const dateFormats = [
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
    'DD MMM YYYY',
    'MMM DD, YYYY',
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch('/api/v1/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          dateFormat,
          timeFormat,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save date and time format');
      }

      showToast('Date and time format saved successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to save date and time format', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Date and Time Format</h3>
        <p className="text-sm text-gray-600">Customize how dates and times are displayed</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="dateFormat" className="block text-sm font-semibold text-gray-900 mb-2">
            Date Format
          </label>
          <select
            id="dateFormat"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white"
          >
            {dateFormats.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="timeFormat" className="block text-sm font-semibold text-gray-900 mb-2">
            Time Format
          </label>
          <select
            id="timeFormat"
            value={timeFormat}
            onChange={(e) => setTimeFormat(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-gray-900 bg-white"
          >
            <option value="12h">12-hour (AM/PM)</option>
            <option value="24h">24-hour</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Format'}
        </button>
      </div>
    </div>
  );
}

