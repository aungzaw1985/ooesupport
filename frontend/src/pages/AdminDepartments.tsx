import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const navigate = useNavigate();

  const fetchDepartments = async () => {
    const res = await api.get('/departments');
    setDepartments(res.data);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      await api.post('/departments', { name: newDeptName });
      setNewDeptName('');
      fetchDepartments();
    } catch (err) {
      console.error('Failed to create department');
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await api.patch(`/departments/${id}`, { name: editName });
      setEditingId(null);
      fetchDepartments();
    } catch (err) {
      console.error('Failed to update department');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.delete(`/departments/${id}`);
        fetchDepartments();
      } catch (err) {
        console.error('Failed to delete department');
      }
    }
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create Department Card */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Create New Department</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              className="flex-1 px-4 py-2 clay-input text-sm focus:outline-none text-gray-700"
              placeholder="e.g., Network Operations"
              required
            />
            <button type="submit" className="clay-button clay-sm text-violet-600 bg-blue-600 px-4 py-2 text-sm font-medium w-full sm:w-auto">
              Add Department
            </button>
          </form>
        </div>

        {/* Existing Departments List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Existing Departments</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {departments.length === 0 && <p className="text-sm text-gray-500">No departments created yet.</p>}
            {departments.map((dept) => (
              <div key={dept.id} className="p-4 rounded-xl bg-[#e6ebf2] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                {editingId === dept.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-4 py-2 clay-input text-sm focus:outline-none text-gray-700"
                  />
                ) : (
                  <button 
                    onClick={() => navigate(`/admin/departments/${dept.id}`)}
                    className="text-sm text-blue-600 hover:underline text-left font-medium"
                  >
                    {dept.name}
                  </button>
                )}
                
                <div className="flex gap-2 justify-end">
                  {editingId === dept.id ? (
                    <>
                      <button onClick={() => handleUpdate(dept.id)} className="clay-button clay-sm text-blue-600 bg-green-600 px-3 py-1 text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="clay-button clay-sm text-gray-700 px-3 py-1 text-xs">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setEditingId(dept.id); setEditName(dept.name); }} 
                        className="clay-button clay-sm text-blue-600 px-3 py-1 text-xs"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(dept.id)} 
                        className="clay-button clay-sm text-red-600 px-3 py-1 text-xs"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}