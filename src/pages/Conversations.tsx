import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, RefreshCw, ArrowLeft, Send, AlertCircle,
  Phone, Mail, User, Clock,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import OrganizationSwitcher from '../components/OrganizationSwitcher';
import {
  fetchConversations,
  fetchMessages,
  updateConversationStatus,
  createInternalMessage,
} from '../lib/conversationsQueries';
import type { ConversationFilters } from '../lib/conversationsQueries';
import type { Conversation, ConversationStatus, Message, ChannelType } from '../types/database';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONV_STATUSES: ConversationStatus[] = ['active', 'waiting', 'resolved', 'archived'];

const STATUS_LABELS: Record<ConversationStatus, string> = {
  active: 'Activa',
  waiting: 'Esperando',
  resolved: 'Resuelta',
  archived: 'Archivada',
};

const STATUS_STYLES: Record<ConversationStatus, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  waiting: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  resolved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const CHANNEL_LABELS: Record<ChannelType, string> = {
  whatsapp: 'WhatsApp',
  voice_call: 'Llamada',
  email: 'Email',
  web_chat: 'Web Chat',
  form: 'Formulario',
  manual: 'Manual',
};

const CHANNEL_STYLES: Record<ChannelType, string> = {
  whatsapp: 'bg-green-500/10 text-green-400',
  voice_call: 'bg-purple-500/10 text-purple-400',
  email: 'bg-blue-500/10 text-blue-400',
  web_chat: 'bg-indigo-500/10 text-indigo-400',
  form: 'bg-orange-500/10 text-orange-400',
  manual: 'bg-slate-500/10 text-slate-400',
};

const ROLE_STYLES: Record<string, string> = {
  user: 'bg-slate-700/60 text-white self-start',
  assistant: 'bg-blue-600/30 text-blue-100 self-end',
  system: 'bg-slate-800 text-slate-400 self-center text-xs italic',
};

const ROLE_LABELS: Record<string, string> = {
  user: 'Cliente',
  assistant: 'Agente IA',
  system: 'Sistema',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Conversations() {
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelType | 'all'>('all');

  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [statusUpdating, setStatusUpdating] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Load conversations ──────────────────────────────────────────────────

  const loadConversations = async () => {
    if (!currentOrganization) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const filters: ConversationFilters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (channelFilter !== 'all') filters.channel_type = channelFilter;
      const data = await fetchConversations(currentOrganization.id, filters);
      setConversations(data);
      // If selected no longer in filtered list, keep it visible but deselect if not present
      if (selected && !data.find((c) => c.id === selected.id)) {
        setSelected(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando conversaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id, statusFilter, channelFilter]);

  // ─── Load messages when conversation selected ────────────────────────────

  const loadMessages = async (conv: Conversation) => {
    if (!currentOrganization) return;
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const data = await fetchMessages(currentOrganization.id, conv.id);
      setMessages(data);
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : 'Error cargando mensajes');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelected(conv);
    setSendError(null);
    setNewMessage('');
    loadMessages(conv);
  };

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ─── Status change ───────────────────────────────────────────────────────

  const handleStatusChange = async (newStatus: ConversationStatus) => {
    if (!currentOrganization || !selected) return;
    setStatusUpdating(true);
    try {
      const updated = await updateConversationStatus(
        currentOrganization.id,
        selected.id,
        newStatus,
      );
      setSelected(updated);
      setConversations((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando estado');
    } finally {
      setStatusUpdating(false);
    }
  };

  // ─── Send internal message ───────────────────────────────────────────────

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization || !selected || !newMessage.trim()) return;
    setSendingMessage(true);
    setSendError(null);
    try {
      const msg = await createInternalMessage(
        currentOrganization.id,
        selected.id,
        { role: 'user', content: newMessage.trim(), channel_type: 'manual' },
      );
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error enviando mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── Count helpers ───────────────────────────────────────────────────────

  const countByStatus = (s: ConversationStatus) =>
    conversations.filter((c) => c.status === s).length;

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!currentOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
        Selecciona una organización para ver conversaciones.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app')}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-emerald-400" />
            <h1 className="font-extrabold text-lg">Conversaciones</h1>
          </div>
          <OrganizationSwitcher />
        </div>
        <button
          onClick={loadConversations}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </header>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="bg-white/3 border-b border-white/10 px-6 py-3 flex flex-wrap items-center gap-4 flex-shrink-0">
        {/* Status tabs */}
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${statusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Todas ({conversations.length})
          </button>
          {CONV_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${statusFilter === s ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {STATUS_LABELS[s]} ({countByStatus(s)})
            </button>
          ))}
        </div>

        {/* Channel filter */}
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as ChannelType | 'all')}
          className="bg-slate-800 border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Todos los canales</option>
          {(Object.keys(CHANNEL_LABELS) as ChannelType[]).map((ch) => (
            <option key={ch} value={ch}>{CHANNEL_LABELS[ch]}</option>
          ))}
        </select>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Conversations list ─────────────────────────────────────────────── */}
        <div className={`flex flex-col border-r border-white/10 overflow-y-auto ${selected ? 'w-80 flex-shrink-0 hidden lg:flex' : 'w-full'}`}>
          {loading && (
            <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
              Cargando...
            </div>
          )}
          {error && (
            <div className="p-6">
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-400 text-sm font-medium">Error</p>
                  <p className="text-red-400/80 text-xs mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          {!loading && !error && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
              <MessageSquare size={32} />
              <p className="text-sm">Sin conversaciones</p>
            </div>
          )}
          {!loading && conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${selected?.id === conv.id ? 'bg-white/8 border-l-2 border-l-emerald-500' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <User size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="font-semibold text-sm truncate">
                    {conv.contact_name ?? 'Contacto desconocido'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {conv.status === 'waiting' && (
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-wide">
                      ⚠ Handoff
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${STATUS_STYLES[conv.status]}`}
                  >
                    {STATUS_LABELS[conv.status]}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${CHANNEL_STYLES[conv.channel_type]}`}>
                    {CHANNEL_LABELS[conv.channel_type]}
                  </span>
                  {conv.subject && (
                    <span className="text-slate-400 text-xs truncate max-w-[140px]">{conv.subject}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-xs flex-shrink-0">
                  <Clock size={10} />
                  {formatRelative(conv.last_message_at)}
                </div>
              </div>
              {(conv.contact_phone || conv.contact_email) && (
                <div className="flex items-center gap-3 mt-1.5">
                  {conv.contact_phone && (
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Phone size={10} /> {conv.contact_phone}
                    </span>
                  )}
                  {conv.contact_email && (
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Mail size={10} /> {conv.contact_email}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* ── Conversation detail ────────────────────────────────────────────── */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Detail header */}
            <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setSelected(null); setMessages([]); }}
                    className="lg:hidden text-slate-400 hover:text-white transition-colors"
                    aria-label="Volver a lista"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold">
                        {selected.contact_name ?? 'Contacto desconocido'}
                      </h2>
                      {selected.status === 'waiting' && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                          ⚠ Handoff humano
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${CHANNEL_STYLES[selected.channel_type]}`}>
                        {CHANNEL_LABELS[selected.channel_type]}
                      </span>
                      {selected.contact_phone && (
                        <span className="flex items-center gap-1 text-slate-400 text-xs">
                          <Phone size={10} /> {selected.contact_phone}
                        </span>
                      )}
                      {selected.contact_email && (
                        <span className="flex items-center gap-1 text-slate-400 text-xs">
                          <Mail size={10} /> {selected.contact_email}
                        </span>
                      )}
                      <span className="text-slate-500 text-xs">
                        Iniciada {formatDate(selected.started_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-slate-400 text-xs">Estado:</span>
                  <select
                    value={selected.status}
                    onChange={(e) => handleStatusChange(e.target.value as ConversationStatus)}
                    disabled={statusUpdating}
                    className="bg-slate-800 border border-white/10 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white disabled:opacity-50"
                  >
                    {CONV_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
              {messagesLoading && (
                <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                  Cargando mensajes...
                </div>
              )}
              {messagesError && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{messagesError}</p>
                </div>
              )}
              {!messagesLoading && !messagesError && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                  <MessageSquare size={24} />
                  <p className="text-sm">Sin mensajes en esta conversación</p>
                </div>
              )}
              {!messagesLoading && messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[75%] rounded-xl px-4 py-2.5 ${ROLE_STYLES[msg.role] ?? 'bg-slate-700 text-white self-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wide opacity-70">
                      {ROLE_LABELS[msg.role] ?? msg.role}
                    </span>
                    {msg.channel_type !== selected.channel_type && (
                      <span className="text-xs opacity-50">· {CHANNEL_LABELS[msg.channel_type]}</span>
                    )}
                    <span className="text-xs opacity-40 ml-auto">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Add internal message */}
            <div className="border-t border-white/10 bg-white/3 px-6 py-4 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Mensaje interno (manual):</span>
                </div>
                {sendError && (
                  <p className="text-red-400 text-xs">{sendError}</p>
                )}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje interno..."
                    className="flex-1 bg-slate-800 border border-white/10 text-sm text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <Send size={14} />
                    {sendingMessage ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden lg:flex items-center justify-center text-slate-500 flex-col gap-3">
            <MessageSquare size={40} />
            <p className="text-sm">Selecciona una conversación</p>
          </div>
        )}
      </div>
    </div>
  );
}
