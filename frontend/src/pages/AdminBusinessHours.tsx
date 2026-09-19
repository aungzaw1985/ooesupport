import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminBusinessHours() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchSchedule = async () => {
    try {
      const res = await api.get('/business-hours');
      // If database is empty, initialize local state with defaults for UI
      if (res.data.length === 0) {
        setSchedule(DAYS.map((day, index) => ({ dayOfWeek: index, isWorkingDay: index >= 1 && index <= 5, startTime: 9, endTime: 17 })));
      } else {
        setSchedule(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleChange = (index: number, field: string, value: boolean | number) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
  };

  const handleSave = async (day: any) => {
    try {
      await api.post('/business-hours', {
        dayOfWeek: day.dayOfWeek,
        isWorkingDay: day.isWorkingDay,
        startTime: day.startTime,
        endTime: day.endTime,
      });
      alert(`${DAYS[day.dayOfWeek]} schedule saved!`);
    } catch (err) {
      console.error(err);
      alert('Failed to save. Are you an Admin?');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline">
        &larr; Back to Admin Settings
      </button>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-6">Business Hours Configuration</h2>
        <p className="text-sm text-gray-500 mb-6">SLA timers will only count down during these hours.</p>
        
        <div className="space-y-4">
          {schedule.map((day, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
              <div className="flex items-center gap-3 w-40">
                <input 
                  type="checkbox" 
                  checked={day.isWorkingDay} 
                  onChange={(e) => handleChange(index, 'isWorkingDay', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="font-medium text-sm">{DAYS[index]}</span>
              </div>

              <div className={`flex items-center gap-4 ${!day.isWorkingDay ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Start</label>
                  <select 
                    value={day.startTime} 
                    onChange={(e) => handleChange(index, 'startTime', Number(e.target.value))}
                    className="p-1 border rounded text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">End</label>
                  <select 
                    value={day.endTime} 
                    onChange={(e) => handleChange(index, 'endTime', Number(e.target.value))}
                    className="p-1 border rounded text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i + 1}>{i + 1}:00</option>)}
                  </select>
                </div>
                <button 
                  onClick={() => handleSave(day)} 
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
