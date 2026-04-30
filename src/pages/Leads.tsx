import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, RefreshCw, ArrowLeft, Mail, Phone, Building2,
  Edit2, Save, AlertCircle,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  fetchLeads,
  createLead,
  updateLead,
} from '../lib/leadsQueries';
import type { LeadInput, LeadUpdate } from '../lib/leadsQueries';
import type { Lead, LeadStatus } from '../types/database';

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Cualificado',
  proposal: 'Propuesta',
  won: 'Ganado',
  lost: 'Perdido',
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contacted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  qualified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  proposal: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  won: 'bg-green-500/20 text-green-400 border-green-500/30',
  lost: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const EMPTY_FORM: LeadInput = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: '',
  status: 'new',
  score: 0,
  notes: '',
  channel_type: 'manual',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Leads() {
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<LeadInput>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState<LeadUpdate>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editDirty, setEditDirty] = useState(false);

  // ─── Load ──────────────────────────────────────────────────────────────────

  const load = async () => {
    if (!currentOrganization) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeads(currentOrganization.id);
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id]);

  // ─── Filtered list ─────────────────────────────────────────────────────────

  const filtered = statusFilter === 'all'
    ? leads
    : leads.filter((l) => l.status === statusFilter);

  // ─── Create lead ───────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!currentOrganization) return;
    if (!createForm.name.trim()) {
      setCreateError('El nombre es obligatorio');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createLead(currentOrganization.id, {
        ...createForm,
        name: createForm.name.trim(),
        email: createForm.email?.trim() || null,
        phone: createForm.phone?.trim() || null,
        company: createForm.company?.trim() || null,
        source: createForm.source?.trim() || null,
        notes: createForm.notes?.trim() || null,
      });
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error creando lead');
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── Select lead for detail/edit ───────────────────────────────────────────

  const openLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditForm({
      name: lead.name,
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      company: lead.company ?? '',
      source: lead.source ?? '',
      status: lead.status,
      score: lead.score,
      notes: lead.notes ?? '',
    });
    setEditDirty(false);
    setEditError(null);
  };

  const closeLead = () => {
    setSelectedLead(null);
    setEditForm({});
    setEditDirty(false);
    setEditError(null);
  };

  // ─── Save edit ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!currentOrganization || !selectedLead) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const updated = await updateLead(currentOrganization.id, selectedLead.id, {
        name: typeof editForm.name === 'string' ? editForm.name.trim() || selectedLead.name : selectedLead.name,
        email: typeof editForm.email === 'string' ? editForm.email.trim() || null : null,
        phone: typeof editForm.phone === 'string' ? editForm.phone.trim() || null : null,
        company: typeof editForm.company === 'string' ? editForm.company.trim() || null : null,
        source: typeof editForm.source === 'string' ? editForm.source.trim() || null : null,
        status: editForm.status,
        score: editForm.score,
        notes: typeof editForm.notes === 'string' ? editForm.notes.trim() || null : null,
      });
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setSelectedLead(updated);
      setEditDirty(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error guardando cambios');
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Quick status change from table ────────────────────────────────────────

  const handleStatusChange = async (lead: Lead, status: LeadStatus) => {
    if (!currentOrganization) return;
    try {
      const updated = await updateLead(currentOrganization.id, lead.id, { status });
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      if (selectedLead?.id === updated.id) {
        setSelectedLead(updated);
        setEditForm((prev) => ({ ...prev, status }));
      }
    } catch {
      // silent — user can retry via edit panel
    }
  };

  // ─── Loading / Error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
        Cargando leads...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 gap-3">
        <p className="text-red-400 font-medium">Error al cargar leads</p>
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white/5 border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="text-slate-400 hover:text-white transition-colors"
              title="Volver al dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight">Leads</h1>
              {currentOrganization && (
                <p className="text-slate-400 text-xs mt-0.5">{currentOrganization.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              title="Actualizar"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => { setShowCreate(true); setCreateError(null); setCreateForm(EMPTY_FORM); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Nuevo lead
            </button>
          </div>
        </header>

        {/* ── Status filters ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
              statusFilter === 'all'
                ? 'bg-white/20 text-white border-white/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
          >
            Todos ({leads.length})
          </button>
          {LEAD_STATUSES.map((st) => {
            const count = leads.filter((l) => l.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                  statusFilter === st
                    ? STATUS_STYLES[st]
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                {STATUS_LABELS[st]} ({count})
              </button>
            );
          })}
        </div>

        {/* ── Main area ───────────────────────────────────────────────────── */}
        <div className={`grid gap-6 ${selectedLead ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>

          {/* Leads table */}
          <div className={`bg-white/5 rounded-2xl border border-white/10 overflow-hidden ${selectedLead ? 'lg:col-span-2' : ''}`}>
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                {statusFilter === 'all'
                  ? 'Sin leads para esta organización'
                  : `Sin leads con estado "${STATUS_LABELS[statusFilter as LeadStatus]}"`}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold">Contacto</th>
                      <th className="p-4 font-semibold hidden sm:table-cell">Estado</th>
                      <th className="p-4 font-semibold hidden md:table-cell">Score</th>
                      <th className="p-4 font-semibold hidden lg:table-cell">Fuente</th>
                      <th className="p-4 font-semibold hidden md:table-cell">Fecha</th>
                      <th className="p-4 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-sm">
                    {filtered.map((lead) => (
                      <tr
                        key={lead.id}
                        className={`hover:bg-white/5 transition-colors cursor-pointer ${
                          selectedLead?.id === lead.id ? 'bg-white/10' : ''
                        }`}
                        onClick={() => openLead(lead)}
                      >
                        <td className="p-4">
                          <div className="font-bold text-white">{lead.name}</div>
                          {lead.company && (
                            <div className="text-slate-400 flex items-center gap-1 mt-1 text-xs">
                              <Building2 size={11} /> {lead.company}
                            </div>
                          )}
                          {lead.email && (
                            <div className="text-slate-400 flex items-center gap-1 mt-1 text-xs">
                              <Mail size={11} /> {lead.email}
                            </div>
                          )}
                          {lead.phone && (
                            <div className="text-slate-400 flex items-center gap-1 mt-1 text-xs">
                              <Phone size={11} /> {lead.phone}
                            </div>
                          )}
                        </td>
                        <td className="p-4 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                            className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider border cursor-pointer bg-transparent ${STATUS_STYLES[lead.status]}`}
                          >
                            {LEAD_STATUSES.map((st) => (
                              <option key={st} value={st} className="bg-slate-800 text-white normal-case font-normal">
                                {STATUS_LABELS[st]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-slate-300 font-mono text-xs">{lead.score}</span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className="text-slate-400 text-xs capitalize">{lead.source ?? '—'}</span>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-slate-400 text-xs">
                            {new Date(lead.created_at).toLocaleDateString('es-ES', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openLead(lead)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Ver / editar"
                          >
                            <Edit2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Detail / Edit panel ─────────────────────────────────────────── */}
          {selectedLead && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm uppercase tracking-wider text-slate-400">
                  Detalle del lead
                </h2>
                <button
                  onClick={closeLead}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {editError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  {editError}
                </div>
              )}

              {/* Fields */}
              <div className="flex flex-col gap-3">
                <Field label="Nombre">
                  <input
                    type="text"
                    value={editForm.name ?? ''}
                    onChange={(e) => { setEditForm((p) => ({ ...p, name: e.target.value })); setEditDirty(true); }}
                    className="input-field"
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    value={typeof editForm.email === 'string' ? editForm.email : ''}
                    onChange={(e) => { setEditForm((p) => ({ ...p, email: e.target.value })); setEditDirty(true); }}
                    className="input-field"
                    placeholder="—"
                  />
                </Field>

                <Field label="Teléfono">
                  <input
                    type="tel"
                    value={typeof editForm.phone === 'string' ? editForm.phone : ''}
                    onChange={(e) => { setEditForm((p) => ({ ...p, phone: e.target.value })); setEditDirty(true); }}
                    className="input-field"
                    placeholder="—"
                  />
                </Field>

                <Field label="Empresa">
                  <input
                    type="text"
                    value={typeof editForm.company === 'string' ? editForm.company : ''}
                    onChange={(e) => { setEditForm((p) => ({ ...p, company: e.target.value })); setEditDirty(true); }}
                    className="input-field"
                    placeholder="—"
                  />
                </Field>

                <Field label="Fuente">
                  <input
                    type="text"
                    value={typeof editForm.source === 'string' ? editForm.source : ''}
                    onChange={(e) => { setEditForm((p) => ({ ...p, source: e.target.value })); setEditDirty(true); }}
                    className="input-field"
                    placeholder="—"
                  />
                </Field>

                <Field label="Estado">
                  <select
                    value={editForm.status ?? 'new'}
                    onChange={(e) => { setEditForm((p) => ({ ...p, status: e.target.value as LeadStatus })); setEditDirty(true); }}
                    className="input-field"
                  >
                    {LEAD_STATUSES.map((st) => (
                      <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Score (0–100)">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editForm.score ?? 0}
                    onChange={(e) => { setEditForm((p) => ({ ...p, score: Number(e.target.value) })); setEditDirty(true); }}
                    className="input-field"
                  />
                </Field>

                <Field label="Notas">
                  <textarea
                    value={typeof editForm.notes === 'string' ? editForm.notes : ''}
                    onChange={(e) => { setEditForm((p) => ({ ...p, notes: e.target.value })); setEditDirty(true); }}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Añade notas sobre este lead..."
                  />
                </Field>
              </div>

              <div className="text-xs text-slate-500 mt-1">
                Creado: {new Date(selectedLead.created_at).toLocaleString('es-ES')}
                {selectedLead.updated_at !== selectedLead.created_at && (
                  <> · Actualizado: {new Date(selectedLead.updated_at).toLocaleString('es-ES')}</>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={!editDirty || editLoading}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors mt-auto ${
                  editDirty && !editLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed'
                }`}
              >
                {editLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {editLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Lead Modal ───────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Nuevo lead</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="flex items-start gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {createError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Field label="Nombre *">
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="input-field"
                  placeholder="Nombre del contacto"
                  autoFocus
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">
                  <input
                    type="email"
                    value={typeof createForm.email === 'string' ? createForm.email : ''}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    className="input-field"
                    placeholder="email@empresa.com"
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    type="tel"
                    value={typeof createForm.phone === 'string' ? createForm.phone : ''}
                    onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                    className="input-field"
                    placeholder="+34..."
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Empresa">
                  <input
                    type="text"
                    value={typeof createForm.company === 'string' ? createForm.company : ''}
                    onChange={(e) => setCreateForm((p) => ({ ...p, company: e.target.value }))}
                    className="input-field"
                    placeholder="—"
                  />
                </Field>
                <Field label="Fuente">
                  <input
                    type="text"
                    value={typeof createForm.source === 'string' ? createForm.source : ''}
                    onChange={(e) => setCreateForm((p) => ({ ...p, source: e.target.value }))}
                    className="input-field"
                    placeholder="web, manual..."
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Estado">
                  <select
                    value={createForm.status ?? 'new'}
                    onChange={(e) => setCreateForm((p) => ({ ...p, status: e.target.value as LeadStatus }))}
                    className="input-field"
                  >
                    {LEAD_STATUSES.map((st) => (
                      <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Score (0–100)">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={createForm.score ?? 0}
                    onChange={(e) => setCreateForm((p) => ({ ...p, score: Number(e.target.value) }))}
                    className="input-field"
                  />
                </Field>
              </div>

              <Field label="Notas">
                <textarea
                  value={typeof createForm.notes === 'string' ? createForm.notes : ''}
                  onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Notas iniciales..."
                />
              </Field>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={createLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {createLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {createLoading ? 'Creando...' : 'Crear lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
