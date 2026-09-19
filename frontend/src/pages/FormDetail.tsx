import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function FormDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState<any>(null);
  const [slas, setSlas] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // New Field state
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldVisibility, setFieldVisibility] = useState('OPTIONAL');

  // Edit Field state
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('text');
  const [editVisibility, setEditVisibility] = useState('OPTIONAL');

  // Option state (per field)
  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

  // Config state
  const [config, setConfig] = useState<any>({
    deptId: '', slaId: '', ticketPrefix: 'TCK', ticketSeqType: 'SEQUENTIAL'
  });

  const fetchForm = async () => {
    try {
      const res = await api.get(`/forms/${id}`);
      setForm(res.data);
      setConfig({
        deptId: res.data.deptId || '',
        slaId: res.data.slaId || '',
        ticketPrefix: res.data.ticketPrefix || 'TCK',
        ticketSeqType: res.data.ticketSeqType || 'SEQUENTIAL'
      });
    } catch (err) {
      console.error('Failed to fetch form', err);
    }
  };

  useEffect(() => {
    fetchForm();
    api.get('/sla').then(res => setSlas(res.data));
    api.get('/departments').then(res => setDepartments(res.data));
  }, [id]);

  const handleConfigChange = (field: string, value: string | number) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSaveConfig = async () => {
    try {
      await api.patch(`/forms/${id}`, {
        deptId: config.deptId || null,
        slaId: config.slaId || null,
        ticketPrefix: config.ticketPrefix || 'TCK',
        ticketSeqType: config.ticketSeqType || 'SEQUENTIAL'
      });
      fetchForm(); 
      alert('Form configuration saved successfully!');
    } catch (err) {
      alert('Failed to save configuration.');
    }
  };

  const handleCancelConfig = () => {
    setConfig({
      deptId: form.deptId || '',
      slaId: form.slaId || '',
      ticketPrefix: form.ticketPrefix || 'TCK',
      ticketSeqType: form.ticketSeqType || 'SEQUENTIAL'
    });
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) return;
    try {
      await api.post(`/forms/${id}/fields`, {
        name: fieldName,
        type: fieldType,
        visibility: fieldVisibility
      });
      setFieldName('');
      setFieldType('text');
      setFieldVisibility('OPTIONAL');
      fetchForm();
    } catch (err) {
      console.error('Failed to add field', err);
    }
  };

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    if (!form) return;
    const newFields = [...form.fields];
    
    // Prevent moving out of bounds
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === newFields.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap elements
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    
    // Extract new ordered IDs
    const orderedIds = newFields.map(f => f.id);
    
    try {
      await api.patch(`/forms/${id}/reorder`, { orderedIds });
      fetchForm(); // Refresh to reflect DB changes
    } catch (err) {
      console.error('Failed to reorder fields', err);
    }
  };

  const startEditing = (field: any) => {
    setEditingFieldId(field.id);
    setEditName(field.name);
    setEditType(field.type);
    setEditVisibility(field.visibility);
  };

  const cancelEditing = () => {
    setEditingFieldId(null);
  };

  const handleSaveField = async (fieldId: number) => {
    try {
      await api.patch(`/forms/fields/${fieldId}`, {
        name: editName,
        type: editType,
        visibility: editVisibility
      });
      setEditingFieldId(null);
      fetchForm();
    } catch (err) {
      console.error('Failed to update field', err);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (window.confirm('Delete this field and all its options?')) {
      try {
        await api.delete(`/forms/fields/${fieldId}`);
        fetchForm();
      } catch (err) {
        console.error('Failed to delete field', err);
      }
    }
  };

  const handleAddOption = async (fieldId: number) => {
    const value = optionInputs[fieldId]?.trim();
    if (!value) return;
    try {
      await api.post(`/forms/fields/${fieldId}/options`, { value });
      setOptionInputs({ ...optionInputs, [fieldId]: '' });
      fetchForm();
    } catch (err) {
      console.error('Failed to add option', err);
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    try {
      await api.delete(`/forms/options/${optionId}`);
      fetchForm();
    } catch (err) {
      console.error('Failed to delete option', err);
    }
  };

  if (!form) return <div className="p-8 text-center text-gray-500">Loading form...</div>;

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin/forms')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Forms
      </button>

      {/* Form Header & Configuration */}
      <div className="clay p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-700">{form.title}</h1>
        <p className="text-sm text-gray-500 mt-1">Form ID: {form.id}</p>
        
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Form Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Department</label>
              <select value={config.deptId} onChange={(e) => handleConfigChange('deptId', e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none">
                <option value="">Default (Support)</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">SLA Policy</label>
              <select value={config.slaId} onChange={(e) => handleConfigChange('slaId', e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none">
                <option value="">Default by Priority</option>
                {slas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Ticket Number Generation</label>
              <select value={config.ticketSeqType} onChange={(e) => handleConfigChange('ticketSeqType', e.target.value)} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none">
                <option value="SEQUENTIAL">Sequential (e.g., 000001)</option>
                <option value="RANDOM">Random (e.g., 859302)</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Ticket Prefix</label>
            <input type="text" value={config.ticketPrefix} onChange={(e) => handleConfigChange('ticketPrefix', e.target.value.toUpperCase())} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" placeholder="TCK" maxLength={5} />
            <p className="text-xs text-gray-400 mt-1">Preview: {config.ticketPrefix || 'TCK'}{(config.ticketSeqType === 'RANDOM' ? '859302' : '000001')}</p>
          </div>

          <div className="flex gap-2 border-t pt-4">
            <button onClick={handleSaveConfig} className="clay-button clay-sm text-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium">Save Changes</button>
            <button onClick={handleCancelConfig} className="clay-button clay-sm text-gray-700 px-4 py-2 text-sm font-medium">Cancel</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Add Field Form */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Add New Field</h2>
          <form onSubmit={handleAddField} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Field Name</label>
              <input type="text" value={fieldName} onChange={(e) => setFieldName(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" placeholder="e.g., Operating System" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Field Type</label>
              <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none">
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="datetime-local">Date & Time</option>
                <option value="list">List (Dropdown)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Visibility / Requirement</label>
              <select value={fieldVisibility} onChange={(e) => setFieldVisibility(e.target.value)} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none">
                <option value="OPTIONAL">Optional (Everyone)</option>
                <option value="REQUIRED">Required (Everyone)</option>
                <option value="REQUIRED_END_USERS">Required for End Users</option>
                <option value="REQUIRED_AGENTS">Required for Agents (Hidden from Users)</option>
                <option value="INTERNAL_OPTIONAL">Internal Optional (Agents Only)</option>
                <option value="INTERNAL_REQUIRED">Internal Required (Agents Only)</option>
                <option value="END_USERS_ONLY">End Users Only (Optional)</option>
              </select>
            </div>
            <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm">Add Field</button>
          </form>
        </div>

        {/* Existing Fields List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Fields ({form.fields.length})</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {form.fields.length === 0 ? (
              <p className="text-sm text-gray-500">No fields added yet.</p>
            ) : (
              form.fields.map((field: any, index: number) => (
                <div key={field.id} className="p-4 rounded-xl bg-[#e6ebf2]">
                  
                  {/* EDIT MODE */}
                  {editingFieldId === field.id ? (
                    <div className="space-y-3">
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" />
                      <div className="flex gap-2">
                        <select value={editType} onChange={(e) => setEditType(e.target.value)} className="flex-1 px-4 py-2 clay-input text-sm bg-white focus:outline-none">
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="datetime-local">Date & Time</option>
                          <option value="list">List (Dropdown)</option>
                        </select>
                        <select value={editVisibility} onChange={(e) => setEditVisibility(e.target.value)} className="flex-1 px-4 py-2 clay-input text-sm bg-white focus:outline-none">
                          <option value="OPTIONAL">Optional (Everyone)</option>
                          <option value="REQUIRED">Required (Everyone)</option>
                          <option value="REQUIRED_END_USERS">Req. End Users</option>
                          <option value="REQUIRED_AGENTS">Req. Agents</option>
                          <option value="INTERNAL_OPTIONAL">Int. Optional</option>
                          <option value="INTERNAL_REQUIRED">Int. Required</option>
                          <option value="END_USERS_ONLY">End Users Only</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveField(field.id)} className="clay-button clay-sm text-purple-800 bg-green-600 px-3 py-1 text-xs">Save</button>
                        <button onClick={cancelEditing} className="clay-button clay-sm text-gray-700 px-3 py-1 text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium text-sm text-gray-700">{field.name}</p>
                        <p className="text-xs text-gray-500 uppercase">{field.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{field.visibility.replace(/_/g, ' ')}</span>
                        <div className="flex gap-1 border-l border-gray-300 pl-2">
                        <button onClick={() => handleMoveField(index, 'up')} disabled={index === 0} className="text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button onClick={() => handleMoveField(index, 'down')} disabled={index === form.fields.length - 1} className="text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        </div>
                        <button onClick={() => startEditing(field)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                        <button onClick={() => handleDeleteField(field.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                      </div>
                    </div>
                  )}

                  {/* Render List Options if type is 'list' (Visible in both modes) */}
                  {field.type === 'list' && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Dropdown Options</h4>
                      <div className="space-y-1 mb-2">
                        {field.options.length === 0 && <p className="text-xs text-gray-400">No options yet.</p>}
                        {field.options.map((opt: any) => (
                          <div key={opt.id} className="flex justify-between items-center bg-white border rounded px-2 py-1">
                            <span className="text-sm">{opt.value}</span>
                            <button onClick={() => handleDeleteOption(opt.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={optionInputs[field.id] || ''} onChange={(e) => setOptionInputs({ ...optionInputs, [field.id]: e.target.value })} placeholder="Add option..." className="flex-1 px-2 py-1 clay-input text-sm focus:outline-none" />
                        <button type="button" onClick={() => handleAddOption(field.id)} className="clay-button clay-sm text-green-800 bg-gray-800 px-3 py-1 text-xs">Add</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}