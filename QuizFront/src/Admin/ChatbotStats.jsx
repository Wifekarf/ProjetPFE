import { useEffect, useMemo, useState } from 'react';
import AuthLayout from '../Layout/AuthLayout';
import { chatbotService } from '../services/chatbotService';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export default function ChatbotStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const colors = ['#0ea5b6', '#46D3E5', '#0ea5b6', '#74e0ee', '#008091', '#005e6a', '#9aa6ac'];

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setStats(await chatbotService.stats()); } finally { setLoading(false); }
    })();
  }, []);

  const topicData = useMemo(() => (stats?.byTopic ?? []).map((t, i) => ({ name: t.topic, value: Number(t.cnt) })), [stats]);
  const dailyData = useMemo(() => (stats?.daily ?? []).map(d => ({ day: new Date(d.day).toLocaleDateString(), count: Number(d.cnt) })), [stats]);

  return (
    <AuthLayout>
      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ecfeff] via-[#ffffff] to-[#e6f9fb] p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-[#006674]">Chatbot Statistics</h1>
          {loading || !stats ? (
            <div>Loading...</div>
          ) : (
            <div className="grid gap-6">
              <div className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-[#006674]">Questions by Topic</h2>
                  <span className="text-sm text-gray-500">Total: {topicData.reduce((a,b)=>a+b.value,0)}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer>
                      <PieChart>
                        <ReTooltip />
                        <Pie data={topicData} dataKey="value" nameKey="name" outerRadius={100} innerRadius={50} paddingAngle={3}>
                          {topicData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3 self-center">
                    {topicData.map((t, i) => (
                      <div key={t.name} className="border rounded-lg px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded" style={{background: colors[i % colors.length]}}></span>
                          <span>{t.name}</span>
                        </div>
                        <span className="font-semibold">{t.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-5">
                <h2 className="font-semibold mb-3 text-[#006674]">Last 30 Days</h2>
                <div className="h-72">
                  <ResponsiveContainer>
                    <AreaChart data={dailyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#46D3E5" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#46D3E5" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <ReTooltip />
                      <Area type="monotone" dataKey="count" stroke="#0ea5b6" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-5">
                <h2 className="font-semibold mb-3 text-[#006674]">Top Questions</h2>
                <ol className="space-y-2">
                  {stats.topQuestions.map(q => (
                    <li key={q.question} className="flex items-center justify-between border rounded-lg px-3 py-2">
                      <span className="pr-4 text-gray-800">{q.question}</span>
                      <span className="text-sm text-white bg-[#006674] px-2 py-0.5 rounded">{q.cnt}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}


