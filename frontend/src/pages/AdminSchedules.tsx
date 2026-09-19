import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [newSchedName, setNewSchedName] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  
  const navigate = useNavigate();

  const fetchData = async () => {
    const [schedRes, holiRes] = await Promise.all([api.get('/schedule'), api.get('/schedule/holidays')]);
    setSchedules(schedRes.data);
    setHolidays(holiRes.data);
    if (schedRes.data.length > 0 && Object.keys(expanded).length === 0) {
      setExpanded({ [schedRes.data[0].id]: true });
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleExpand = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedName.trim()) return;
    const res = await api.post('/schedule', { name: newSchedName });
    setNewSchedName('');
    fetchData();
    setExpanded(prev => ({ ...prev, [res.data.id]: true }));
  };

  const handleDeleteSchedule = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this entire schedule?')) {
      await api.delete(`/schedule/${id}`);
      fetchData();
    }
  };

  const handleDayUpdate = async (dayId: number, field: string, value: boolean | number) => {
    const day = schedules.flatMap(s => s.days).find(d => d.id === dayId);
    if (!day) return;
    const updatedDay = { ...day, [field]: value };
    await api.patch(`/schedule/days/${dayId}`, updatedDay);
    fetchData();
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName || !holidayDate) return;
    await api.post('/schedule/holidays', { name: holidayName, date: holidayDate });
    setHolidayName(''); setHolidayDate('');
    fetchData();
  };

  const handleDeleteHoliday = async (id: number) => {
    await api.delete(`/schedule/holidays/${id}`);
    fetchData();
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Schedules Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="clay p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Create New Schedule</h2>
            <form onSubmit={handleCreateSchedule} className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={newSchedName} onChange={(e) => setNewSchedName(e.target.value)} className="flex-1 px-4 py-2 clay-input text-sm focus:outline-none" placeholder="e.g., 24/7 Support" required />
              <button type="submit" className="clay-button clay-sm text-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium w-full sm:w-auto">Add Schedule</button>
            </form>
          </div>

          {schedules.map((sched) => (
            <div key={sched.id} className="clay overflow-hidden">
              <div className="flex justify-between items-center p-6 cursor-pointer hover:bg-[#e6ebf2] transition-colors" onClick={() => toggleExpand(sched.id)}>
                <div className="flex items-center gap-4">
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded[sched.id] ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  <h3 className="text-lg font-bold text-gray-700">{sched.name}</h3>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(sched.id); }} className="clay-button clay-sm text-red-600 px-3 py-1 text-xs font-medium">Delete</button>
              </div>
              
              {expanded[sched.id] && (
                <div className="p-6 pt-2 border-t border-gray-200 space-y-3">
                  {sched.days.map((day: any) => (
                    <div key={day.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl gap-4 ${day.isWorkingDay ? 'bg-[#e6ebf2]' : 'bg-[#e6ebf2] opacity-60'}`}>
                      <div className="flex items-center gap-3 w-40">
                        <input type="checkbox" checked={day.isWorkingDay} onChange={(e) => handleDayUpdate(day.id, 'isWorkingDay', e.target.checked)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                        <span className="font-medium text-sm text-gray-700">{DAYS[day.dayOfWeek]}</span>
                      </div>
                      <div className={`flex items-center gap-4 ${!day.isWorkingDay ? 'pointer-events-none' : ''}`}>
                        <select value={day.startTime} onChange={(e) => handleDayUpdate(day.id, 'startTime', Number(e.target.value))} className="px-2 py-1 clay-input text-sm bg-white focus:outline-none">
                          {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
                        </select>
                        <span className="text-xs text-gray-500">to</span>
                        <select value={day.endTime} onChange={(e) => handleDayUpdate(day.id, 'endTime', Number(e.target.value))} className="px-2 py-1 clay-input text-sm bg-white focus:outline-none">
                          {Array.from({ length: 24 }, (_, i) => <option key={i} value={i + 1}>{i + 1}:00</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Holidays Column */}
        <div className="space-y-6">
          <div className="clay p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Add Holiday</h2>
            <form onSubmit={handleAddHoliday} className="space-y-3">
              <input type="text" value={holidayName} onChange={(e) => setHolidayName(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" placeholder="Holiday Name" required />
              <input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none" required />
              <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium">Add Holiday</button>
            </form>
          </div>

          <div className="clay p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Upcoming Holidays</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {holidays.length === 0 && <p className="text-sm text-gray-500">No holidays set.</p>}
              {holidays.map((h) => (
                <div key={h.id} className="flex justify-between items-center p-3 rounded-xl bg-[#e6ebf2]">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{h.name}</p>
                    <p className="text-xs text-gray-500">{new Date(h.date).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeleteHoliday(h.id)} className="clay-button clay-sm text-red-600 px-2 py-1 text-xs">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}