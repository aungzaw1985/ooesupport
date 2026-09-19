import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminEmailTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Create form state
  const [type, setType] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  const fetchTemplates = async () => {
    const res = await api.get('/email-templates');
    setTemplates(res.data);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !subject || !body) return;
    try {
      await api.post('/email-templates', { type, subject, body });
      setType(''); setSubject(''); setBody('');
      fetchTemplates();
    } catch (err) {
      console.error('Failed to create template', err);
      alert('Failed to create template. Ensure the Type is unique.');
    }
  };

  const startEditing = (tpl: any) => {
    setEditingId(tpl.id);
    setEditSubject(tpl.subject);
    setEditBody(tpl.body);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: number) => {
    try {
      await api.patch(`/email-templates/${id}`, { subject: editSubject, body: editBody });
      setEditingId(null);
      fetchTemplates();
    } catch (err) {
      console.error('Failed to update template', err);
      alert('Failed to save changes.');
    }
  };

  const handleToggle = async (id: number, isEnabled: boolean) => {
    try {
      await api.patch(`/email-templates/${id}`, { isEnabled: !isEnabled });
      fetchTemplates();
    } catch (err) {
      console.error('Failed to toggle template', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this template?')) {
      try {
        await api.delete(`/email-templates/${id}`);
        fetchTemplates();
      } catch (err) {
        console.error('Failed to delete template', err);
      }
    }
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create Template Form */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Create New Template</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Event Type (e.g., TICKET_CREATED)</label>
              <input 
                type="text" 
                value={type} 
                onChange={(e) => setType(e.target.value.toUpperCase().replace(/\s/g, '_'))} 
                className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" 
                placeholder="TICKET_ASSIGNED" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Subject</label>
              <input 
                type="text" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" 
                placeholder="Your ticket {{ticketNumber}} has been updated" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Body</label>
              <textarea 
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700 h-32" 
                placeholder="Hello,&#10;An agent has replied to your ticket:&#10;&#10;{{message}}" 
                required 
              />
              <p className="text-xs text-gray-400 mt-1">Variables: <code>{`{{ticketNumber}}`}</code>, <code>{`{{subject}}`}</code>, <code>{`{{message}}`}</code></p>
            </div>
            <button type="submit" className="clay-button clay-sm w-full text-blue-800 bg-blue-600 py-2 text-sm font-medium">Save Template</button>
          </form>
        </div>

        {/* Existing Templates List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Active Templates</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {templates.length === 0 && <p className="text-sm text-gray-500">No templates created yet.</p>}
            {templates.map((tpl) => (
              <div key={tpl.id} className="p-4 rounded-xl bg-[#e6ebf2]">
                
                {/* Edit Mode */}
                {editingId === tpl.id ? (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-gray-700">{tpl.type.replace(/_/g, ' ')}</h3>
                    <input 
                      type="text" 
                      value={editSubject} 
                      onChange={(e) => setEditSubject(e.target.value)} 
                      className="w-full px-3 py-2 clay-input text-sm focus:outline-none text-gray-700" 
                    />
                    <textarea 
                      value={editBody} 
                      onChange={(e) => setEditBody(e.target.value)} 
                      className="w-full px-3 py-2 clay-input text-sm focus:outline-none text-gray-700 h-32" 
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(tpl.id)} className="clay-button clay-sm text-green-600 bg-green-600 px-4 py-1 text-xs">Save Changes</button>
                      <button onClick={cancelEditing} className="clay-button clay-sm text-gray-700 px-4 py-1 text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-sm text-gray-700">{tpl.type.replace(/_/g, ' ')}</h3>
                      <div className="flex items-center gap-3">
                        <button onClick={() => startEditing(tpl)} className="clay-button clay-sm text-blue-600 px-2 py-1 text-xs">Edit</button>
                        {/* Toggle Switch */}
                        <button 
                          onClick={() => handleToggle(tpl.id, tpl.isEnabled)}
                          className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${tpl.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tpl.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <button onClick={() => handleDelete(tpl.id)} className="clay-button clay-sm text-red-600 px-2 py-1 text-xs">Delete</button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      <span className="font-bold">Subject:</span> {tpl.subject}
                    </div>
                    <div className="text-xs text-gray-500 bg-white p-2 rounded-md border border-gray-200 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {tpl.body}
                    </div>
                    <p className="text-xs mt-2 font-medium">
                      Status: 
                      <span className={`ml-1 ${tpl.isEnabled ? 'text-green-600' : 'text-red-500'}`}>
                        {tpl.isEnabled ? 'Enabled (Sending)' : 'Disabled (Paused)'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}