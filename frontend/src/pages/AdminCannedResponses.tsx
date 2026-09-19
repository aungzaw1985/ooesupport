import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminCannedResponses() {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<any[]>([]);
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchResponses = async () => {
    try {
      const res = await api.get('/canned-responses');
      setResponses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchResponses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !body.trim()) {
      setError('Title and Body are required.');
      return;
    }

    try {
      if (editingId) {
        await api.patch(`/canned-responses/${editingId}`, { title, body });
      } else {
        await api.post('/canned-responses', { title, body });
      }
      setTitle('');
      setBody('');
      setEditingId(null);
      fetchResponses();
    } catch (err) {
      setError('Failed to save canned response.');
    }
  };

  const handleEdit = (response: any) => {
    setEditingId(response.id);
    setTitle(response.title);
    setBody(response.body);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this canned response?')) {
      try {
        await api.delete(`/canned-responses/${id}`);
        fetchResponses();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCancel = () => {
    setTitle('');
    setBody('');
    setEditingId(null);
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create/Edit Form */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">
            {editingId ? 'Edit Canned Response' : 'Create Canned Response'}
          </h2>
          {error && <p className="text-red-500 mb-4 text-sm bg-red-50 p-2 rounded">{error}</p>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Title (Internal Name)</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" 
                placeholder="e.g., Password Reset Instructions" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Message Body</label>
              <textarea 
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700 h-40" 
                placeholder="Hi {{user.name}},&#10;&#10;To reset your password, please go to..." 
                required 
              />
              <p className="text-xs text-gray-400 mt-1">
                Variables: <code>{`{{user.name}}`}</code>, <code>{`{{ticket.number}}`}</code>
              </p>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="clay-button clay-sm text-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium">
                {editingId ? 'Update Response' : 'Save Response'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="clay-button clay-sm text-gray-700 px-4 py-2 text-sm font-medium">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Responses List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Existing Responses ({responses.length})</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {responses.length === 0 && <p className="text-sm text-gray-500">No canned responses created yet.</p>}
            {responses.map((res) => (
              <div key={res.id} className="p-4 rounded-xl bg-[#e6ebf2]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm text-gray-700">{res.title}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(res)} className="clay-button clay-sm text-blue-600 px-2 py-1 text-xs">Edit</button>
                    <button onClick={() => handleDelete(res.id)} className="clay-button clay-sm text-red-600 px-2 py-1 text-xs">Delete</button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 bg-white p-2 rounded-md border border-gray-200 whitespace-pre-wrap truncate">
                  {res.body}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
