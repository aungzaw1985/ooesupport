import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/users/me').then(res => {
      setProfile(res.data);
      setName(res.data.name);
      setPhone(res.data.phone || '');
      setEmail(res.data.email);
      setPhotoUrl(res.data.photoUrl || '');
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch('/users/me', { name, phone, password: newPassword || undefined });
      setNewPassword('');
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/users/me/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPhotoUrl(res.data.url);
      alert('Photo updated!');
    } catch (err) {
      alert('Failed to upload photo.');
    }
  };

  if (!profile) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/portal')} className="mb-4 text-green-600 hover:underline text-sm">
        &larr; Back to My Tickets
      </button>

      <div className="clay p-6 max-w-2xl mx-auto">
        
        {/* Profile Photo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-28 h-28 mb-4">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-28 h-28 rounded-full object-cover shadow-md" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-green-600 flex items-center justify-center text-blue-800 text-4xl font-bold shadow-md">
                {name.charAt(0)}
              </div>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 border border-gray-200"
              title="Change Photo"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
          </div>
          <h2 className="text-xl font-bold text-gray-700">{name}</h2>
          <p className="text-sm text-gray-500">{email}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Email Address (Read-only)</label>
            <input type="email" value={email} readOnly className="w-full px-4 py-2 clay-input text-sm bg-gray-100 cursor-not-allowed text-gray-500" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Contact Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" placeholder="+1 555-0198" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Change Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" placeholder="Leave blank to keep current password" />
          </div>

          <div className="pt-4">
            <button type="submit" className="clay-button clay-sm text-blue-800 bg-green-600 px-6 py-2 text-sm font-medium">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}