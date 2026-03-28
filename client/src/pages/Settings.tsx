import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authApi, calendarApi } from '../lib/api';
import type { AuthStatus } from '../types';
import api from '../lib/api';

interface AppSettingsForm {
  family_name: string;
  timezone: string;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    google: { connected: false },
    microsoft: { connected: false },
  });
  const [appSettings, setAppSettings] = useState<AppSettingsForm>({
    family_name: 'Our Family',
    timezone: 'America/New_York',
  });
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState('primary');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'google') {
      showNotification('success', '✅ Google Calendar connected successfully!');
      setSearchParams({});
      loadData();
    } else if (connected === 'microsoft') {
      showNotification('success', '✅ Microsoft To Do connected successfully!');
      setSearchParams({});
      loadData();
    } else if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: 'Google authentication failed. Please try again.',
        microsoft_auth_failed: 'Microsoft authentication failed. Please try again.',
        no_code: 'Authentication was cancelled.',
      };
      showNotification('error', errorMessages[error] || `Authentication error: ${error}`);
      setSearchParams({});
    }
  }, [searchParams]);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = async () => {
    try {
      const status = await authApi.getStatus();
      setAuthStatus(status);

      // Load app settings
      try {
        const settingsRes = await api.get('/settings');
        if (settingsRes.data) {
          setAppSettings({
            family_name: settingsRes.data.family_name || 'Our Family',
            timezone: settingsRes.data.timezone || 'America/New_York',
          });
        }
      } catch {
        // Settings endpoint might not exist, use defaults
      }

      // Load Google calendars if connected
      if (status.google.connected) {
        try {
          const cals = await calendarApi.getCalendars();
          setCalendars(cals);
        } catch {
          // Ignore calendar list error
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Disconnect Google Calendar?')) return;
    try {
      await authApi.disconnectGoogle();
      setAuthStatus(prev => ({ ...prev, google: { connected: false } }));
      setCalendars([]);
      showNotification('success', 'Google Calendar disconnected.');
    } catch (err) {
      showNotification('error', 'Failed to disconnect.');
    }
  };

  const handleDisconnectMicrosoft = async () => {
    if (!confirm('Disconnect Microsoft To Do?')) return;
    try {
      await authApi.disconnectMicrosoft();
      setAuthStatus(prev => ({ ...prev, microsoft: { connected: false } }));
      showNotification('success', 'Microsoft To Do disconnected.');
    } catch (err) {
      showNotification('error', 'Failed to disconnect.');
    }
  };

  const handleSaveCalendarSettings = async () => {
    try {
      await calendarApi.updateSettings({ google_calendar_id: selectedCalendar });
      showNotification('success', 'Calendar settings saved!');
    } catch (err) {
      showNotification('error', 'Failed to save calendar settings.');
    }
  };

  const handleSaveAppSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/settings', appSettings);
      showNotification('success', 'Settings saved!');
    } catch (err) {
      // Try POST if PUT fails (first time)
      try {
        await api.post('/settings', appSettings);
        showNotification('success', 'Settings saved!');
      } catch {
        showNotification('error', 'Failed to save settings.');
      }
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl border animate-fade-in ${
          notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {notification.msg}
        </div>
      )}

      {/* Family Settings */}
      <div className="card mb-6">
        <h2 className="section-title">👨‍👩‍👧‍👦 Family Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Family Name</label>
            <input
              type="text"
              value={appSettings.family_name}
              onChange={e => setAppSettings({ ...appSettings, family_name: e.target.value })}
              className="input max-w-sm"
              placeholder="e.g. The Smith Family"
            />
          </div>
          <div>
            <label className="label">Timezone</label>
            <select
              value={appSettings.timezone}
              onChange={e => setAppSettings({ ...appSettings, timezone: e.target.value })}
              className="input max-w-sm"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSaveAppSettings}
            disabled={savingSettings}
            className="btn-primary"
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Google Calendar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl">
              📅
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Google Calendar</h2>
              <p className="text-sm text-gray-500">Sync family events from Google Calendar</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            authStatus.google.connected
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {authStatus.google.connected ? '● Connected' : '○ Not connected'}
          </div>
        </div>

        {authStatus.google.connected ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              ✅ Your Google Calendar is connected and events are syncing.
            </div>

            {calendars.length > 0 && (
              <div>
                <label className="label">Select Calendar</label>
                <select
                  value={selectedCalendar}
                  onChange={e => setSelectedCalendar(e.target.value)}
                  className="input max-w-sm"
                >
                  <option value="primary">Primary Calendar</option>
                  {calendars.map((cal: any) => (
                    <option key={cal.id} value={cal.id}>{cal.summary}</option>
                  ))}
                </select>
                <button onClick={handleSaveCalendarSettings} className="btn-primary mt-2">
                  Save Calendar
                </button>
              </div>
            )}

            <button onClick={handleDisconnectGoogle} className="btn-danger">
              Disconnect Google Calendar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <strong>Setup required:</strong> You need to configure Google OAuth credentials in your .env file.
              <br />
              Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from the Google Cloud Console.
            </div>
            <button
              onClick={authApi.connectGoogle}
              className="btn-primary bg-red-600 hover:bg-red-700 border-red-600"
            >
              <span>🔗</span> Connect Google Calendar
            </button>
          </div>
        )}
      </div>

      {/* Microsoft To Do */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">
              ✅
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Microsoft To Do</h2>
              <p className="text-sm text-gray-500">Sync shopping list with Microsoft To Do</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            authStatus.microsoft.connected
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {authStatus.microsoft.connected ? '● Connected' : '○ Not connected'}
          </div>
        </div>

        {authStatus.microsoft.connected ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              ✅ Microsoft To Do is connected. Go to Shopping to sync your grocery list.
            </div>
            <button onClick={handleDisconnectMicrosoft} className="btn-danger">
              Disconnect Microsoft To Do
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <strong>Setup required:</strong> Configure Microsoft OAuth credentials in your .env file.
              <br />
              Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET from the Azure Portal.
            </div>
            <button
              onClick={authApi.connectMicrosoft}
              className="btn-primary bg-blue-600 hover:bg-blue-700"
            >
              <span>🔗</span> Connect Microsoft To Do
            </button>
          </div>
        )}
      </div>

      {/* Google Keep Note */}
      <div className="card mb-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-yellow-200 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            📓
          </div>
          <div>
            <h2 className="font-bold text-yellow-900">Google Keep</h2>
            <p className="text-sm text-yellow-700 mt-1">
              Google Keep does not have an official public API, so direct integration is not available.
              As an alternative, you can:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
              <li>Use the built-in manual shopping list</li>
              <li>Connect Microsoft To Do for cloud sync</li>
              <li>Export items from Google Keep and add them manually</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Environment Setup Guide */}
      <div className="card bg-gray-50 border-gray-200">
        <h2 className="section-title">🔧 Environment Setup</h2>
        <p className="text-sm text-gray-600 mb-4">
          To enable integrations, create a <code className="bg-gray-200 px-1 rounded">.env</code> file
          in the root directory with these variables:
        </p>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto">
{`# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Microsoft OAuth (from Azure Portal)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3001/api/auth/microsoft/callback

# App
SESSION_SECRET=change_this_to_a_random_secret
PORT=3001`}
        </pre>
      </div>
    </div>
  );
}
