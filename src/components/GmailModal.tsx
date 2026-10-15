import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  Search,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Eye,
  Edit3,
  User,
  Inbox,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  signInWithGmail,
  getGmailAccessToken,
  fetchGmailProfile,
  listGmailMessages,
  getGmailMessage,
  sendGmailMessage,
  clearGmailAuth,
  GmailProfile,
  GmailMessageSummary,
  GmailMessageDetail,
} from '../services/gmailService';
import {
  generateWelcomeEmailHtml,
  generateCredentialsEmailHtml,
  generateAdminOrderAlertEmailHtml,
} from '../services/notificationService';

interface GmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  initialRecipient?: string;
  initialSubject?: string;
  initialTemplate?: 'welcome' | 'credentials' | 'alert' | 'custom';
}

export const GmailModal: React.FC<GmailModalProps> = ({
  isOpen,
  onClose,
  onToast,
  initialRecipient = '',
  initialSubject = '',
  initialTemplate = 'custom',
}) => {
  if (!isOpen) return null;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(false);
  const [profile, setProfile] = useState<GmailProfile | null>(null);

  // Tabs: 'inbox' | 'compose'
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');

  // Inbox state
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Compose state
  const [recipient, setRecipient] = useState<string>(initialRecipient);
  const [subject, setSubject] = useState<string>(initialSubject || 'Notificación Oficial AliClip Store');
  const [bodyHtml, setBodyHtml] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  // Mandatory confirmation dialog state
  const [showConfirmSend, setShowConfirmSend] = useState<boolean>(false);

  // Check initial token
  useEffect(() => {
    let isMounted = true;
    const checkToken = async () => {
      const token = await getGmailAccessToken();
      if (token) {
        setIsAuthenticated(true);
        try {
          const prof = await fetchGmailProfile();
          if (isMounted) setProfile(prof);
        } catch {
          // Token might need re-auth
          setIsAuthenticated(false);
        }
      }
    };
    checkToken();
    return () => {
      isMounted = false;
    };
  }, []);

  // Set initial template if provided
  useEffect(() => {
    if (initialTemplate === 'welcome') {
      setBodyHtml(generateWelcomeEmailHtml({ name: 'Cliente', email: initialRecipient || 'cliente@ejemplo.com' }));
      setSubject('¡Bienvenido a AliClip Store! Tu cuenta oficial está lista');
      setActiveTab('compose');
    } else if (initialTemplate === 'credentials') {
      setBodyHtml(
        generateCredentialsEmailHtml(
          { clientName: 'Cliente', productName: 'Membresía Premium Digital' },
          { email: 'usuario@ejemplo.com', pin: '1234' }
        )
      );
      setSubject('Tus Credenciales y Datos de Acceso Oficiales - AliClip');
      setActiveTab('compose');
    } else if (initialTemplate === 'alert') {
      setBodyHtml(generateAdminOrderAlertEmailHtml({ clientName: 'Cliente VIP', productName: 'ChatGPT Plus' }));
      setSubject('🔔 Alerta: Nueva Orden Registrada en AliClip');
      setActiveTab('compose');
    } else if (initialRecipient) {
      setRecipient(initialRecipient);
      setActiveTab('compose');
    }
  }, [initialTemplate, initialRecipient, initialSubject]);

  // Load messages when authenticated in inbox tab
  const handleLoadMessages = async (query = searchQuery) => {
    setLoadingMessages(true);
    try {
      const msgs = await listGmailMessages(query, 20);
      setMessages(msgs);
    } catch (err: any) {
      console.warn('Error cargando mensajes de Gmail:', err);
      onToast(`⚠️ ${err?.message || 'Error cargando correos de Gmail'}`);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'inbox') {
      handleLoadMessages();
    }
  }, [isAuthenticated, activeTab]);

  // Handle Google Sign-In with Gmail permissions
  const handleGoogleSignIn = async () => {
    setLoadingAuth(true);
    try {
      const { user } = await signInWithGmail();
      setIsAuthenticated(true);
      const prof = await fetchGmailProfile();
      setProfile(prof);
      onToast(`¡Conectado exitosamente con Gmail (${prof.emailAddress || user.email})!`);
      handleLoadMessages();
    } catch (err: any) {
      console.error('Error al conectar con Gmail:', err);
      onToast(`⚠️ ${err?.message || 'Error al conectar con Google Gmail'}`);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleDisconnect = () => {
    clearGmailAuth();
    setIsAuthenticated(false);
    setProfile(null);
    setMessages([]);
    setSelectedMessage(null);
    onToast('Sesión de Gmail desconectada de la memoria.');
  };

  // Open message details
  const handleSelectMessage = async (msgSummary: GmailMessageSummary) => {
    setLoadingDetail(true);
    try {
      const detail = await getGmailMessage(msgSummary.id);
      setSelectedMessage(detail);
    } catch (err: any) {
      onToast(`⚠️ No se pudo cargar el mensaje completo: ${err?.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Apply quick templates in composer
  const handleApplyTemplate = (type: 'welcome' | 'credentials' | 'alert') => {
    if (type === 'welcome') {
      setBodyHtml(generateWelcomeEmailHtml({ name: 'Cliente VIP', email: recipient || 'cliente@ejemplo.com' }));
      setSubject('¡Bienvenido a AliClip Store! Tu cuenta oficial está lista');
    } else if (type === 'credentials') {
      setBodyHtml(
        generateCredentialsEmailHtml(
          { clientName: 'Cliente VIP', productName: 'Membresía Premium Digital' },
          { email: 'usuario@ejemplo.com', pin: '8842', instructions: 'Ingresar desde el enlace oficial' }
        )
      );
      setSubject('Tus Credenciales y Datos de Acceso Oficiales - AliClip');
    } else if (type === 'alert') {
      setBodyHtml(generateAdminOrderAlertEmailHtml({ clientName: 'Cliente VIP', productName: 'Suscripción Digital' }));
      setSubject('🔔 Alerta: Nueva Orden Registrada en AliClip');
    }
    onToast('Plantilla aplicada en el editor.');
  };

  // Step 1: Pre-send validation & trigger explicit confirmation modal
  const handlePreSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !recipient.includes('@')) {
      onToast('⚠️ Ingresa un correo electrónico de destinatario válido.');
      return;
    }
    if (!subject.trim()) {
      onToast('⚠️ El asunto no puede estar vacío.');
      return;
    }
    if (!bodyHtml.trim()) {
      onToast('⚠️ El cuerpo del correo no puede estar vacío.');
      return;
    }
    // Present mandatory explicit confirmation dialog
    setShowConfirmSend(true);
  };

  // Step 2: Confirmed send through Gmail API
  const handleExecuteSend = async () => {
    setShowConfirmSend(false);
    setSendingEmail(true);
    try {
      await sendGmailMessage({
        to: recipient.trim(),
        subject: subject.trim(),
        htmlBody: bodyHtml,
      });
      onToast(`¡Correo despachado con éxito a ${recipient} vía Gmail! 🚀`);
      setRecipient('');
      setBodyHtml('');
      setActiveTab('inbox');
      handleLoadMessages();
    } catch (err: any) {
      console.error('Error enviando con Gmail:', err);
      onToast(`⚠️ Error al enviar correo: ${err?.message || 'Fallo desconocido'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl max-w-4xl w-full h-[90vh] max-h-[780px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold">Gestión & Despacho Gmail</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {profile?.emailAddress ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Conectado: {profile.emailAddress}
                  </span>
                ) : (
                  'Conecta tu cuenta de Gmail para enviar y gestionar correos oficiales de la tienda'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleDisconnect}
                title="Desconectar cuenta de Gmail"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isAuthenticated ? (
          /* Sign-In View with official Google Button */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/20 mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold mb-1">Conectar con Gmail Oficial</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Inicia sesión con tu cuenta de Google autorizada para enviar correos de bienvenida, comprobantes y credenciales de acceso directamente desde tu buzón de Gmail.
            </p>

            {/* Official Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingAuth}
              className="w-full py-3 px-5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-.78-.07-1.53-.2-2.25H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{loadingAuth ? 'Conectando con Google...' : 'Continuar con Google (Gmail)'}</span>
            </button>

            <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              🔒 <strong>Privacidad y Seguridad:</strong> El token de acceso se almacena exclusivamente en la memoria temporal durante tu sesión y nunca se expone en almacenamiento persistente ni en repositorios.
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sub-Navigation Tabs */}
            <div className="px-5 pt-3 pb-0 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-[#0f172a]">
              <button
                type="button"
                onClick={() => setActiveTab('inbox')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'inbox'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Inbox className="w-4 h-4" />
                <span>Bandeja de Entrada ({messages.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('compose')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'compose'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Redactar / Despachar</span>
              </button>
            </div>

            {/* TAB 1: INBOX */}
            {activeTab === 'inbox' && (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Message List */}
                <div className="w-full md:w-5/12 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
                  {/* Search Bar */}
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleLoadMessages(searchQuery);
                        }}
                        placeholder="Buscar por correo, código..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoadMessages(searchQuery)}
                      disabled={loadingMessages}
                      title="Refrescar correos"
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Message Item List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {loadingMessages ? (
                      <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                        Cargando mensajes de Gmail...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No se encontraron correos para mostrar.
                      </div>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleSelectMessage(m)}
                          className={`p-3 cursor-pointer transition-colors text-left ${
                            selectedMessage?.id === m.id
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[11px] font-bold truncate max-w-[170px] text-slate-800 dark:text-slate-200">
                              {m.from || 'Remitente'}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {m.date ? new Date(m.date).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate mb-1">
                            {m.subject}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                            {m.snippet}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Message Reading Pane */}
                <div className="w-full md:w-7/12 flex-1 flex flex-col h-full overflow-hidden bg-slate-50/40 dark:bg-slate-900/20">
                  {loadingDetail ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400 animate-pulse">
                      Abriendo mensaje...
                    </div>
                  ) : selectedMessage ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-5">
                      <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
                        <h3 className="text-base font-extrabold mb-1.5">{selectedMessage.subject}</h3>
                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                          <div>
                            <strong>De:</strong> {selectedMessage.from}
                          </div>
                          <div>{selectedMessage.date}</div>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          <strong>Para:</strong> {selectedMessage.to}
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
                        {selectedMessage.bodyHtml ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
                            className="prose dark:prose-invert max-w-none text-xs"
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {selectedMessage.bodyText}
                          </pre>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Quick reply setup
                            const emailMatch = selectedMessage.from.match(/<([^>]+)>/) || [null, selectedMessage.from];
                            const replyTo = emailMatch[1] || selectedMessage.from;
                            setRecipient(replyTo);
                            setSubject(`Re: ${selectedMessage.subject}`);
                            setActiveTab('compose');
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Responder por Gmail</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs">
                      <Inbox className="w-10 h-10 mb-2 stroke-[1.5]" />
                      <p>Selecciona un correo de la lista para leer su contenido completo.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: COMPOSE / DISPATCH */}
            {activeTab === 'compose' && (
              <form onSubmit={handlePreSend} className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
                {/* Template quick-picker toolbar */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Cargar Plantilla Oficial:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('credentials')}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      🔐 Credenciales de Compra
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('welcome')}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      🎉 Bienvenida a AliClip
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('alert')}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      🔔 Alerta de Pedido
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Destinatario (Cliente)
                    </label>
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Asunto del Correo
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Asunto del correo"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Editor / Preview Mode Switch */}
                <div className="flex-1 flex flex-col min-h-[220px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                      Cuerpo del Mensaje (Soporta HTML Responsive Oficial)
                    </label>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('edit')}
                        className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                          previewMode === 'edit'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        <Edit3 className="w-3 h-3 inline mr-1" />
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('preview')}
                        className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                          previewMode === 'preview'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        <Eye className="w-3 h-3 inline mr-1" />
                        Vista Previa
                      </button>
                    </div>
                  </div>

                  {previewMode === 'edit' ? (
                    <textarea
                      rows={10}
                      value={bodyHtml}
                      onChange={(e) => setBodyHtml(e.target.value)}
                      placeholder="Escribe el mensaje o pega una plantilla HTML responsive..."
                      required
                      className="flex-1 w-full p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    />
                  ) : (
                    <div className="flex-1 overflow-y-auto p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-[200px]">
                      {bodyHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: bodyHtml }} className="text-xs" />
                      ) : (
                        <p className="text-slate-400 text-xs text-center py-8">El cuerpo del correo está vacío.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Send Action */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">
                    Remitente activo: <strong>{profile?.emailAddress || 'Tu cuenta de Gmail'}</strong>
                  </div>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sendingEmail ? 'Enviando...' : 'Enviar Correo por Gmail'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* MANDATORY CONFIRMATION DIALOG FOR DESTRUCTIVE / MUTATING OPERATION (SENDING REAL EMAIL) */}
      {showConfirmSend && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-center mb-2">
              ¿Confirmas el envío de este correo?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4 leading-relaxed">
              Esta acción despachará un correo electrónico real a través de tu cuenta oficial de Gmail conectada (<strong>{profile?.emailAddress}</strong>).
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs mb-5 space-y-1.5">
              <div>
                <span className="text-slate-400">Destinatario:</span> <strong className="text-slate-900 dark:text-white">{recipient}</strong>
              </div>
              <div>
                <span className="text-slate-400">Asunto:</span> <span className="font-semibold text-slate-900 dark:text-white">{subject}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmSend(false)}
                className="w-1/2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteSend}
                className="w-1/2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirmar y Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GmailModal;
