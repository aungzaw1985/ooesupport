import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Analytics() {
  const navigate = useNavigate();
  
  // State declarations
  const [data, setData] = useState<any[]>([]);
  const [advData, setAdvData] = useState<any>(null);
  const [groupBy, setGroupBy] = useState('AGENT');
  const [loading, setLoading] = useState(true);

  // Fetch Basic Breakdown
  useEffect(() => {
    setLoading(true);
    api.get('/analytics/breakdown', { params: { groupBy } })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [groupBy]);

  // Fetch Advanced Metrics
  useEffect(() => {
    api.get('/analytics/advanced').then(res => setAdvData(res.data));
  }, []);

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getHeatColor = (count: number, max: number) => {
    const intensity = max > 0 ? count / max : 0;
    return `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`; // Blue gradient
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/dashboard')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Dashboard
      </button>

      {/* Header & Dimension Selector */}
      <div className="clay p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-700">Platform Analytics</h1>
        <div className="flex gap-2 flex-wrap">
          {['AGENT', 'FORM', 'ORG', 'USER', 'DEPT'].map((dim) => (
            <button 
              key={dim} 
              onClick={() => setGroupBy(dim)}
              className={`clay-button clay-sm px-4 py-2 text-xs font-medium transition-all ${groupBy === dim ? 'text-yellow-500 bg-blue-400' : 'text-gray-400'}`}
            >
              By {dim.charAt(0) + dim.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Breakdown Section */}
      {loading ? (
        <div className="clay p-8 text-center text-gray-500 mb-6">Crunching numbers...</div>
      ) : data.length === 0 ? (
        <div className="clay p-8 text-center text-gray-500 mb-6">No data available for this dimension.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Bar Chart (Total vs Open vs Resolved) */}
          <div className="clay p-6 lg:col-span-2">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Ticket Distribution</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 10)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e5ec" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ background: '#f0f4f8', border: 'none', borderRadius: 12, boxShadow: '8px 8px 16px #a3b1c6' }} />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="open" name="Open" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart (Total Share) */}
          <div className="clay p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Share by {groupBy.charAt(0) + groupBy.slice(1).toLowerCase()}</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.slice(0, 7)} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#f0f4f8', border: 'none', borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Raw Data Table */}
          <div className="clay p-6 lg:col-span-3 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Detailed Breakdown</h2>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Open</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resolved</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-700 font-medium">{row.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row.total}</td>
                    <td className="px-4 py-2 text-sm text-red-600 font-medium">{row.open}</td>
                    <td className="px-4 py-2 text-sm text-green-600 font-medium">{row.resolved}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {row.total > 0 ? Math.round((row.resolved / row.total) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === ADVANCED METRICS SECTION === */}
      {advData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* MTTR by Priority */}
          <div className="clay p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Mean Time to Resolution (MTTR)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={advData.mttrData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e5ec" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} unit="h" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ background: '#f0f4f8', border: 'none', borderRadius: 12 }} />
                  <Bar dataKey="hours" name="Avg Hours" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Agent Workload */}
          <div className="clay p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Agent Workload Distribution</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={advData.workloadData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e5ec" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ background: '#f0f4f8', border: 'none', borderRadius: 12 }} />
                  <Legend />
                  <Bar dataKey="open" name="Open" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="closed" name="Closed" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SLA Breach Rate */}
          <div className="clay p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-700">SLA Breach Rate (Active)</h2>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={advData.slaData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} label>
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#f0f4f8', border: 'none', borderRadius: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {advData.slaData[1].value} Breached / {advData.slaData[0].value + advData.slaData[1].value} Active
            </p>
          </div>

          {/* CSAT (Customer Satisfaction) */}
          <div className="clay p-6 lg:col-span-3">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Customer Satisfaction (CSAT)</h2>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="flex flex-col items-center justify-center w-full sm:w-1/3">
                <p className="text-5xl font-bold text-blue-600">{advData.avgCsat}</p>
                <p className="text-sm text-gray-500 mt-1">Average out of 5</p>
                <p className="text-xs text-gray-400 mt-1">Based on {advData.totalRatings} ratings</p>
              </div>
              <div className="w-full sm:w-2/3 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={advData.csatDistribution} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e5ec" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip contentStyle={{ background: '#f0f4f8', border: 'none', borderRadius: 12 }} />
                    <Bar dataKey="count" name="Votes" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Ticket Arrival Heatmap */}
          <div className="clay p-6 lg:col-span-3 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Ticket Arrival Heatmap</h2>
            <div className="min-w-[600px]">
              <div className="grid grid-cols-[40px_repeat(24,_1fr)] gap-1 text-center text-xs text-gray-400">
                <div></div>
                {Array.from({ length: 24 }, (_, i) => <div key={i} className="text-center">{i}</div>)}
              </div>
              {advData.heatmapData.map((row: number[], dayIndex: number) => (
                <div key={dayIndex} className="grid grid-cols-[40px_repeat(24,_1fr)] gap-1 mt-1 items-center">
                  <div className="text-xs text-gray-500 font-medium text-right pr-2">{DAYS[dayIndex]}</div>
                  {row.map((count, hourIndex) => (
                    <div 
                      key={hourIndex} 
                      className="h-6 rounded-sm flex items-center justify-center text-[10px] text-white font-bold"
                      style={{ backgroundColor: getHeatColor(count, advData.maxHeat) }}
                      title={`${DAYS[dayIndex]} ${hourIndex}:00 - Count: ${count}`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}