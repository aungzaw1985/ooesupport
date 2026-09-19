import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import EditorToolbar from '../components/EditorToolbar';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [entries, setEntries] = useState<any[]>([]);
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replyType, setReplyType] = useState<'response' | 'note'>('response');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: '',
  });

  const [sidebarData, setSidebarData] = useState<any>({
    status: '', priority: '', staffId: '', teamId: '', deptId: ''
  });

  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [showEscalateMenu, setShowEscalateMenu] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskType, setTaskType] = useState('INTERNAL');
  
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [mergeTicketId, setMergeTicketId] = useState('');
  const [showMergeInput, setShowMergeInput] = useState(false);

  const [cannedResponses, setCannedResponses] = useState<any[]>([]);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [showUserHistory, setShowUserHistory] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicketInfo(res.data);
      setSidebarData({
        status: res.data.status || 'OPEN',
        priority: res.data.priority || 'NORMAL',
        staffId: res.data.staffId || '',
        teamId: res.data.teamId || '',
        deptId: res.data.deptId || ''
      });
      
      localStorage.setItem(`ticket_${id}_read`, new Date().toISOString());
      
      const threadRes = await api.get(`/tickets/${id}/thread`);
      const threadData = threadRes.data;
      
      const timeline = [
        ...(threadData.entries || []).map((e: any) => ({ ...e, isEvent: false })),
        ...(threadData.events || []).map((e: any) => ({ ...e, isEvent: true }))
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setEntries(timeline);
      
      const tasksRes = await api.get(`/tasks/ticket/${id}`);
      setTasks(tasksRes.data);

      const timeRes = await api.get(`/tickets/${id}/time-logs`);
      setTimeLogs(timeRes.data.logs);
      setTotalMinutes(timeRes.data.totalMinutes);
      setTimerActive(timeRes.data.logs.some((l: any) => l.endTime === null));

      const tagsRes = await api.get(`/tickets/${id}`); // Assuming tags are populated in ticket
      setTags(tagsRes.data.tags?.map((t: any) => t.name) || []);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTicket();
    api.get('/staff').then(res => setStaffList(res.data));
    api.get('/teams').then(res => { setAllTeams(res.data); setTeams(res.data); });
    api.get('/ticket-statuses').then(res => setStatuses(res.data));
    api.get('/canned-responses').then(res => setCannedResponses(res.data));

    const socket: Socket = io();

    socket.on(`ticket:${id}:thread`, (newEntry: any) => {
      setEntries((prevEntries) => {
        if (prevEntries.some(e => e.id === newEntry.id)) return prevEntries;
        return [...prevEntries, { ...newEntry, isEvent: false }];
      });
    });

    return () => { socket.disconnect(); };
  }, [id]);

  const handleSidebarChange = (field: string, value: string) => {
    setSidebarData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    const payload = {
      status: sidebarData.status,
      priority: sidebarData.priority,
      staffId: sidebarData.staffId === '' ? null : Number(sidebarData.staffId),
      teamId: sidebarData.teamId === '' ? null : Number(sidebarData.teamId),
      deptId: sidebarData.deptId === '' ? null : Number(sidebarData.deptId),
    };

    try {
      await api.patch(`/tickets/${id}`, payload);
      fetchTicket();
    } catch (err) {
      console.error('Failed to update ticket', err);
      alert('Failed to save ticket details.');
    }
  };

  const handleEscalate = async (targetType: string, targetId?: number) => {
    try {
      await api.post(`/tickets/${id}/escalate`, { targetType, targetId });
      setShowEscalateMenu(false);
      fetchTicket(); 
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to escalate ticket.');
    }
  };

  const insertCannedResponse = (body: string) => {
    const userName = ticketInfo.user?.name || 'Customer';
    const replacedBody = body.replace(/{{user.name}}/g, userName).replace(/{{ticket.number}}/g, ticketInfo.number);
    editor?.commands.insertContent(replacedBody);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const htmlContent = editor?.getHTML() || '';
    if ((!htmlContent.trim() || htmlContent === '<p></p>') && !selectedFile) return;

    try {
      const endpoint = replyType === 'note' ? `/tickets/${id}/notes` : `/tickets/${id}/replies`;
      const res = await api.post(endpoint, { body: htmlContent, staffId: 2 });
      const newEntryId = res.data.id;

      if (selectedFile && newEntryId) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await api.post(`/attachments/upload/${newEntryId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSelectedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
      }

      editor?.commands.clearContent();
      fetchTicket(); 
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      await api.post(`/tasks/ticket/${id}`, { title: taskTitle, description: taskDesc, type: taskType });
      setTaskTitle(''); setTaskDesc(''); setTaskType('INTERNAL');
      setShowTaskForm(false);
      fetchTicket();
    } catch (err) { console.error(err); }
  };

  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: currentStatus === 'OPEN' ? 'COMPLETED' : 'OPEN' });
      fetchTicket();
    } catch (err) { console.error(err); }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    await api.post(`/tickets/${id}/tags`, { name: newTag });
    setNewTag('');
    fetchTicket();
  };

  const handleRemoveTag = async (tagName: string) => {
    await api.delete(`/tickets/${id}/tags/${tagName}`);
    fetchTicket();
  };

  const handleMerge = async () => {
    if (!mergeTicketId) return;
    try {
      await api.post(`/tickets/${id}/merge`, { secondaryTicketId: Number(mergeTicketId) });
      alert('Tickets merged successfully!');
      setShowMergeInput(false);
      setMergeTicketId('');
    } catch (err) { alert('Failed to merge tickets.'); }
  };

  const handleStartTimer = async () => {
    try { await api.post(`/tickets/${id}/timer/start`); fetchTicket(); } catch (err) { console.error(err); }
  };

  const handleStopTimer = async () => {
    try { await api.post(`/tickets/${id}/timer/stop`); fetchTicket(); } catch (err) { console.error(err); }
  };

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  if (!ticketInfo || !editor) {
    return <div className="p-8 text-center text-gray-500">Loading ticket...</div>;
  }

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/dashboard')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Queue
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column */}
        <div className="w-full md:flex-1">
          <div className="clay p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-700">{ticketInfo.subject}</h1>
            <p className="text-sm text-gray-500 mt-1">{ticketInfo.number} • Opened by {ticketInfo.user?.name}</p>
          </div>

          {/* Sub-Tickets */}
          <div className="clay p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-700">Sub-Tickets ({tasks.length})</h2>
              <button onClick={() => setShowTaskForm(!showTaskForm)} className="clay-button clay-sm text-blue-600 px-3 py-1 text-xs font-medium">+ Add Sub-Ticket</button>
            </div>
            {showTaskForm && (
              <form onSubmit={handleCreateTask} className="clay-sm p-4 mb-4 space-y-3 bg-[#e6ebf2]">
                <input type="text" placeholder="Sub-ticket title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full px-4 py-2 clay-input text-sm" required />
                <textarea placeholder="Description (Optional)" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} className="w-full px-4 py-2 clay-input text-sm h-20" />
                <div className="flex gap-4">
                  <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="px-4 py-2 clay-input text-sm bg-white">
                    <option value="INTERNAL">Internal (Agents Only)</option>
                    <option value="EXTERNAL">External (Visible to User)</option>
                  </select>
                  <button type="submit" className="clay-button clay-sm text-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium">Save Task</button>
                </div>
              </form>
            )}
            <div className="space-y-2">
              {tasks.length === 0 && <p className="text-sm text-gray-500">No sub-tickets created.</p>}
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-[#e6ebf2]">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={task.status === 'COMPLETED'} onChange={() => handleToggleTask(task.id, task.status)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                    <div>
                      <p className={`text-sm font-medium text-gray-700 ${task.status === 'COMPLETED' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
                      {task.description && <p className="text-xs text-gray-500">{task.description}</p>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${task.type === 'INTERNAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{task.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Data */}
          {ticketInfo.customData && Object.keys(ticketInfo.customData).filter(k => k !== 'subject').length > 0 && (
            <div className="clay p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-700 mb-4">Ticket Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(ticketInfo.customData).filter(k => k !== 'subject').map(key => (
                  <div key={key} className="text-sm">
                    <p className="text-gray-500 capitalize mb-1">{key}</p>
                    <p className="text-gray-800 font-medium break-words bg-[#e6ebf2] px-3 py-2 rounded-lg">{ticketInfo.customData[key] || '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thread */}
          <div className="space-y-4 mb-6">
            {entries.map((entry) => (
              entry.isEvent ? (
                <div key={entry.id} className="flex justify-center my-2">
                  <span className="text-xs text-gray-500 bg-[#e6ebf2] px-3 py-1 rounded-full shadow-sm">{new Date(entry.createdAt).toLocaleString()} - {entry.message}</span>
                </div>
              ) : (
                <div key={entry.id} className={`clay-sm p-4 ${entry.type === 'note' ? 'bg-yellow-50' : entry.type === 'response' ? 'bg-blue-50 ml-2 md:ml-8' : 'bg-gray-50 mr-2 md:mr-8'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm text-gray-700">{entry.type === 'message' ? 'User' : entry.type === 'response' ? 'Agent' : 'Internal Note'}</span>
                    <span className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-800 mb-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: entry.body }} />
                  {entry.attachments && entry.attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      {entry.attachments.map((att: any) => (
                        <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          {att.filename}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>

          {/* Modern Reply Box */}
          <form onSubmit={handleReply} className="clay overflow-hidden mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#e6ebf2] p-4 border-b border-gray-200 gap-2">
              <div className="flex border-b border-gray-200 sm:border-b-0">
                <button type="button" onClick={() => setReplyType('response')} className={`py-2 px-4 text-sm font-medium border-b-2 ${replyType === 'response' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Public Reply</button>
                <button type="button" onClick={() => setReplyType('note')} className={`py-2 px-4 text-sm font-medium border-b-2 ${replyType === 'note' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500'}`}>Internal Note</button>
              </div>
              {cannedResponses.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <select onChange={(e) => { if (e.target.value) insertCannedResponse(e.target.value); e.target.value = ""; }} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700" defaultValue="">
                    <option value="">Insert Canned Response...</option>
                    {cannedResponses.map(c => <option key={c.id} value={c.body}>{c.title}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className={`p-4 transition-colors ${replyType === 'note' ? 'bg-yellow-50' : 'bg-white'}`}>
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} className="p-3 min-h-[120px] prose prose-sm max-w-none focus:outline-none" />
            </div>

            <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-[#e6ebf2]">
              <label className="cursor-pointer flex items-center text-sm text-gray-600 hover:text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                <span>{selectedFile ? selectedFile.name : 'Attach File'}</span>
                <input type="file" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
              <button type="submit" className={`clay-button clay-sm px-5 py-2 text-blue-600 font-medium text-sm transition-colors ${replyType === 'note' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {replyType === 'note' ? 'Post Internal Note' : 'Send Reply'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Sidebar */}
        <div className="w-full md:w-80 clay p-6 h-fit md:sticky md:top-4 mt-4 md:mt-0">
          
          {/* User Information */}
          {ticketInfo.user && (
            <div className="mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#e6ebf2] mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-blue-600 font-bold text-lg overflow-hidden">
                  {ticketInfo.user.photoUrl ? <img src={ticketInfo.user.photoUrl} alt="User" className="w-full h-full object-cover" /> : ticketInfo.user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-sm text-gray-800 truncate">{ticketInfo.user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{ticketInfo.user.email}</p>
                  {ticketInfo.user.phone && <p className="text-xs text-gray-400 truncate">{ticketInfo.user.phone}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[#e6ebf2] text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Organization</p>
                  <p className="text-xs font-bold text-gray-700 truncate">{ticketInfo.user.organization?.name || 'None'}</p>
                </div>
                <div className="p-2 rounded-lg bg-[#e6ebf2] text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Total Tickets</p>
                  <p className="text-xs font-bold text-gray-700">{ticketInfo.user.tickets.length}</p>
                </div>
              </div>
              <button onClick={() => setShowUserHistory(!showUserHistory)} className="w-full flex justify-between items-center text-xs font-bold text-gray-600 mb-2">
                <span>Recent Interaction History</span>
                <svg className={`w-4 h-4 transition-transform ${showUserHistory ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
              {showUserHistory && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {ticketInfo.user.tickets.map((t: any) => (
                    <a key={t.id} href={`/ticket/${t.id}`} onClick={(e) => { e.preventDefault(); navigate(`/ticket/${t.id}`); }} className="block p-2 rounded-lg bg-white hover:bg-blue-50 border border-gray-200 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-blue-600 truncate">{t.number}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${t.status === 'OPEN' ? 'bg-green-100 text-green-800' : t.status === 'RESOLVED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{t.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">{t.subject}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ticket Details */}
          <div className="border-t pt-4 mb-4">
            <h2 className="text-lg font-bold text-gray-700">Ticket Details</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Status</label>
              <select value={sidebarData.status} onChange={(e) => handleSidebarChange('status', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700">
                {statuses.map(s => <option key={s.id} value={s.name}>{s.name.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Priority</label>
              <select value={sidebarData.priority} onChange={(e) => handleSidebarChange('priority', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700">
                <option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Assigned To</label>
              <select value={sidebarData.staffId} onChange={(e) => handleSidebarChange('staffId', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700">
                <option value="">Unassigned</option>
                {staffList.map((staff) => (<option key={staff.id} value={staff.id}>{staff.firstname} {staff.lastname}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Assigned Team</label>
              <select value={sidebarData.teamId} onChange={(e) => handleSidebarChange('teamId', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700">
                <option value="">Unassigned</option>
                {allTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Department</label>
              <select value={sidebarData.deptId} onChange={(e) => handleSidebarChange('deptId', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700">
                <option value="1">Support</option><option value="2">IT Support</option><option value="3">Billing</option>
              </select>
            </div>

            <div className="flex gap-2 border-t pt-4 mt-4">
              <button onClick={handleSaveChanges} className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium">Save Changes</button>
              <button onClick={() => setSidebarData({ status: ticketInfo.status, priority: ticketInfo.priority, staffId: ticketInfo.staffId || '', teamId: ticketInfo.teamId || '', deptId: ticketInfo.deptId || '' })} className="clay-button clay-sm w-full text-gray-700 py-2 text-sm font-medium">Cancel</button>
            </div>

            {/* Time Tracking */}
            <div className="border-t pt-4 mt-4">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Time Tracking</label>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm">
                  <p className="text-gray-700 font-bold">{formatTime(totalMinutes)}</p>
                  <p className="text-xs text-gray-400">Total Logged</p>
                </div>
                {timerActive ? (
                  <button onClick={handleStopTimer} className="clay-button clay-sm text-blue-600 bg-red-600 px-3 py-1 text-xs flex items-center gap-1"><span className="w-2 h-2 bg-white rounded-sm"></span> Stop</button>
                ) : (
                  <button onClick={handleStartTimer} className="clay-button clay-sm text-blue-600 bg-green-600 px-3 py-1 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                    Start
                  </button>
                )}
              </div>
              {timeLogs.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {timeLogs.map(log => (
                    <div key={log.id} className="text-xs text-gray-500 bg-[#e6ebf2] p-2 rounded flex justify-between">
                      <span>{log.staff.firstname} {log.staff.lastname}</span>
                      <span>{log.durationMinutes > 0 ? `${log.durationMinutes}m` : 'Running...'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="border-t pt-4 mt-4">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-blue-600 hover:text-blue-800 font-bold">x</button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag..." className="flex-1 px-2 py-1 clay-input text-sm" />
                <button type="submit" className="clay-button clay-sm text-blue-600 bg-blue-600 px-3 py-1 text-xs">Add</button>
              </form>
            </div>

            {/* Merge */}
            <div className="border-t pt-4 mt-4">
              {!showMergeInput ? (
                <button onClick={() => setShowMergeInput(true)} className="w-full text-left text-sm text-gray-600 hover:text-blue-600 font-medium">Merge with another ticket...</button>
              ) : (
                <div className="space-y-2">
                  <input type="number" value={mergeTicketId} onChange={(e) => setMergeTicketId(e.target.value)} placeholder="Enter Ticket ID to merge" className="w-full px-2 py-1 clay-input text-sm" />
                  <div className="flex gap-2">
                    <button onClick={handleMerge} className="clay-button clay-sm text-blue-600 bg-red-600 px-3 py-1 text-xs">Merge & Close</button>
                    <button onClick={() => setShowMergeInput(false)} className="clay-button clay-sm text-gray-700 px-3 py-1 text-xs">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Escalation */}
            <div className="border-t pt-4 mt-4 relative">
              <button onClick={() => setShowEscalateMenu(!showEscalateMenu)} className="w-full bg-red-50 text-red-600 p-2 rounded hover:bg-red-100 text-sm font-medium flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Escalate Ticket
              </button>
              {showEscalateMenu && (
                <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg p-2 space-y-1">
                  <button onClick={() => handleEscalate('MANAGER')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">Escalate to Dept. Manager</button>
                  <div className="border-t my-1"></div>
                  <p className="text-xs font-bold text-gray-500 px-3 pt-1">Transfer to Team</p>
                  {allTeams.map((team) => (<button key={team.id} onClick={() => handleEscalate('TEAM', team.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">{team.name}</button>))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}