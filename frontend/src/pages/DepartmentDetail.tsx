import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function DepartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<any>(null);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const fetchDepartment = async () => {
    try {
      const res = await api.get(`/departments/${id}`);
      setDepartment(res.data);
    } catch (err) {
      console.error('Failed to fetch department', err);
    }
  };

  const fetchAllStaff = async () => {
    try {
      const res = await api.get('/staff');
      setAllStaff(res.data);
    } catch (err) {
      console.error('Failed to fetch staff', err);
    }
  };

  useEffect(() => {
    fetchDepartment();
    fetchAllStaff();
  }, [id]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    try {
      await api.patch(`/staff/${selectedStaffId}`, { deptId: Number(id) });
      setSelectedStaffId('');
      fetchDepartment(); 
    } catch (err) {
      console.error('Failed to add staff to department', err);
    }
  };

  const handleRemoveStaff = async (staffId: number) => {
    if (window.confirm('Remove this staff member from the department?')) {
      try {
        await api.patch(`/staff/${staffId}`, { deptId: null });
        fetchDepartment(); 
      } catch (err) {
        console.error('Failed to remove staff', err);
      }
    }
  };

  if (!department) return <div className="p-8 text-center text-gray-500">Loading department...</div>;

  const availableStaff = allStaff.filter(
    (staff) => !department.staff.some((s: any) => s.id === staff.id)
  );

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin/departments')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Departments
      </button>

      {/* Department Header */}
      <div className="clay p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-700">{department.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Department ID: {department.id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Add Staff Form */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Add Staff to Department</h2>
          {availableStaff.length > 0 ? (
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Select Staff Member</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700"
                  required
                >
                  <option value="">Select an agent...</option>
                  {availableStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.firstname} {staff.lastname} ({staff.email})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium">
                Add to Department
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500">All available staff are already in this department.</p>
          )}
        </div>

        {/* Assigned Staff List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Assigned Staff ({department.staff.length})</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {department.staff.length === 0 ? (
              <p className="text-sm text-gray-500">No staff assigned to this department yet.</p>
            ) : (
              department.staff.map((staff: any) => (
                <div key={staff.id} className="p-4 rounded-xl bg-[#e6ebf2] flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-gray-700">{staff.firstname} {staff.lastname}</p>
                    <p className="text-xs text-gray-500">{staff.email}</p>
                  </div>
                  <button 
                    onClick={() => handleRemoveStaff(staff.id)}
                    className="clay-button clay-sm text-red-600 px-3 py-1 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}