import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LogOut, Trash2, Mail, Phone, Building2, Users, Shield } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface Lead {
  id: string;
  company: string;
  sector: string;
  team_size: string;
  tools: string[];
  other_tools: string;
  lead_flow: string;
  repetitive_tasks: string;
  bottlenecks: string;
  magic_wand: string;
  security: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  urgency: string;
  status: string;
  createdAt: any;
}

export default function Dashboard({ user }: { user: User }) {
  const { t, language, setLanguage } = useLanguage();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData: Lead[] = [];
      snapshot.forEach((doc) => {
        leadsData.push({ id: doc.id, ...doc.data() } as Lead);
      });
      setLeads(leadsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'leads', id), { status });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const deleteLead = async (id: string) => {
    if (window.confirm(t('dash.confirmDelete'))) {
      try {
        await deleteDoc(doc(db, 'leads', id));
      } catch (error) {
        console.error("Error deleting lead:", error);
      }
    }
  };

  // Stats calculations
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  
  const sectorData = leads.reduce((acc, lead) => {
    const sector = lead.sector || 'Desconocido';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sectorChartData = Object.keys(sectorData).map(key => ({ name: key, value: sectorData[key] }));
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">{t('dash.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white/5 border border-white/10 p-6 rounded-2xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-extrabold text-xl tracking-tight">{t('dash.title')}</h1>
              <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono text-slate-300">/dashboardroot</span>
            </div>
            <p className="text-slate-400 text-sm">{t('dash.welcome')}, {user.email}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button onClick={() => setLanguage('es')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${language === 'es' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>ES</button>
              <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>EN</button>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm font-medium">
              <LogOut size={18} />
              <span>{t('dash.logout')}</span>
            </button>
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 p-6 rounded-xl border-l-4 border-blue-600">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('dash.stat1')}</h3>
            <p className="text-4xl font-extrabold">{totalLeads}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-xl border-l-4 border-emerald-500">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('dash.stat2')}</h3>
            <p className="text-4xl font-extrabold text-emerald-400">{newLeads}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-xl border-l-4 border-amber-500">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">{t('dash.stat3')}</h3>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sectorChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={35} fill="#8884d8">
                    {sectorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* LEADS TABLE */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="font-bold text-lg">{t('dash.table.title')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">{t('dash.col1')}</th>
                  <th className="p-4 font-semibold">{t('dash.col2')}</th>
                  <th className="p-4 font-semibold">{t('dash.col3')}</th>
                  <th className="p-4 font-semibold">{t('dash.col4')}</th>
                  <th className="p-4 font-semibold">{t('dash.col5')}</th>
                  <th className="p-4 font-semibold">{t('dash.col6')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{lead.company}</div>
                      <div className="text-slate-400 flex items-center gap-1.5 mt-1.5"><Mail size={14}/> {lead.email}</div>
                      {lead.phone && <div className="text-slate-400 flex items-center gap-1.5 mt-1"><Phone size={14}/> {lead.phone}</div>}
                      <div className="font-medium text-slate-300 mt-1.5">{lead.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-300"><Building2 size={14} className="text-blue-400"/> {lead.sector}</div>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-1.5"><Users size={14}/> {lead.team_size}</div>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-1.5"><Shield size={14}/> {lead.security || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        lead.urgency === 'asap' ? 'bg-red-500/20 text-red-400' :
                        lead.urgency === '1mes' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-white/10 text-slate-300'
                      }`}>
                        {lead.urgency === 'asap' ? 'ASAP' : lead.urgency === '1mes' ? '1 Mes' : 'Explorando'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {lead.createdAt?.toDate().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <select 
                        value={lead.status} 
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className={`text-xs font-bold uppercase tracking-wider rounded-lg px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          lead.status === 'new' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                          lead.status === 'contacted' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                          lead.status === 'qualified' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <option value="new">{t('dash.status.new')}</option>
                        <option value="contacted">{t('dash.status.contacted')}</option>
                        <option value="qualified">{t('dash.status.qualified')}</option>
                        <option value="discarded">{t('dash.status.discarded')}</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <button onClick={() => alert(`${t('dash.action.details')} - ${lead.company}:\n\n${t('dash.details.rep')} ${lead.repetitive_tasks}\n\n${t('dash.details.bot')} ${lead.bottlenecks}\n\n${t('dash.details.mag')} ${lead.magic_wand}\n\n${t('dash.details.tool')} ${lead.tools.join(', ')} ${lead.other_tools}`)} className="text-blue-400 hover:text-blue-300 font-medium text-xs uppercase tracking-wider">
                          {t('dash.action.details')}
                        </button>
                        <button onClick={() => deleteLead(lead.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      {t('dash.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
