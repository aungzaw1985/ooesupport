import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

interface FormField {
  id: number;
  name: string;
  type: string;
  visibility: string;
  options?: any[];
}

export default function NewTicket() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/forms').then(res => setForms(res.data));
    // Fetch users so the agent can select one
    api.get('/users').then(res => setUsers(res.data));
  }, []);

  const handleFormChange = (formId: number) => {
    setSelectedFormId(formId);
    setCustomData({});
    setSubject('');
    setMessage('');
  };

  const handleCustomFieldChange = (fieldName: string, value: string) => {
    setCustomData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedFormId) {
      setError('Please select a Help Topic first.');
      return;
    }

    if (!selectedUserId) {
      setError('Please select a User.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/tickets', {
        subject, 
        message, 
        customData, 
        formId: selectedFormId,
        userId: selectedUserId // Pass the selected user ID
      });
      navigate('/dashboard'); 
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create ticket.');
      setLoading(false);
    }
  };

  const selectedForm = forms.find((f) => f.id === selectedFormId);
  
  // Filter users based on search input
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/dashboard')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Queue
      </button>

      <div className="clay p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-6 text-gray-700">Create New Ticket</h2>
        {error && <p className="text-red-500 mb-4 text-sm bg-red-50 p-2 rounded">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Help Topic Selection */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Help Topic <span className="text-red-500">*</span></label>
            <select value={selectedFormId || ''} onChange={(e) => handleFormChange(Number(e.target.value))} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none" required>
              <option value="" disabled>Select a topic...</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>{form.title}</option>
              ))}
            </select>
          </div>

                    {/* User Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1 text-gray-600">Select User <span className="text-red-500">*</span></label>
            
            {selectedUserId ? (
              // View: User is selected -> Show their name and a clear button
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#e6ebf2]">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {users.find(u => u.id === selectedUserId)?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {users.find(u => u.id === selectedUserId)?.email}
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setSelectedUserId(''); setUserSearch(''); }} 
                  className="clay-button clay-sm text-red-600 px-3 py-1 text-xs"
                >
                  Change
                </button>
              </div>
            ) : (
              // View: No user selected -> Show search input and filtered list
              <>
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={userSearch} 
                  onChange={(e) => setUserSearch(e.target.value)} 
                  className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700"
                />
                <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                  {filteredUsers.length === 0 ? (
                    <p className="p-3 text-sm text-gray-400">No users found.</p>
                  ) : (
                    filteredUsers.map((u) => (
                      <button 
                        type="button"
                        key={u.id} 
                        onClick={() => { setSelectedUserId(u.id); setUserSearch(''); }} 
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-700">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {selectedForm && (
            <div className="space-y-4 pt-4 border-t mt-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Subject</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Issue Description</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none h-32" required />
              </div>

              {selectedForm.fields && selectedForm.fields.length > 0 && (
                <div className="p-4 rounded-xl bg-[#e6ebf2] space-y-4">
                  <h3 className="font-semibold text-sm text-gray-700">{selectedForm.title} Details</h3>
                  {selectedForm.fields.map((field: FormField) => {
                    const isRequired = ['REQUIRED', 'REQUIRED_AGENTS', 'INTERNAL_REQUIRED'].includes(field.visibility);
                    return (
                      <div key={field.id}>
                        <label className="block text-sm font-medium mb-1 text-gray-600">
                          {field.name} {isRequired && <span className="text-red-500">*</span>}
                          {field.visibility.includes('INTERNAL') && <span className="ml-2 text-xs text-yellow-600 font-bold">(Internal)</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea className="w-full px-4 py-2 clay-input text-sm focus:outline-none" value={customData[field.name] || ''} onChange={(e) => handleCustomFieldChange(field.name, e.target.value)} required={isRequired} />
                        ) : field.type === 'list' ? (
                          <select className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none" value={customData[field.name] || ''} onChange={(e) => handleCustomFieldChange(field.name, e.target.value)} required={isRequired}>
                            <option value="">Select an option...</option>
                            {field.options?.map((opt) => (<option key={opt.id} value={opt.value}>{opt.value}</option>))}
                          </select>
                        ) : (
                          <input type={field.type} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" value={customData[field.name] || ''} onChange={(e) => handleCustomFieldChange(field.name, e.target.value)} required={isRequired} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedForm && (
            <button 
              type="submit" 
              disabled={loading} 
              className="clay-button clay-sm w-full text-blue-800 bg-blue-600 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}