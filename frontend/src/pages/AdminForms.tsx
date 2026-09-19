import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

interface Form { id: number; title: string; fields: any[]; }
interface FormField { name: string; type: string; visibility: string; }

export default function AdminForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formTitle, setFormTitle] = useState('');
  const [deptId, setDeptId] = useState<number | ''>('');
  const [formFields, setFormFields] = useState<FormField[]>([{ name: '', type: 'text', visibility: 'OPTIONAL' }]);
  const navigate = useNavigate();

  const fetchForms = async () => {
    const res = await api.get('/forms');
    setForms(res.data);
  };

  useEffect(() => { 
    fetchForms(); 
    api.get('/departments').then(res => setDepartments(res.data));
  }, []);

  const handleAddField = () => {
    setFormFields([...formFields, { name: '', type: 'text', visibility: 'OPTIONAL' }]);
  };

  const handleFieldChange = (index: number, field: keyof FormField, value: string) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], [field]: value };
    setFormFields(updated);
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formFields.some(f => !f.name.trim())) return;
    try {
      await api.post('/forms', { 
        title: formTitle, 
        fields: formFields,
        deptId: deptId || undefined // Pass the department ID
      });
      setFormTitle('');
      setDeptId('');
      setFormFields([{ name: '', type: 'text', visibility: 'OPTIONAL' }]);
      fetchForms();
    } catch (err) {
      console.error('Failed to create form');
    }
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Form Builder */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Dynamic Form Builder</h2>
          <form onSubmit={handleCreateForm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Form Title (Help Topic)</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-4 py-2 clay-input text-sm focus:outline-none"
                placeholder="e.g., Hardware Request"
                required
              />
            </div>

            {/* --- DEPARTMENT ASSIGNMENT --- */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Assign to Department (Optional)</label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none"
              >
                <option value="">Global (All Departments)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">If assigned, only agents in this department can use this form.</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-600">Initial Fields</label>
              {formFields.map((field, index) => (
                <div key={index} className="flex flex-col gap-2 p-3 rounded-xl bg-[#e6ebf2]">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 clay-input text-sm focus:outline-none"
                    placeholder="Field Name"
                    required
                  />
                  <div className="flex gap-2">
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                      className="flex-1 px-4 py-2 clay-input text-sm bg-white focus:outline-none"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="datetime-local">Date & Time</option>
                      <option value="list">List (Dropdown)</option>
                    </select>
                    <select
                      value={field.visibility}
                      onChange={(e) => handleFieldChange(index, 'visibility', e.target.value)}
                      className="flex-1 px-4 py-2 clay-input text-sm bg-white focus:outline-none"
                    >
                      <option value="OPTIONAL">Optional</option>
                      <option value="REQUIRED">Required</option>
                      <option value="INTERNAL_REQUIRED">Internal Only</option>
                      <option value="END_USERS_ONLY">End Users Only</option>
                    </select>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddField} className="text-sm text-blue-600 hover:underline font-medium">
                + Add Field
              </button>
            </div>

            <button type="submit" className="clay-button clay-sm w-full text-blue-800 bg-blue-600 py-2 text-sm font-medium">
              Save Form
            </button>
          </form>
        </div>

        {/* Existing Forms List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Existing Forms</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {forms.length === 0 && <p className="text-sm text-gray-500">No forms created yet.</p>}
            {forms.map((form) => (
              <div key={form.id} className="border-b border-gray-200 pb-4">
                <button 
                  onClick={() => navigate(`/admin/forms/${form.id}`)}
                  className="font-semibold text-blue-600 hover:underline text-left"
                >
                  {form.title}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Department: {form.department?.name || 'Global (All)'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.fields.map((field: any) => (
                    <span key={field.id} className="text-xs bg-[#e6ebf2] text-gray-600 px-2 py-1 rounded-full">
                      {field.name} 
                      <span className="text-gray-400 ml-1">({field.visibility ? field.visibility.replace(/_/g, ' ').toLowerCase() : 'optional'})</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}