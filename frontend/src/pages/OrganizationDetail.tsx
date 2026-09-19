import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function OrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allForms, setAllForms] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedFormId, setSelectedFormId] = useState('');
  const [orgForm, setOrgForm] = useState<any>({});

  const fetchOrganization = async () => {
    try {
      const res = await api.get(`/organizations/${id}`);
      setOrganization(res.data);
    } catch (err) {
      console.error('Failed to fetch organization', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await api.get('/users');
      setAllUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchAllForms = async () => {
    try {
      const res = await api.get('/forms');
      setAllForms(res.data);
    } catch (err) {
      console.error('Failed to fetch forms', err);
    }
  };

  useEffect(() => {
    fetchOrganization();
    fetchAllUsers();
    fetchAllForms();
  }, [id]);

  // --- User Handlers ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      await api.patch(`/users/${selectedUserId}`, { orgId: Number(id) });
      setSelectedUserId('');
      fetchOrganization(); 
    } catch (err) {
      console.error('Failed to add user to organization', err);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (window.confirm('Remove this user from the organization?')) {
      try {
        await api.patch(`/users/${userId}`, { orgId: null });
        fetchOrganization(); 
      } catch (err) {
        console.error('Failed to remove user', err);
      }
    }
  };

  // --- Form Handlers ---
  const handleAssignForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormId) return;
    try {
      await api.post(`/organizations/${id}/forms/${selectedFormId}`);
      setSelectedFormId('');
      fetchOrganization();
    } catch (err) {
      console.error('Failed to assign form', err);
    }
  };

  const handleUnassignForm = async (formId: number) => {
    if (window.confirm('Unassign this form from the organization?')) {
      try {
        await api.delete(`/organizations/${id}/forms/${formId}`);
        fetchOrganization();
      } catch (err) {
        console.error('Failed to unassign form', err);
      }
    }
  };

  if (!organization) return <div className="p-8 text-center text-gray-500">Loading organization...</div>;

  // Filter out users who are already in this organization for the dropdown
  const availableUsers = allUsers.filter(
    (user) => !organization.users.some((u: any) => u.id === user.id)
  );

  // Filter out forms that are already assigned to this organization
  const availableForms = allForms.filter(
    (form) => !organization.forms.some((of: any) => of.formId === form.id)
  );

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin/organizations')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Organizations
      </button>

      {/* Organization Header */}
      <div className="clay p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-700">{organization.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Organization ID: {organization.id} | 
          Parent: {organization.parent?.name || 'None (Top-Level)'}
        </p>
      </div>
      
      {/* Edit Organization Details */}
      <div className="clay p-6 mb-8">
        <h2 className="text-xl font-bold mb-6 text-gray-700">Organization Details & Billing</h2>
        <form onSubmit={async (e) => { e.preventDefault(); await api.patch(`/organizations/${id}`, orgForm); fetchOrganization(); alert('Organization updated!'); }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Organization Name</label>
            <input type="text" value={orgForm.name || ''} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Phone</label>
            <input type="text" value={orgForm.phone || ''} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Website</label>
            <input type="text" value={orgForm.website || ''} onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Street Address</label>
            <input type="text" value={orgForm.address || ''} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">City</label>
            <input type="text" value={orgForm.city || ''} onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">State/Province</label>
            <input type="text" value={orgForm.state || ''} onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Zip Code</label>
            <input type="text" value={orgForm.zipCode || ''} onChange={(e) => setOrgForm({ ...orgForm, zipCode: e.target.value })} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Country</label>
            <input type="text" value={orgForm.country || ''} onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" />
          </div>

          {/* Billing Info */}
          <div className="md:col-span-2 border-t pt-4 mt-2">
            <div className="flex items-center gap-4 mb-4">
              <input type="checkbox" id="isBillable" checked={orgForm.isBillable || false} onChange={(e) => setOrgForm({ ...orgForm, isBillable: e.target.checked })} className="h-4 w-4" />
              <label htmlFor="isBillable" className="text-sm font-medium text-gray-700">Billable Organization (Track time for invoicing)</label>
            </div>
            {orgForm.isBillable && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Hourly Rate ($)</label>
                <input type="number" value={orgForm.hourlyRate || 0} onChange={(e) => setOrgForm({ ...orgForm, hourlyRate: e.target.value })} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="clay-button clay-sm text-blue-600 bg-blue-600 px-6 py-2 text-sm font-medium">
              Save Details
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* === User Management Section === */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Add User to Organization</h2>
          {availableUsers.length > 0 ? (
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Select User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700"
                  required
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium">
                Add to Organization
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500">All available users are already in this organization.</p>
          )}
        </div>

        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Assigned Users ({organization.users.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {organization.users.length === 0 ? (
              <p className="text-sm text-gray-500">No users assigned to this organization yet.</p>
            ) : (
              organization.users.map((user: any) => (
                <div key={user.id} className="p-4 rounded-xl bg-[#e6ebf2] flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-gray-700">
                      {user.name} 
                      {user.role === 'MANAGER' && <span className="ml-2 text-xs text-blue-600 font-bold">(Manager)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => handleRemoveUser(user.id)}
                    className="clay-button clay-sm text-red-600 px-3 py-1 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* === Form Assignment Section === */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Assign Help Topic (Form)</h2>
          {availableForms.length > 0 ? (
            <form onSubmit={handleAssignForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Select Form</label>
                <select
                  value={selectedFormId}
                  onChange={(e) => setSelectedFormId(e.target.value)}
                  className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700"
                  required
                >
                  <option value="">Select a form...</option>
                  {availableForms.map((form) => (
                    <option key={form.id} value={form.id}>{form.title}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-purple-600 py-2 text-sm font-medium">
                Assign Form
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500">All available forms are already assigned to this organization.</p>
          )}
        </div>

        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Available Forms ({organization.forms.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {organization.forms.length === 0 ? (
              <p className="text-sm text-gray-500">No forms assigned yet. Users in this org won't see any Help Topics.</p>
            ) : (
              organization.forms.map((orgForm: any) => (
                <div key={orgForm.form.id} className="p-4 rounded-xl bg-[#e6ebf2] flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{orgForm.form.title}</span>
                  <button 
                    onClick={() => handleUnassignForm(orgForm.form.id)}
                    className="clay-button clay-sm text-red-600 px-3 py-1 text-xs font-medium"
                  >
                    Unassign
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