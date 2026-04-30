import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  LogOut, Mail, Phone, Building2, Users, MessageSquare,
  Calendar, BookOpen, Plug, Bot, RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import OrganizationSwitcher from '../components/OrganizationSwitcher';
import { fetchDashboardData } from '../lib/dashboardQueries';
import type { DashboardData } from '../lib/dashboardQueries';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

const LEAD_STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-purple-500/20 text-purple-400',
  qualified: 'bg-emerald-500/20 text-emerald-400',
  proposal: 'bg-amber-500/20 text-amber-400',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
};

const INTEGRATION_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  inactive: 'bg-slate-500/20 text-slate-400',
  error: 'bg-red-500/20 text-red-400',
};

export default function Dashboard() {
  const { language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!currentOrganization) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData(currentOrganization.id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // ─── Derived stats ────────────────────────────────────────────────────────
  const totalLeads = data?.leads.length ?? 0;
  const newLeads = data?.leads.filter((l) => l.status === 'new').length ?? 0;
  const activeConversations = data?.conversations.filter((c) => c.status === 'active').length ?? 0;
  const upcomingAppointments = data?.appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed',
  ).length ?? 0;
  const activeAgents = data?.agents.filter((a) => a.is_active).length ?? 0;

  const sectorChartData = (data?.leads ?? []).reduce<{ name: string; value: number }[]>(
    (acc, lead) => {
      const src = lead.source ?? 'Desconocido';
      const found = acc.find((x) => x.name === src);
      if (found) found.value += 1;
      else acc.push({ name: src, value: 1 });
      return acc;
    },
    [],
  );

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm">
        Cargando datos...
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 gap-3">
        <p className="text-red-400 font-medium">Error al cargar datos</p>
        <p className="text-slate-400 text-sm">{error}</p>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white/5 border border-white/10 p-6 rounded-2xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="font-extrabold text-xl tracking-tight">Dashboard</h1>
              <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono text-slate-300">
                /dashboardroot
              </span>
            </div>
            <div className="flex items-center gap-2">
              <OrganizationSwitcher />
              {currentOrganization?.sector && (
                <span className="text-xs text-slate-400 capitalize">
                  · {currentOrganization.sector}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setLanguage('es')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${language === 'es' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ES
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                EN
              </button>
            </div>
            <span className="text-slate-400 text-xs hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              <span>Salir</span>
            </button>
          </div>
        </header>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 p-5 rounded-xl border-l-4 border-blue-600">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-blue-400" />
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Leads totales</h3>
            </div>
            <p className="text-3xl font-extrabold">{totalLeads}</p>
            <p className="text-slate-400 text-xs mt-1">{newLeads} nuevos</p>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border-l-4 border-emerald-500">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-emerald-400" />
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Conversaciones</h3>
            </div>
            <p className="text-3xl font-extrabold text-emerald-400">{activeConversations}</p>
            <p className="text-slate-400 text-xs mt-1">activas</p>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border-l-4 border-amber-500">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-amber-400" />
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Citas</h3>
            </div>
            <p className="text-3xl font-extrabold text-amber-400">{upcomingAppointments}</p>
            <p className="text-slate-400 text-xs mt-1">próximas</p>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border-l-4 border-indigo-500">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-indigo-400" />
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Agentes</h3>
            </div>
            <p className="text-3xl font-extrabold text-indigo-400">{activeAgents}</p>
            <p className="text-slate-400 text-xs mt-1">activos</p>
          </div>
        </div>

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Leads table — 2/3 width */}
          <div className="lg:col-span-2 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-bold">Leads recientes</h2>
              <Link
                to="/leads"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ver todos →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Contacto</th>
                    <th className="p-4 font-semibold">Canal</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold">Score</th>
                    <th className="p-4 font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm">
                  {data?.leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{lead.name}</div>
                        {lead.company && (
                          <div className="text-slate-400 flex items-center gap-1 mt-1">
                            <Building2 size={12} /> {lead.company}
                          </div>
                        )}
                        {lead.email && (
                          <div className="text-slate-400 flex items-center gap-1 mt-1">
                            <Mail size={12} /> {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="text-slate-400 flex items-center gap-1 mt-1">
                            <Phone size={12} /> {lead.phone}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-300 capitalize">{lead.channel_type}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${LEAD_STATUS_STYLES[lead.status] ?? 'bg-white/10 text-slate-300'}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-300 font-mono">{lead.score}</span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {new Date(lead.created_at).toLocaleDateString(
                          language === 'es' ? 'es-ES' : 'en-US',
                          { day: '2-digit', month: 'short', year: 'numeric' },
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!data?.leads || data.leads.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Sin leads para esta organización
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar — 1/3 width */}
          <div className="flex flex-col gap-4">

            {/* Lead source chart */}
            {sectorChartData.length > 0 && (
              <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Leads por fuente
                </h3>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={40}
                      >
                        {sectorChartData.map((_entry, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Integrations */}
            <div className="bg-white/5 p-5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Plug size={14} className="text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Integraciones
                </h3>
              </div>
              {data?.integrations.length === 0 ? (
                <p className="text-slate-500 text-xs">Sin integraciones</p>
              ) : (
                <ul className="space-y-2">
                  {data?.integrations.map((int) => (
                    <li key={int.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 capitalize">{int.provider}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${INTEGRATION_STATUS_STYLES[int.status] ?? 'bg-white/10 text-slate-300'}`}
                      >
                        {int.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Knowledge base count */}
            <div className="bg-white/5 p-5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={14} className="text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Base de conocimiento
                </h3>
              </div>
              <p className="text-2xl font-extrabold text-white mt-2">{data?.knowledgeCount ?? 0}</p>
              <p className="text-slate-400 text-xs">artículos</p>
            </div>

            {/* Agents */}
            <div className="bg-white/5 p-5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={14} className="text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Agentes configurados
                </h3>
              </div>
              {data?.agents.length === 0 ? (
                <p className="text-slate-500 text-xs">Sin agentes</p>
              ) : (
                <ul className="space-y-2">
                  {data?.agents.map((agent) => (
                    <li key={agent.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 truncate max-w-[120px]">{agent.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${agent.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}
                      >
                        {agent.is_active ? 'activo' : 'inactivo'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
