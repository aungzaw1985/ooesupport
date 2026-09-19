import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminCompanySettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const fetchSettings = async () => {
    const res = await api.get('/company-settings');
    setSettings(res.data);
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleChange = (field: string, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/company-settings', {
      companyName: settings.companyName,
      themeColor: settings.themeColor,
      landingTitle: settings.landingTitle,
      landingSubtitle: settings.landingSubtitle,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
      address: settings.address,
    });
    alert('Company settings saved!');
  };

  const handleLogoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoFile) return;
    const formData = new FormData();
    formData.append('file', logoFile);
    
    try {
      await api.post('/company-settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchSettings();
      alert('Logo uploaded successfully!');
    } catch (err) {
      alert('Failed to upload logo.');
    }
  };

  const handleFaviconUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faviconFile) return;
    const formData = new FormData();
    formData.append('file', faviconFile);
    
    try {
      const res = await api.post('/company-settings/favicon', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSettings({ ...settings, faviconUrl: res.data.url });
      setFaviconFile(null);
      alert('Favicon updated successfully!');
    } catch (err) {
      alert('Failed to upload favicon.');
    }
  };

  if (!settings) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Branding & Landing Page Content */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-6 text-gray-700">Branding & Landing Page</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Company Name</label>
              <input value={settings.companyName || ''} onChange={(e) => handleChange('companyName', e.target.value)} className="w-full px-4 py-2 clay-input text-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Theme Color (Hex)</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={settings.themeColor || '#3b82f6'} onChange={(e) => handleChange('themeColor', e.target.value)} className="h-10 w-12 rounded cursor-pointer border-none" />
                <input value={settings.themeColor || ''} onChange={(e) => handleChange('themeColor', e.target.value)} className="flex-1 px-4 py-2 clay-input text-sm" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <label className="block text-sm font-medium mb-1 text-gray-600">Landing Page Title</label>
              <input value={settings.landingTitle || ''} onChange={(e) => handleChange('landingTitle', e.target.value)} className="w-full px-4 py-2 clay-input text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Landing Page Subtitle</label>
              <textarea value={settings.landingSubtitle || ''} onChange={(e) => handleChange('landingSubtitle', e.target.value)} className="w-full px-4 py-2 clay-input text-sm h-24" />
            </div>

            <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium">Save Content</button>
          </form>
        </div>

        {/* Logo Upload & Contact Info */}
        <div className="space-y-8">
          <div className="clay p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Company Logo</h2>
            {settings.logoUrl && (
              <div className="mb-4 p-4 bg-[#e6ebf2] rounded-xl flex justify-center">
                <img src={settings.logoUrl} alt="Company Logo" className="h-20 object-contain" />
              </div>
            )}
            <form onSubmit={handleLogoUpload} className="space-y-3">
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <button type="submit" disabled={!logoFile} className="clay-button clay-sm w-full text-green-800 bg-blue-600 py-2 text-sm font-medium disabled:opacity-50">Upload Logo</button>
            </form>
          </div>

          <div className="clay p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Browser Favicon</h2>
            <div className="flex items-center gap-4 mb-4">
              <p className="text-sm text-gray-500">Current Favicon:</p>
              {settings.faviconUrl ? (
                <img src={settings.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain rounded-md shadow-sm" />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-blue-800 text-xs font-bold">Z</div>
              )}
            </div>
            <form onSubmit={handleFaviconUpload} className="space-y-3">
              <input 
                type="file" 
                accept="image/png,image/x-icon,image/svg+xml" 
                onChange={(e) => setFaviconFile(e.target.files?.[0] || null)} 
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              />
              <button type="submit" disabled={!faviconFile} className="clay-button clay-sm w-full text-blue-800 bg-blue-600 py-2 text-sm font-medium disabled:opacity-50">
                Upload Favicon
              </button>
              <p className="text-xs text-gray-400">Recommended: 32x32 PNG or ICO file.</p>
            </form>
          </div>

          <div className="clay p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Support Contact Info</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Support Email</label>
                <input value={settings.supportEmail || ''} onChange={(e) => handleChange('supportEmail', e.target.value)} className="w-full px-4 py-2 clay-input text-sm" placeholder="support@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Support Phone</label>
                <input value={settings.supportPhone || ''} onChange={(e) => handleChange('supportPhone', e.target.value)} className="w-full px-4 py-2 clay-input text-sm" placeholder="+1 555-0198" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Address</label>
                <textarea value={settings.address || ''} onChange={(e) => handleChange('address', e.target.value)} className="w-full px-4 py-2 clay-input text-sm h-20" placeholder="123 Main St, City, Country" />
              </div>
              <button type="submit" className="clay-button clay-sm w-full text-blue-800 bg-blue-600 py-2 text-sm font-medium">Save Contact Info</button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
