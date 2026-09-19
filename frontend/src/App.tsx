import { useEffect, useState } from 'react';
import api from './api/axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketDetail from './pages/TicketDetail';
import Admin from './pages/Admin';
import AdminDepartments from './pages/AdminDepartments';
import DepartmentDetail from './pages/DepartmentDetail';
import AdminForms from './pages/AdminForms';
import FormDetail from './pages/FormDetail';
import AdminStaff from './pages/AdminStaff';
import StaffDetail from './pages/StaffDetail';
import AdminSla from './pages/AdminSla';
import AdminSchedules from './pages/AdminSchedules';
import AdminOrganizations from './pages/AdminOrganizations';
import OrganizationDetail from './pages/OrganizationDetail';
import AdminUsers from './pages/AdminUsers';
import UserDetail from './pages/UserDetail';
import AdminTeams from './pages/AdminTeams';
import TeamDetail from './pages/TeamDetail';
import AdminEmailSettings from './pages/AdminEmailSettings';
import AdminEmailTemplates from './pages/AdminEmailTemplates';
import AdminCannedResponses from './pages/AdminCannedResponses';
import AdminAutomation from './pages/AdminAutomation';
import AdminAuditLogs from './pages/AdminAuditLogs';
import AdminTicketStatuses from './pages/AdminTicketStatuses';
import AdminKb from './pages/AdminKb';
import KbArticleEditor from './pages/KbArticleEditor';
import AdminCompanySettings from './pages/AdminCompanySettings';
import AgentProfile from './pages/AgentProfile';
import Analytics from './pages/Analytics';
import NewTicket from './pages/NewTicket';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserLogin from './portal/UserLogin';
import UserRegister from './portal/UserRegister';
import UserDashboard from './portal/UserDashboard';
import UserNewTicket from './portal/UserNewTicket';
import UserTicketDetail from './portal/UserTicketDetail';
import UserProfile from './portal/UserProfile';
import UserKb from './portal/UserKb';

// Helper component to protect Admin-only routes
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;

  const payload = JSON.parse(atob(token.split('.')[1]));
  if (!payload.isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};


const KbEditRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;

  const payload = JSON.parse(atob(token.split('.')[1]));
  // Allow if Admin OR has KB Role (Creator, Approver) - Reviewers are read-only
  if (!payload.isAdmin && (!payload.kbRole || payload.kbRole === 'NONE' || payload.kbRole === 'KB_REVIEWER')) {
    return <Navigate to="/admin/kb" />;
  }

  return <>{children}</>;
};

const KbReadRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}



function App() {
  const token = localStorage.getItem('token');
  const userToken = localStorage.getItem('userToken');

 useEffect(() => {
    api.get('/company-settings').then(res => {
      if (res.data.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = res.data.faviconUrl;
      }
      // Also dynamically set the company name in the tab title
      if (res.data.companyName) {
        document.title = res.data.companyName;
      }
    }).catch(() => {
      // Ignore errors if endpoint is public but fails for some reason
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Agent Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/ticket/:id" element={token ? <TicketDetail /> : <Navigate to="/login" />} />
        <Route path="/tickets/new" element={token ? <NewTicket /> : <Navigate to="/login" />} />
        <Route path="/profile" element={token ? <AgentProfile /> : <Navigate to="/login" />} />
        <Route path="/analytics" element={token ? <Analytics /> : <Navigate to="/login" />} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/departments" element={<AdminRoute><AdminDepartments /></AdminRoute>} />
        <Route path="/admin/departments/:id" element={<AdminRoute><DepartmentDetail /></AdminRoute>} />
        <Route path="/admin/forms" element={<AdminRoute><AdminForms /></AdminRoute>} />
        <Route path="/admin/forms/:id" element={<AdminRoute><FormDetail /></AdminRoute>} />
        <Route path="/admin/staff" element={<AdminRoute><AdminStaff /></AdminRoute>} />
        <Route path="/admin/staff/:id" element={<AdminRoute><StaffDetail /></AdminRoute>} />
        <Route path="/admin/sla" element={<AdminRoute><AdminSla /></AdminRoute>} />
        <Route path="/admin/schedules" element={<AdminRoute><AdminSchedules /></AdminRoute>} />
        <Route path="/admin/organizations" element={<AdminRoute><AdminOrganizations /></AdminRoute>} />
        <Route path="/admin/organizations/:id" element={<AdminRoute><OrganizationDetail /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/users/:id" element={<AdminRoute><UserDetail /></AdminRoute>} />
        <Route path="/admin/teams" element={<AdminRoute><AdminTeams /></AdminRoute>} />
        <Route path="/admin/teams/:id" element={<AdminRoute><TeamDetail /></AdminRoute>} />
        <Route path="/admin/email-settings" element={<AdminRoute><AdminEmailSettings /></AdminRoute>} />
        <Route path="/admin/email-templates" element={<AdminRoute><AdminEmailTemplates /></AdminRoute>} />
        <Route path="/admin/canned-responses" element={<AdminRoute><AdminCannedResponses /></AdminRoute>} />
        <Route path="/admin/automation" element={<AdminRoute><AdminAutomation /></AdminRoute>} />
        <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogs /></AdminRoute>} />
        <Route path="/admin/ticket-statuses" element={<AdminRoute><AdminTicketStatuses /></AdminRoute>} />
        <Route path="/admin/company-settings" element={<AdminRoute><AdminCompanySettings /></AdminRoute>} />
        
        {/* KB Routes - Accessible by Admins and KB Roles */}
        <Route path="/admin/kb" element={<KbReadRoute><AdminKb /></KbReadRoute>} />
        <Route path="/admin/kb/new" element={<KbEditRoute><KbArticleEditor /></KbEditRoute>} />
        <Route path="/admin/kb/edit/:id" element={<KbEditRoute><KbArticleEditor /></KbEditRoute>} />
        
        {/* Client Portal Routes */}
        <Route path="/portal/login" element={<UserLogin />} />
        <Route path="/portal/register" element={<UserRegister />} />
        <Route path="/portal" element={userToken ? <UserDashboard /> : <Navigate to="/portal/login" />} />
        <Route path="/portal/ticket/:id" element={userToken ? <UserTicketDetail /> : <Navigate to="/portal/login" />} />
        <Route path="/portal/tickets/new" element={userToken ? <UserNewTicket /> : <Navigate to="/portal/login" />} />
        <Route path="/portal/profile" element={userToken ? <UserProfile /> : <Navigate to="/portal/login" />} />
        <Route path="/portal/kb" element={userToken ? <UserKb /> : <Navigate to="/portal/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;