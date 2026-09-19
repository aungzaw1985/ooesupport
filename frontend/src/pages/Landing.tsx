import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    api.get('/company-settings').then(res => setSettings(res.data));
  }, []);

  if (!settings) return <div className="min-h-screen bg-[#f0f4f8]"></div>;

  // Fallback to defaults if empty in DB
  const themeColor = settings.themeColor || '#3b82f6';
  const title = settings.landingTitle || 'Modern Ticketing, Seamless Support.';
  const subtitle = settings.landingSubtitle || 'A powerful, real-time helpdesk platform designed to streamline your customer support workflow. Built for speed, scalability, and simplicity.';
  const companyName = settings.companyName || 'Zenith Support';

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto" />
              ) : (
                <span className="text-2xl font-bold" style={{ color: themeColor }}>{companyName.split(' ')[0]}<span className="text-gray-900">{companyName.split(' ')[1] || ''}</span></span>
              )}
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <a href="#features" className="hidden md:block text-gray-500 hover:text-gray-900 text-sm font-medium">Features</a>
              <button onClick={() => navigate('/portal/login')} className="text-gray-500 hover:text-gray-900 text-sm font-medium">Customer Portal</button>
              <button onClick={() => navigate('/login')} className="text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90" style={{ backgroundColor: themeColor }}>
                Agent Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-white" style={{ background: `linear-gradient(to bottom right, ${themeColor}, #1e3a8a)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto mb-10">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => navigate('/portal/login')} className="bg-white px-8 py-3 rounded-md font-semibold text-lg shadow-lg hover:bg-gray-100 transition transform hover:scale-105" style={{ color: themeColor }}>
              Customer Login
            </button>
            <button onClick={() => navigate('/login')} className="border-2 border-blue-400 px-8 py-3 rounded-md font-semibold text-lg shadow-lg hover:bg-blue-800 transition transform hover:scale-105">
              Agent Login
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Everything you need to resolve issues faster</h2>
          <p className="mt-4 text-lg text-gray-500">Powerful features bundled into an intuitive interface.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6 w-16 h-16 mx-auto rounded-full" style={{ backgroundColor: `${themeColor}20` }}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ color: themeColor }}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Updates</h3>
            <p className="text-gray-500">Instantly see ticket updates and new messages without ever refreshing your browser.</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center items-center mb-6 w-16 h-16 mx-auto bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Dynamic Forms</h3>
            <p className="text-gray-500">Create custom ticket fields on the fly to capture exactly the information you need.</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center items-center mb-6 w-16 h-16 mx-auto bg-yellow-100 rounded-full">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Integration</h3>
            <p className="text-gray-500">Customers can create tickets and reply directly from their email inbox.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          
          {/* Render Logo if it exists, otherwise fallback to text */}
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt="Company Logo" 
              className="h-10 w-auto mx-auto mb-4 object-contain" 
              // Removed brightness-0 invert just in case your logo is transparent or already white
            />
          ) : (
            <h3 className="text-lg font-bold mb-2">{companyName}</h3>
          )}

          {settings.supportEmail && <p className="text-sm text-gray-400">{settings.supportEmail}</p>}
          {settings.supportPhone && <p className="text-sm text-gray-400">{settings.supportPhone}</p>}
          {settings.address && <p className="text-sm text-gray-400 mt-2">{settings.address}</p>}
          
          <p className="text-sm text-gray-500 mt-8 border-t border-gray-700 pt-8">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved. Powered by NestJS, React, and PostgreSQL.
          </p>
        </div>
      </footer>
    </div>
  );
}