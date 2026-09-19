import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminEmailSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>({
    smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', encryption: 'STARTTLS',
    imapHost: '', imapPort: 993, imapUser: '', imapPass: ''
  });

  useEffect(() => {
    api.get('/email-settings').then(res => setSettings(res.data));
  }, []);

  const handleChange = (field: string, value: string | number) => {
    setSettings({ ...settings, [field]: value });
  };

  const applyPreset = (provider: string) => {
    if (provider === 'gmail') {
      setSettings({
        ...settings,
        smtpHost: 'smtp.gmail.com', smtpPort: 465, encryption: 'SSL',
        imapHost: 'imap.gmail.com', imapPort: 993
      });
    } else if (provider === 'office365') {
      setSettings({
        ...settings,
        smtpHost: 'smtp.office365.com', smtpPort: 587, encryption: 'STARTTLS',
        imapHost: 'outlook.office365.com', imapPort: 993
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/email-settings', settings);
      alert('Email settings saved! Backend will now use your SMTP configuration.');
    } catch (err) {
      alert('Failed to save settings.');
    }
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      {/* Quick Presets */}
      <div className="clay p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 text-gray-700">Quick Presets</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => applyPreset('gmail')} className="clay-button clay-sm text-red-600 px-4 py-2 text-sm font-medium w-full sm:w-auto">Gmail</button>
          <button onClick={() => applyPreset('office365')} className="clay-button clay-sm text-blue-600 px-4 py-2 text-sm font-medium w-full sm:w-auto">Microsoft 365</button>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="clay p-6 space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-700">SMTP Settings (Outbound Mail)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">SMTP Host</label>
              <input type="text" value={settings.smtpHost} onChange={(e) => handleChange('smtpHost', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">SMTP Port</label>
              <input type="number" value={settings.smtpPort} onChange={(e) => handleChange('smtpPort', Number(e.target.value))} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">SMTP Username</label>
              <input type="text" value={settings.smtpUser} onChange={(e) => handleChange('smtpUser', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">SMTP Password</label>
              <input type="password" value={settings.smtpPass} onChange={(e) => handleChange('smtpPass', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-600">Connection Security</label>
              <select value={settings.encryption} onChange={(e) => handleChange('encryption', e.target.value)} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700">
                <option value="NONE">None (Not recommended)</option>
                <option value="STARTTLS">STARTTLS (Port 587)</option>
                <option value="SSL">SSL/TLS (Port 465)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">IMAP Settings (Inbound Mail - Future Use)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">IMAP Host</label>
              <input type="text" value={settings.imapHost} onChange={(e) => handleChange('imapHost', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" placeholder="imap.gmail.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">IMAP Port</label>
              <input type="number" value={settings.imapPort} onChange={(e) => handleChange('imapPort', Number(e.target.value))} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">IMAP Username</label>
              <input type="text" value={settings.imapUser} onChange={(e) => handleChange('imapUser', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">IMAP Password</label>
              <input type="password" value={settings.imapPass} onChange={(e) => handleChange('imapPass', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <button type="submit" className="clay-button clay-sm text-blue-600 bg-blue-600 px-6 py-2 text-sm font-medium">
            Save Mail Settings
          </button>
        </div>
      </form>
    </div>
  );
}