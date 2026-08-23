import React, { useState, useEffect, useMemo } from 'react';
import { collection, doc, onSnapshot, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import {
  Crown,
  Building2,
  Users,
  ShieldCheck,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Save,
  Key,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Filter,
  Calendar,
  DollarSign,
  Check,
  X,
  Shield,
  ArrowUpRight,
  UserCheck,
  Mail,
  Copy,
  ExternalLink,
  Code,
  Eye,
  FileText,
  Download,
  Trash2,
  MessageCircle,
  Send,
  Share2,
  Phone,
  Gift,
  Zap,
  Instagram,
  Camera
} from 'lucide-react';
import kiwifyBannerImg from '../assets/images/kiwify_banner_standard_1787495484627.jpg';
import kiwifyBannerLifetimeImg from '../assets/images/kiwify_banner_vitalicio_1787495475538.jpg';
import luxuryAppIcon from '../assets/images/luxury_app_icon_1787495429884.jpg';
import { motion, AnimatePresence } from 'framer-motion';

interface ChurchItem {
  id: string;
  name: string;
  inviteCode: string;
  createdAt?: string;
  createdBy?: string;
  planStatus?: 'active' | 'trial' | 'suspended' | 'cancelled';
  planName?: string;
  planExpiresAt?: string | null;
  masterNotes?: string;
  maxMembers?: number;
  contactEmail?: string;
  contactPhone?: string;
}

interface MemberItem {
  id: string;
  name?: string;
  email?: string;
  photoUrl?: string;
  churchId?: string;
  isAdmin?: boolean;
  roles?: string[];
  createdAt?: string;
}

export default function MasterAdminView({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const { user } = useAuth();
  
  // Security Check: Authorized Master Emails
  const userEmailLower = user?.email?.toLowerCase() || '';
  const isAuthorized = userEmailLower === 'miqueiasmellopro@gmail.com' || userEmailLower === 'mikmellorg@gmail.com';

  const [churches, setChurches] = useState<ChurchItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'suspended' | 'cancelled'>('all');
  const [expandedChurchId, setExpandedChurchId] = useState<string | null>(null);

  // Modal / Edit States
  const [editingChurch, setEditingChurch] = useState<ChurchItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Church Form
  const [newChurchName, setNewChurchName] = useState('');
  const [newInviteCode, setNewInviteCode] = useState('');
  const [newPlanStatus, setNewPlanStatus] = useState<'active' | 'trial' | 'suspended'>('active');
  const [newPlanName, setNewPlanName] = useState('Plano Completo');
  const [newPlanDurationDays, setNewPlanDurationDays] = useState('365');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newMasterNotes, setNewMasterNotes] = useState('');

  const handleDownloadResizedIcon = (targetSize: number, fileName: string, isCircular: boolean = true) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (isCircular) {
          // Adaptação para formato redondo perfeito (Instagram Avatar Crop)
          ctx.beginPath();
          ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
        }

        ctx.drawImage(img, 0, 0, targetSize, targetSize);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        const finalName = fileName.endsWith('.png') ? fileName : fileName.replace(/\.jpg$/, '.png');
        link.download = finalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    img.src = luxuryAppIcon;
  };

  // Quick License Extension State
  const [quickExtendChurchId, setQuickExtendChurchId] = useState<string | null>(null);
  const [deletingChurchId, setDeletingChurchId] = useState<string | null>(null);

  // Active Tab & Kiwify Webhook States
  const [activeTab, setActiveTab] = useState<'churches' | 'kiwify' | 'whatsapp'>('churches');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // WhatsApp Share / Prospecting States
  const appInviteLink = useMemo(() => {
    return 'https://www.liloupro.com.br/?landing=true';
  }, []);

  const DEFAULT_WA_MESSAGES = useMemo(() => ({
    vip: `🙌 *Olá, Músico e Líder de Louvor!* 

Tudo bem? Gostaria de te fazer um convite especial para conhecer o *Liloupro*, a plataforma completa de gestão de louvor, cifras interativas e escalas de ministério feita por quem entende o dia a dia da igreja!

✨ *Por que o Liloupro vai transformar o seu ministério?*
🎵 *Cifras Interativas*: Transposição automática em 1 toque, diagramas de violão/teclado (dedos e intervalos) e campo harmônico.
📅 *Escalas Inteligentes*: Gestão de voluntários, avisos e confirmações automáticas para a equipe.
📊 *Repertórios Organizados*: Anexos de áudio, metrônomo, tom do cantor, andamento e mapa de dinâmica de culto.
📱 *Otimizado para Celular*: Design leve e ultra-rápido para ensaios e no altar!

🎁 *PRESENTE ESPECIAL DE BOAS-VINDAS:*
Liberamos *30 DIAS GRÁTIS DE ACESSO VIP COMPLETO* para a sua igreja testar sem nenhum compromisso!

👉 *Acesse agora e comece a usar em segundos:*
${appInviteLink}

Qualquer dúvida ou para ativar a sua igreja, estou à disposição por aqui. Deus abençoe grandemente seu ministério! 🙏✨`,

    quick: `Paz do Senhor, Músico/Líder! 🙏

Já conhece o *Liloupro*? É a plataforma mais completa para organizar cifras, repertórios e escalas de ministérios de louvor de forma super simples!

Liberamos um presente de *30 DIAS GRÁTIS DE ACESSO VIP* para a sua igreja experimentar sem custo:

👉 *Acesse o app aqui:* ${appInviteLink}

Aproveite para testar no próximo ensaio ou culto de domingo! 🎵🙌`,

    pastor: `Paz e bem, Pastor(a) / Liderança! ⛪

Apresento o *Liloupro*, a plataforma desenvolvida para elevar a organização, pontualidade e excelência do ministério de louvor da sua igreja.

Com ele, seus músicos acompanham cifras no tom certo, recebem escalas com confirmação de presença e organizam os cultos em um só lugar.

Liberamos um teste gratuito de *30 dias VIP sem compromisso* para a sua igreja:
👉 ${appInviteLink}

Conte conosco para servir seu ministério com excelência!`
  }), [appInviteLink]);

  const [waPreset, setWaPreset] = useState<'vip' | 'quick' | 'pastor'>('vip');
  const [waCustomMessage, setWaCustomMessage] = useState(DEFAULT_WA_MESSAGES.vip);
  const [waTargetPhone, setWaTargetPhone] = useState('');
  const [copiedWaMessage, setCopiedWaMessage] = useState(false);
  const [copiedWaLink, setCopiedWaLink] = useState(false);

  const handleSelectWaPreset = (preset: 'vip' | 'quick' | 'pastor') => {
    setWaPreset(preset);
    setWaCustomMessage(DEFAULT_WA_MESSAGES[preset]);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = waTargetPhone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(waCustomMessage);
    let waUrl = '';
    if (cleanPhone.length >= 8) {
      const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      waUrl = `https://wa.me/${finalPhone}?text=${encodedText}`;
    } else {
      waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    }
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    showToast('Abrindo WhatsApp...');
  };

  const handleCopyWaMessage = () => {
    navigator.clipboard.writeText(waCustomMessage);
    setCopiedWaMessage(true);
    showToast('Mensagem de convite copiada!');
    setTimeout(() => setCopiedWaMessage(false), 3000);
  };

  const handleCopyWaLink = () => {
    navigator.clipboard.writeText(appInviteLink);
    setCopiedWaLink(true);
    showToast('Link do Liloupro copiado!');
    setTimeout(() => setCopiedWaLink(false), 3000);
  };

  // Kiwify Log Filters & Payload Inspection Modal State
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterType, setLogFilterType] = useState<'all' | 'paid' | 'refunded' | 'simulation'>('all');
  const [inspectingPayload, setInspectingPayload] = useState<any | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Kiwify Simulator Form
  const [simName, setSimName] = useState('Pr. Carlos Oliveira');
  const [simEmail, setSimEmail] = useState('carlos@igrejaexemplo.com.br');
  const [simProduct, setSimProduct] = useState('Liloupro - Plano Completo');
  const [simStatus, setSimStatus] = useState('paid');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  // Computed Webhook Log Metrics for Admin Support Dashboard
  const logMetrics = useMemo(() => {
    const total = webhookLogs.length;
    const paidCount = webhookLogs.filter(l => 
      (l.orderStatus || '').toLowerCase().includes('paid') || 
      (l.eventType || '').toLowerCase().includes('approved') ||
      (l.planStatus || '') === 'active'
    ).length;
    const refundCount = webhookLogs.filter(l => 
      (l.orderStatus || '').toLowerCase().includes('refund') || 
      (l.orderStatus || '').toLowerCase().includes('cancel') ||
      (l.planStatus || '') === 'suspended'
    ).length;
    const simCount = webhookLogs.filter(l => l.isSimulation).length;
    const successRate = total > 0 ? Math.round((paidCount / total) * 100) : 100;

    return { total, paidCount, refundCount, simCount, successRate };
  }, [webhookLogs]);

  // Computed Filtered Webhook Logs
  const filteredWebhookLogs = useMemo(() => {
    return webhookLogs.filter(log => {
      // Type Filter
      if (logFilterType === 'paid') {
        const isApproved = (log.orderStatus || '').toLowerCase().includes('paid') || 
                           (log.eventType || '').toLowerCase().includes('approved') ||
                           log.planStatus === 'active';
        if (!isApproved) return false;
      } else if (logFilterType === 'refunded') {
        const isRefund = (log.orderStatus || '').toLowerCase().includes('refund') || 
                         (log.orderStatus || '').toLowerCase().includes('cancel') ||
                         log.planStatus === 'suspended';
        if (!isRefund) return false;
      } else if (logFilterType === 'simulation') {
        if (!log.isSimulation) return false;
      }

      // Search Query Filter
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase().trim();
        const email = (log.customerEmail || '').toLowerCase();
        const name = (log.customerName || '').toLowerCase();
        const orderId = (log.orderId || '').toLowerCase();
        const churchId = (log.churchId || '').toLowerCase();
        const inviteCode = (log.inviteCode || '').toLowerCase();
        const product = (log.productName || '').toLowerCase();

        return email.includes(q) || name.includes(q) || orderId.includes(q) || churchId.includes(q) || inviteCode.includes(q) || product.includes(q);
      }

      return true;
    });
  }, [webhookLogs, logSearchQuery, logFilterType]);

  const handleJumpToChurch = (churchEmailOrId: string) => {
    setActiveTab('churches');
    setSearchQuery(churchEmailOrId);
    showToast(`Filtrando igreja vinculada: ${churchEmailOrId}`, 'success');
  };

  const handleCopyPayloadJson = () => {
    if (!inspectingPayload) return;
    const jsonStr = JSON.stringify(inspectingPayload.rawPayload || inspectingPayload, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedPayload(true);
    showToast('Payload JSON do Webhook copiado!');
    setTimeout(() => setCopiedPayload(false), 3000);
  };

  // Toast / Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const officialDomain = 'https://www.liloupro.com.br';
  const webhookFullUrl = `${officialDomain}/api/webhooks/kiwify`;
  const salesPageFullUrl = `${officialDomain}/?landing=true`;

  // Dev preview URLs for testing
  const currentDevOrigin = typeof window !== 'undefined' ? window.location.origin : officialDomain;
  const devWebhookUrl = `${currentDevOrigin}/api/webhooks/kiwify`;

  const [copiedSalesUrl, setCopiedSalesUrl] = useState(false);

  const handleCopySalesUrl = () => {
    navigator.clipboard.writeText(salesPageFullUrl);
    setCopiedSalesUrl(true);
    showToast('Link da Página de Vendas (Sales Page) copiado!');
    setTimeout(() => setCopiedSalesUrl(false), 3000);
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookFullUrl);
    setCopiedUrl(true);
    showToast('URL do Webhook Kiwify copiada com sucesso!');
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  const fetchWebhookLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/webhooks/kiwify/logs');
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Erro ao carregar logs Kiwify:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'kiwify') {
      fetchWebhookLogs();
    }
  }, [activeTab]);

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/webhooks/kiwify/test-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: simName,
          email: simEmail,
          productName: simProduct,
          status: simStatus,
          eventType: simStatus === 'paid' ? 'order_approved' : 'order_refunded'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        setSimResult(data);
        fetchWebhookLogs();
      } else {
        showToast(data.error || 'Falha ao simular webhook', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro de conexão na simulação', 'error');
    } finally {
      setSimulating(false);
    }
  };

  // Realtime Listeners
  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listen to Churches
    const unsubChurches = onSnapshot(collection(db, 'churches'), (snap) => {
      const churchList: ChurchItem[] = snap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Igreja sem nome',
        inviteCode: doc.data().inviteCode || doc.id.toUpperCase(),
        createdAt: doc.data().createdAt || new Date().toISOString(),
        createdBy: doc.data().createdBy || 'Sistema',
        planStatus: doc.data().planStatus || 'active',
        planName: doc.data().planName || 'PRO',
        planExpiresAt: doc.data().planExpiresAt || null,
        masterNotes: doc.data().masterNotes || '',
        maxMembers: doc.data().maxMembers || 9999,
        contactEmail: doc.data().contactEmail || '',
        contactPhone: doc.data().contactPhone || ''
      }));

      // If 'semente' church is not in list, add a fallback representation
      if (!churchList.find(c => c.id === 'semente')) {
        churchList.unshift({
          id: 'semente',
          name: 'Igreja Principal (Semente)',
          inviteCode: 'SEMENTE123',
          createdAt: new Date().toISOString(),
          planStatus: 'active',
          planName: 'PRO (Vitalício)',
          planExpiresAt: null,
          masterNotes: 'Igreja Matriz padrão do sistema.'
        });
      }

      setChurches(churchList);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar igrejas:", error);
      handleFirestoreError(error, OperationType.GET, 'churches');
      setLoading(false);
    });

    // Listen to Members
    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
      const memberList: MemberItem[] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(memberList);
    }, (error) => {
      console.error("Erro ao carregar membros:", error);
      handleFirestoreError(error, OperationType.GET, 'members');
    });

    return () => {
      unsubChurches();
      unsubMembers();
    };
  }, [isAuthorized]);

  // Compute Stats
  const stats = useMemo(() => {
    const totalChurches = churches.length;
    const activeChurches = churches.filter(c => c.planStatus === 'active' || !c.planStatus).length;
    const trialChurches = churches.filter(c => c.planStatus === 'trial').length;
    const suspendedChurches = churches.filter(c => c.planStatus === 'suspended' || c.planStatus === 'cancelled').length;
    const totalMembers = members.length;
    const avgMembersPerChurch = totalChurches > 0 ? (totalMembers / totalChurches).toFixed(1) : '0';

    return {
      totalChurches,
      activeChurches,
      trialChurches,
      suspendedChurches,
      totalMembers,
      avgMembersPerChurch
    };
  }, [churches, members]);

  // Filtered Churches
  const filteredChurches = useMemo(() => {
    return churches.filter(church => {
      const matchesSearch = 
        church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        church.inviteCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        church.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (church.contactEmail && church.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || church.planStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [churches, searchQuery, statusFilter]);

  // Handle Quick Status Change
  const handleUpdateStatus = async (churchId: string, status: 'active' | 'trial' | 'suspended' | 'cancelled') => {
    try {
      const churchRef = doc(db, 'churches', churchId);
      await updateDoc(churchRef, {
        planStatus: status,
        updatedAt: new Date().toISOString()
      });
      showToast(`Status da igreja atualizado para "${status.toUpperCase()}" com sucesso!`);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      showToast("Não foi possível atualizar o status.", "error");
    }
  };

  // Handle License Extension
  const handleExtendLicense = async (churchId: string, days: number | null) => {
    try {
      let expiresAt: string | null = null;
      if (days !== null) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        expiresAt = d.toISOString();
      }

      const churchRef = doc(db, 'churches', churchId);
      await updateDoc(churchRef, {
        planExpiresAt: expiresAt,
        planStatus: 'active',
        updatedAt: new Date().toISOString()
      });

      const label = days === null ? 'Vitalício (Sem Expiração)' : `+${days} dias`;
      showToast(`Validade da licença atualizada para: ${label}`);
      setQuickExtendChurchId(null);
    } catch (err) {
      console.error("Erro ao estender licença:", err);
      showToast("Falha ao atualizar licença.", "error");
    }
  };

  // Handle Update Church Plan Name
  const handleUpdatePlanName = async (churchId: string, planName: string) => {
    try {
      const churchRef = doc(db, 'churches', churchId);
      await updateDoc(churchRef, {
        planName,
        updatedAt: new Date().toISOString()
      });
      showToast(`Plano da igreja alterado para "${planName}" com sucesso!`);
    } catch (err) {
      console.error("Erro ao atualizar plano:", err);
      showToast("Falha ao atualizar plano da igreja.", "error");
    }
  };

  // Handle Save Master Notes
  const handleSaveNotes = async (churchId: string, notes: string) => {
    try {
      const churchRef = doc(db, 'churches', churchId);
      await updateDoc(churchRef, {
        masterNotes: notes,
        updatedAt: new Date().toISOString()
      });
      showToast("Observações salvas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar notas:", err);
      showToast("Falha ao salvar observações.", "error");
    }
  };

  // Handle Delete Church
  const handleDeleteChurch = async (churchId: string, churchName: string) => {
    try {
      await deleteDoc(doc(db, 'churches', churchId));
      setDeletingChurchId(null);
      showToast(`Igreja "${churchName}" excluída com sucesso!`);
    } catch (err) {
      console.error("Erro ao excluir igreja:", err);
      showToast("Falha ao excluir a igreja.", "error");
    }
  };

  // Handle Create New Church
  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChurchName.trim()) {
      showToast("Preencha o nome da igreja.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedDocId = newChurchName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim() || `church-${Date.now()}`;
      const code = newInviteCode.trim().toUpperCase() || `${newChurchName.substring(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

      let expiresAt: string | null = null;
      if (newPlanDurationDays !== 'unlimited') {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(newPlanDurationDays, 10));
        expiresAt = d.toISOString();
      }

      const churchRef = doc(db, 'churches', generatedDocId);
      await setDoc(churchRef, {
        name: newChurchName.trim(),
        inviteCode: code,
        planStatus: newPlanStatus,
        planName: newPlanName,
        planExpiresAt: expiresAt,
        contactEmail: newContactEmail.trim(),
        masterNotes: newMasterNotes.trim(),
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'MasterAdmin'
      });

      showToast(`Igreja "${newChurchName}" cadastrada com sucesso! Código: ${code}`);
      setShowCreateModal(false);
      setNewChurchName('');
      setNewInviteCode('');
      setNewContactEmail('');
      setNewMasterNotes('');
    } catch (err) {
      console.error("Erro ao criar igreja:", err);
      showToast("Erro ao criar igreja no sistema.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mb-4 text-red-500 shadow-xl">
          <Shield size={38} />
        </div>
        <h2 className="text-2xl font-black text-text-main tracking-tight mb-2">Acesso Restrito ao Master Admin</h2>
        <p className="text-sm text-text-muted max-w-md leading-relaxed mb-6">
          Este painel de controle central do Liloupro é exclusivo para o e-mail de negócios proprietário (<strong className="text-brand font-black">miqueiasmellopro@gmail.com</strong>).
        </p>
        <div className="bg-black/5 dark:bg-white/5 border border-border/60 rounded-2xl p-4 text-xs font-mono text-text-muted">
          Sua conta atual: <span className="text-text-main font-bold">{user?.email || 'Não autenticado'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      {/* Toast Alert */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 text-sm font-bold max-w-md ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200 backdrop-blur-md'
                : 'bg-red-950/90 border-red-500/30 text-red-200 backdrop-blur-md'
            }`}
          >
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={20} className="text-red-400 shrink-0" />}
            <span>{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-6 sm:p-8 border border-indigo-500/30 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider">
              <Crown size={14} className="text-amber-400 animate-bounce" /> Painel Master SaaS • Controle Central
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Gestão de Igrejas & Licenças LiLouPro
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Monitore igrejas ativas, controle planos, gerencie validades de assinaturas e acompanhe o crescimento de usuários em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-hover hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} /> Cadastrar Nova Igreja
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-3 border-b border-border/80 pb-3 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('churches')}
          className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'churches'
              ? 'bg-brand text-white shadow-lg shadow-brand/20'
              : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main'
          }`}
        >
          <Building2 size={16} /> Gestão de Igrejas ({churches.length})
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main'
          }`}
        >
          <MessageCircle size={16} className="text-emerald-400" /> 🟢 Divulgação WhatsApp (30 Dias Grátis)
        </button>

        <button
          onClick={() => setActiveTab('kiwify')}
          className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'kiwify'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main'
          }`}
        >
          <Sparkles size={16} className="text-amber-300" /> ⚡ Automação Kiwify (Opção B Webhook)
        </button>
      </div>

      {activeTab === 'whatsapp' ? (
        /* --- WHATSAPP PROSPECTING & INVITATIONS TAB --- */
        <div className="space-y-8 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  <Gift size={14} className="text-emerald-400" /> Convite Irresistível • 30 Dias Grátis VIP
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <MessageCircle size={28} className="text-emerald-400" /> Divulgação & Convite pelo WhatsApp
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Convide pastores, ministros e líderes de louvor para experimentarem o <strong>Liloupro</strong> por 30 dias grátis sem compromisso. Essa é a forma mais rápida e acolhedora de atrair igrejas e converter futuras vendas!
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleOpenWhatsApp}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={18} /> Compartilhar no WhatsApp
                </button>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Zap size={14} /> Selecione o Estilo de Convite Predefinido:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectWaPreset('vip')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    waPreset === 'vip'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-black/40 border-white/10 text-slate-300 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <Gift size={15} /> Convite VIP Completo
                    </span>
                    {waPreset === 'vip' && <CheckCircle2 size={16} className="text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    Apresentação amigável com lista de benefícios e presente de 30 dias grátis.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectWaPreset('quick')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    waPreset === 'quick'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-black/40 border-white/10 text-slate-300 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <Zap size={15} /> Curto & Direto
                    </span>
                    {waPreset === 'quick' && <CheckCircle2 size={16} className="text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    Perfeito para grupos de WhatsApp e conversas rápidas no privado.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectWaPreset('pastor')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    waPreset === 'pastor'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-black/40 border-white/10 text-slate-300 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-indigo-300">
                      <Building2 size={15} /> Pastores & Diretoria
                    </span>
                    {waPreset === 'pastor' && <CheckCircle2 size={16} className="text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    Tom institucional e respeitoso focado em organização e excelência.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Main Editor & Live WhatsApp Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Editor & Options */}
            <div className="lg:col-span-7 bg-surface border border-border/80 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="font-black text-base text-text-main flex items-center gap-2">
                  <Edit3 size={18} className="text-emerald-500" /> Edite e Personalize a Mensagem
                </h3>
                <span className="text-[11px] font-bold text-text-muted bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-full">
                  {waCustomMessage.length} caracteres
                </span>
              </div>

              {/* Optional Target Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-500" /> WhatsApp do Destinatário (Opcional):
                  </span>
                  <span className="text-[10px] text-text-muted font-normal">Ex: 11999998888 ou Deixe em branco</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5511999998888 (ou deixe vazio para escolher no WhatsApp)"
                  value={waTargetPhone}
                  onChange={(e) => setWaTargetPhone(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border/80 focus:border-emerald-500 font-mono text-xs text-text-main focus:outline-hidden transition-all"
                />
              </div>

              {/* Text Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center justify-between">
                  <span>Texto da Mensagem:</span>
                  <button
                    type="button"
                    onClick={() => handleSelectWaPreset(waPreset)}
                    className="text-[11px] font-bold text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} /> Restaurar Padrão
                  </button>
                </label>
                <textarea
                  value={waCustomMessage}
                  onChange={(e) => setWaCustomMessage(e.target.value)}
                  rows={12}
                  className="w-full p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border/80 focus:border-emerald-500 font-sans text-xs sm:text-sm text-text-main leading-relaxed focus:outline-hidden transition-all resize-y"
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={handleOpenWhatsApp}
                  className="px-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={16} /> Abrir WhatsApp
                </button>

                <button
                  onClick={handleCopyWaMessage}
                  className="px-4 py-3.5 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-main font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-border"
                >
                  {copiedWaMessage ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  {copiedWaMessage ? 'Copiado!' : 'Copiar Texto'}
                </button>

                <button
                  onClick={handleCopyWaLink}
                  className="px-4 py-3.5 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-main font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-border"
                >
                  {copiedWaLink ? <Check size={16} className="text-emerald-500" /> : <ExternalLink size={16} />}
                  {copiedWaLink ? 'Link Copiado!' : 'Copiar Link'}
                </button>
              </div>
            </div>

            {/* Right Column: Live WhatsApp Bubble Preview */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#0b141a] border border-[#202c33] rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
                {/* WhatsApp Header Mock */}
                <div className="flex items-center gap-3 pb-3 border-b border-[#202c33]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-sm shadow-md">
                    LLP
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      LiLouPro • Convite Especial <CheckCircle2 size={14} className="text-emerald-400" />
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-medium">pré-visualização ao vivo</p>
                  </div>
                </div>

                {/* Chat Bubble */}
                <div className="bg-[#005c4b] text-slate-100 rounded-2xl rounded-tl-xs p-4 shadow-md space-y-2 text-xs leading-relaxed font-sans border border-[#007a64]">
                  <div className="whitespace-pre-wrap select-text tracking-wide">
                    {waCustomMessage}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200/80 pt-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-emerald-300 font-bold">✓✓</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center font-medium pt-1">
                  📱 Esta é a prévia exata de como o convite chegará no WhatsApp.
                </div>
              </div>

              {/* Pro Tips Card */}
              <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-black border border-amber-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
                  <Sparkles size={16} className="text-amber-400" /> Dicas de Conversão no WhatsApp
                </div>
                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-black">1.</span>
                    <span><strong>Grupos de Liderança:</strong> Compartilhe nos grupos de WhatsApp de ministérios da sua cidade e região.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-black">2.</span>
                    <span><strong>Momento Pós-Culto:</strong> Envie no domingo à noite ou segunda de manhã, quando líderes planejam a semana.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-black">3.</span>
                    <span><strong>Degustação VIP:</strong> O presente de 30 dias cria engajamento rápido, facilitando a contratação do plano pago!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'kiwify' ? (
        /* --- KIWIFY WEBHOOK AUTOMATION TAB --- */
        <div className="space-y-8 animate-fade-in">
          {/* Banner URL Webhook */}
          <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-black border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Ativação 100% Automática Sem Intervenção Manual
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  URL do Webhook Oficial Kiwify
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Copie o link abaixo e insira no painel da Kiwify em <strong>Configurações &gt; Webhooks</strong>. Toda compra aprovada criará a igreja e ativará o plano em milissegundos.
                </p>
              </div>

              <button
                onClick={handleCopyWebhookUrl}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {copiedUrl ? <Check size={18} /> : <Copy size={18} />}
                {copiedUrl ? 'Copiado!' : 'Copiar URL do Webhook'}
              </button>
            </div>

            {/* Display Box with URL */}
            <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-3 overflow-hidden w-full">
                <ExternalLink size={18} className="text-emerald-400 shrink-0" />
                <span className="text-emerald-200 font-bold truncate select-all">{webhookFullUrl}</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0 font-sans font-bold">
                PROD • POST JSON
              </span>
            </div>
            {currentDevOrigin !== officialDomain && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-mono">
                <span className="truncate">Preview Dev URL: {devWebhookUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(devWebhookUrl);
                    showToast('Dev Webhook URL copiado!');
                  }}
                  className="text-[10px] font-bold text-amber-400 hover:text-amber-300 uppercase shrink-0 underline cursor-pointer"
                >
                  Copiar Dev URL
                </button>
              </div>
            )}

            {/* Step-by-Step Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs pt-2">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-amber-400 font-black text-base">1. Acesse a Kiwify</span>
                <p className="text-slate-300 text-[11px]">Entre na sua conta da Kiwify e vá no menu de <strong>Webhooks</strong> do produto LiLouPro.</p>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-amber-400 font-black text-base">2. Cole a URL</span>
                <p className="text-slate-300 text-[11px]">Clique em <strong>Criar Webhook</strong> e cole a URL do Liloupro copiada acima.</p>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-amber-400 font-black text-base">3. Selecione Eventos</span>
                <p className="text-slate-300 text-[11px]">Marque: <strong>Compra Aprovada</strong>, <strong>Assinatura Renovada</strong>, <strong>Reembolso</strong> e <strong>Cancelamento</strong>.</p>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-emerald-400 font-black text-base">4. Pronto! 🚀</span>
                <p className="text-slate-300 text-[11px]">Quando o cliente paga no Pix/Cartão, o Liloupro gera a licença e envia o acesso em tempo real!</p>
              </div>
            </div>
          </div>

          {/* Card URL da Página de Vendas Oficial (Sales Page) */}
          <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-black border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  <Sparkles size={14} className="text-amber-400" /> Link de Destino do Produto Kiwify
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Página de Vendas Oficial (Sales Page)
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Insira este link no campo <strong>Página de Vendas</strong> na Kiwify. O link oficial <code className="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded font-mono font-bold">https://www.liloupro.com.br/?landing=true</code> direciona os visitantes diretamente para a Landing Page de conversão com os novos botões de checkout.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={salesPageFullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                >
                  <ExternalLink size={16} /> Abrir
                </a>
                <button
                  onClick={handleCopySalesUrl}
                  className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedSalesUrl ? <Check size={18} /> : <Copy size={18} />}
                  {copiedSalesUrl ? 'Copiado!' : 'Copiar Link da Sales Page'}
                </button>
              </div>
            </div>

            <div className="bg-black/60 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between font-mono text-xs">
              <span className="text-amber-200 font-bold truncate select-all">{salesPageFullUrl}</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 shrink-0 font-sans font-bold ml-2">
                URL Pública
              </span>
            </div>
          </div>

          {/* Links de Checkout Ativos na Kiwify */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-black border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  <Sparkles size={14} className="text-emerald-400" /> Checkouts Ativos na Kiwify (Prontos para Vender)
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Links de Vendas Conectados ao LiLouPro
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Estes são os links de checkout oficiais. Você pode copiá-los para enviar no WhatsApp ou compartilhar em campanhas de vendas hoje mesmo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Completo Mensal */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Plano Completo Mensal</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">R$ 49/mês</span>
                  </div>
                  <a
                    href="https://pay.kiwify.com.br/3qXHMCe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-brand hover:underline block truncate"
                  >
                    https://pay.kiwify.com.br/3qXHMCe
                  </a>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://pay.kiwify.com.br/3qXHMCe');
                      showToast('Link do Plano Completo Mensal copiado!');
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={13} /> Copiar Link
                  </button>
                  <a
                    href="https://pay.kiwify.com.br/3qXHMCe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1"
                    title="Abrir no navegador"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Completo Anual */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Plano Completo Anual</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">R$ 470,40/ano</span>
                  </div>
                  <a
                    href="https://pay.kiwify.com.br/xrEKt4N"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-brand hover:underline block truncate"
                  >
                    https://pay.kiwify.com.br/xrEKt4N
                  </a>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://pay.kiwify.com.br/xrEKt4N');
                      showToast('Link do Plano Completo Anual copiado!');
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={13} /> Copiar Link
                  </button>
                  <a
                    href="https://pay.kiwify.com.br/xrEKt4N"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1"
                    title="Abrir no navegador"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Premium Mensal */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Plano Premium Mensal</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">R$ 99/mês</span>
                  </div>
                  <a
                    href="https://pay.kiwify.com.br/BlF0RJs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-indigo-400 hover:underline block truncate"
                  >
                    https://pay.kiwify.com.br/BlF0RJs
                  </a>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://pay.kiwify.com.br/BlF0RJs');
                      showToast('Link do Plano Premium Mensal copiado!');
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={13} /> Copiar Link
                  </button>
                  <a
                    href="https://pay.kiwify.com.br/BlF0RJs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1"
                    title="Abrir no navegador"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Premium Anual */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Plano Premium Anual</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">R$ 950,40/ano</span>
                  </div>
                  <a
                    href="https://pay.kiwify.com.br/xlsUZKY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-indigo-400 hover:underline block truncate"
                  >
                    https://pay.kiwify.com.br/xlsUZKY
                  </a>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://pay.kiwify.com.br/xlsUZKY');
                      showToast('Link do Plano Premium Anual copiado!');
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={13} /> Copiar Link
                  </button>
                  <a
                    href="https://pay.kiwify.com.br/xlsUZKY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1"
                    title="Abrir no navegador"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Acesso Vitalício */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-2.5 sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-300">Acesso Vitalício Lançamento</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">R$ 697,90 único</span>
                  </div>
                  <a
                    href="https://pay.kiwify.com.br/hzdGE1G"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-amber-400 hover:underline block truncate"
                  >
                    https://pay.kiwify.com.br/hzdGE1G
                  </a>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://pay.kiwify.com.br/hzdGE1G');
                      showToast('Link do Acesso Vitalício copiado!');
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={13} /> Copiar Link
                  </button>
                  <a
                    href="https://pay.kiwify.com.br/hzdGE1G"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1"
                    title="Abrir no navegador"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Banners do Produto LiLouPro para Kiwify (300x250) - Duas Opções */}
          <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-black border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                  <Sparkles size={14} className="text-amber-300" /> Material Promocional e Capas de Venda
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Banners Oficiais para Kiwify (300x250 px)
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Escolha e baixe entre o Banner Padrão do LiLouPro ou a nova Edição Exclusiva de Lançamento com destaque para Acesso Vitalício.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Opção 1: Banner Padrão */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
                      Opção 1 • Oficial Padrão
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">300x250 px</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    Capa de Venda Institucional
                  </h4>
                  <p className="text-xs text-slate-400">
                    Design com braço de violão iluminado, holofotes de palco e identidade visual limpa do LiLouPro.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative group rounded-xl overflow-hidden border-2 border-indigo-500/30 shadow-lg bg-black w-[280px] sm:w-[300px] h-[230px] sm:h-[250px] flex items-center justify-center">
                    <img
                      src={kiwifyBannerImg}
                      alt="Banner LiLouPro Kiwify Padrão"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={kiwifyBannerImg}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-bold hover:bg-white/30 transition-all flex items-center gap-1.5"
                      >
                        <Eye size={14} /> Ampliar
                      </a>
                    </div>
                  </div>
                </div>

                <a
                  href={kiwifyBannerImg}
                  download="LiLouPro_Banner_Kiwify_Padrao_300x250.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={16} />
                  Baixar Opção 1 (Padrão)
                </a>
              </div>

              {/* Opção 2: Banner Lançamento - Acesso Vitalício */}
              <div className="bg-black/40 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-amber-400 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-black text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider shadow-md">
                  ⭐ Lançamento Exclusivo
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                      Opção 2 • Acesso Vitalício
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">300x250 px</span>
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Condição Exclusiva de Lançamento
                  </h4>
                  <p className="text-xs text-slate-400">
                    Destaque para <strong className="text-amber-300">Acesso Vitalício</strong>, ideal para gerar alta conversão e escassez em campanhas de lançamento na Kiwify.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative group rounded-xl overflow-hidden border-2 border-amber-500/40 shadow-xl shadow-amber-500/10 bg-black w-[280px] sm:w-[300px] h-[230px] sm:h-[250px] flex items-center justify-center">
                    <img
                      src={kiwifyBannerLifetimeImg}
                      alt="Banner LiLouPro Kiwify Acesso Vitalicio"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={kiwifyBannerLifetimeImg}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-bold hover:bg-white/30 transition-all flex items-center gap-1.5"
                      >
                        <Eye size={14} /> Ampliar
                      </a>
                    </div>
                  </div>
                </div>

                <a
                  href={kiwifyBannerLifetimeImg}
                  download="LiLouPro_Banner_Kiwify_Vitalicio_300x250.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={16} />
                  Baixar Opção 2 (Vitalício)
                </a>
              </div>
            </div>

            {/* Dica do marketplace */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>
                Suba o banner escolhido no painel da Kiwify em <strong>Produtos &gt; Configurações do Produto &gt; Imagem de Capa (300x250 px)</strong>.
              </span>
            </div>
          </div>

          {/* Logo Oficial Otimizado para Instagram (320x320 px e 1080x1080 HD) */}
          <div className="bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-pink-500 via-purple-500 to-amber-500 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-bl-2xl tracking-wider shadow-lg flex items-center gap-1.5">
              <Instagram size={12} /> Perfil Oficial Instagram (@liloupro)
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-black uppercase tracking-wider border border-pink-500/30">
                  <Camera size={14} className="text-pink-400 animate-pulse" /> Foto de Perfil Otimizada (320x320 px &amp; 1080x1080 HD)
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Logo do LiLouPro Otimizado para Instagram
                </h3>
                <p className="text-xs text-slate-300">
                  Utiliza exatamente a mesma arte, cores e textura do <strong>Ícone de Luxo (Premium &amp; Comercial)</strong>, adaptada com recorte redondo anatômico (Circular Avatar PNG) para se encaixar com perfeição no avatar do Instagram sem cortar bordas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Instagram Profile Simulator Mockup */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-black/50 border border-white/10 rounded-2xl relative">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1">
                  <Eye size={12} className="text-pink-400" /> Prévia no Perfil do Instagram
                </span>

                {/* Instagram Profile Circle with Story Gradient Ring */}
                <div className="relative group p-1.5 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 shadow-2xl shadow-pink-500/20 cursor-pointer">
                  <div className="p-1 rounded-full bg-slate-950">
                    <img
                      src={luxuryAppIcon}
                      alt="Logo Oficial LiLouPro (Luxo)"
                      referrerPolicy="no-referrer"
                      className="w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover shadow-inner group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-pink-500 text-white p-2 rounded-full border-2 border-slate-950 shadow-lg">
                    <Instagram size={16} />
                  </div>
                </div>

                {/* Instagram Handle Mock */}
                <div className="mt-4 text-center space-y-0.5">
                  <h5 className="text-sm font-bold text-white flex items-center justify-center gap-1">
                    liloupro.app <CheckCircle2 size={14} className="text-sky-400 fill-sky-400/20" />
                  </h5>
                  <p className="text-[11px] text-slate-400 font-medium">Gestão de Louvor e Culto 🎵</p>
                </div>
              </div>

              {/* Specs & Downloads */}
              <div className="lg:col-span-7 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-black/40 border border-white/10 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-pink-400 uppercase tracking-wider block">Resolução Recomendada</span>
                    <p className="text-xs font-bold text-white">320 x 320 px (Mobile)</p>
                    <p className="text-[11px] text-slate-400">Dimensão exata utilizada pelo app do Instagram para exibição instantânea.</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Resolução Ultra HD</span>
                    <p className="text-xs font-bold text-white">1080 x 1080 px (Hi-DPI)</p>
                    <p className="text-[11px] text-slate-400">Máxima qualidade em telas Retina e monitores de alta densidade.</p>
                  </div>
                </div>

                <div className="bg-pink-500/10 border border-pink-500/20 p-4 rounded-xl space-y-2 text-xs text-slate-200">
                  <p className="font-bold text-pink-300 flex items-center gap-1.5">
                    <Sparkles size={14} /> Dica de Aplicação no Instagram:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                    <li>Acesse o perfil da sua conta no Instagram (&quot;Editar perfil&quot; &gt; &quot;Alterar foto do perfil&quot;).</li>
                    <li>Selecione o arquivo baixado. Não é necessário dar zoom ou ajustar, pois o logo Ícone de Luxo já está centralizado no enquadramento circular perfeito.</li>
                  </ul>
                </div>

                {/* Download Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadResizedIcon(320, 'LiLouPro_Logo_Instagram_Profile_320x320.jpg')}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={16} />
                    Baixar 320 x 320 px (Insta)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadResizedIcon(1080, 'LiLouPro_Logo_Instagram_Profile_1080x1080_HD.jpg')}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={16} />
                    Baixar Ultra HD (1080x1080)
                  </button>

                  <a
                    href={luxuryAppIcon}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    title="Ver Imagem Original em Tela Cheia"
                  >
                    <Eye size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Simulator (1-Click Test) */}
          <div className="bg-black/5 dark:bg-white/5 border border-indigo-500/30 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-text-main flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-400" /> Simulador de Webhook Kiwify (Teste em 1 Clique)
                </h3>
                <p className="text-xs text-text-muted">
                  Simule uma venda da Kiwify para verificar a criação automática da igreja e liberação do plano no banco de dados.
                </p>
              </div>
            </div>

            <form onSubmit={handleSimulateWebhook} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-text-muted mb-1">
                  Nome do Comprador / Pastor
                </label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  placeholder="Ex: Pr. Carlos Oliveira"
                  className="w-full p-3 rounded-2xl bg-black/10 dark:bg-white/10 border border-border/80 text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-text-muted mb-1">
                  E-mail do Comprador
                </label>
                <input
                  type="email"
                  required
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  placeholder="pastor@igreja.com"
                  className="w-full p-3 rounded-2xl bg-black/10 dark:bg-white/10 border border-border/80 text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-text-muted mb-1">
                  Nome do Produto Kiwify
                </label>
                <input
                  type="text"
                  required
                  value={simProduct}
                  onChange={(e) => setSimProduct(e.target.value)}
                  placeholder="Liloupro Plano Anual"
                  className="w-full p-3 rounded-2xl bg-black/10 dark:bg-white/10 border border-border/80 text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-text-muted mb-1">
                  Status do Evento
                </label>
                <select
                  value={simStatus}
                  onChange={(e) => setSimStatus(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-black/10 dark:bg-white/10 border border-border/80 text-text-main focus:outline-none focus:border-brand cursor-pointer font-bold"
                >
                  <option value="paid">Compra Aprovada (Paid)</option>
                  <option value="refunded">Reembolsado (Refunded)</option>
                  <option value="canceled">Cancelado (Canceled)</option>
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-4 flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {simulating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Simular Disparo Kiwify Agora
                </button>
              </div>
            </form>

            {simResult && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs space-y-2 font-mono">
                <p className="font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" /> {simResult.message}
                </p>
                {simResult.details && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-emerald-500/20">
                    <div>Código Convite: <strong className="text-white">{simResult.details.inviteCode}</strong></div>
                    <div>Status: <strong className="text-emerald-400">{simResult.details.planStatus}</strong></div>
                    <div>Ação: <strong className="text-amber-300">{simResult.details.actionType}</strong></div>
                    <div>ID Igreja: <strong className="text-white">{simResult.details.churchId}</strong></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Received Webhook Logs History Table & Support Subsection */}
          <div className="bg-black/5 dark:bg-white/5 border border-border/80 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-black text-text-main uppercase tracking-wider flex items-center gap-2">
                  <Clock size={18} className="text-emerald-400" /> Log de Notificações e Ativações Kiwify
                </h3>
                <p className="text-xs text-text-muted">
                  Registro em tempo real de todos os webhooks processados, ativando clientes ou suspendendo contas com total transparência.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchWebhookLogs}
                  className="px-4 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-text-main text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <RefreshCw size={14} className={loadingLogs ? 'animate-spin' : ''} />
                  Atualizar Logs
                </button>
              </div>
            </div>

            {/* Webhook Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-black/10 dark:bg-white/5 p-3.5 rounded-2xl border border-border/60 space-y-1">
                <span className="text-[10px] font-black uppercase text-text-muted">Total de Eventos</span>
                <div className="text-lg font-black text-text-main">{logMetrics.total}</div>
              </div>

              <div className="bg-emerald-500/10 dark:bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-400">Compras / Aprovados</span>
                <div className="text-lg font-black text-emerald-400">{logMetrics.paidCount}</div>
              </div>

              <div className="bg-red-500/10 dark:bg-red-500/10 p-3.5 rounded-2xl border border-red-500/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-red-400">Reembolsos / Cancelados</span>
                <div className="text-lg font-black text-red-400">{logMetrics.refundCount}</div>
              </div>

              <div className="bg-indigo-500/10 dark:bg-indigo-500/10 p-3.5 rounded-2xl border border-indigo-500/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-400">Simulações de Teste</span>
                <div className="text-lg font-black text-indigo-400">{logMetrics.simCount}</div>
              </div>
            </div>

            {/* Search and Filters for Webhook Logs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-black/10 dark:bg-white/5 p-3 rounded-2xl border border-border/60">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Buscar por e-mail, pedido, nome ou produto..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/10 dark:bg-white/10 border border-border/80 text-xs text-text-main focus:outline-none focus:border-emerald-500"
                />
                {logSearchQuery && (
                  <button
                    onClick={() => setLogSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main text-xs"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto custom-scrollbar">
                <button
                  onClick={() => setLogFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    logFilterType === 'all'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-black/10 dark:bg-white/10 text-text-muted hover:text-text-main'
                  }`}
                >
                  Todos ({logMetrics.total})
                </button>

                <button
                  onClick={() => setLogFilterType('paid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    logFilterType === 'paid'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-black/10 dark:bg-white/10 text-text-muted hover:text-text-main'
                  }`}
                >
                  Aprovados ({logMetrics.paidCount})
                </button>

                <button
                  onClick={() => setLogFilterType('refunded')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    logFilterType === 'refunded'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-black/10 dark:bg-white/10 text-text-muted hover:text-text-main'
                  }`}
                >
                  Reembolsos ({logMetrics.refundCount})
                </button>

                <button
                  onClick={() => setLogFilterType('simulation')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    logFilterType === 'simulation'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-black/10 dark:bg-white/10 text-text-muted hover:text-text-main'
                  }`}
                >
                  Simulações ({logMetrics.simCount})
                </button>
              </div>
            </div>

            {/* Log Entries List */}
            {loadingLogs ? (
              <div className="p-8 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-emerald-400" />
                Carregando histórico de webhooks do servidor...
              </div>
            ) : filteredWebhookLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted italic bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-border/80 space-y-2">
                <FileText size={28} className="mx-auto text-text-muted/50" />
                <p>Nenhum log de webhook encontrado para os filtros selecionados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWebhookLogs.map((log) => {
                  const dateStr = log.receivedAt
                    ? new Date(log.receivedAt).toLocaleString('pt-BR')
                    : 'Agora';

                  const isApproved = 
                    (log.orderStatus || '').toLowerCase().includes('paid') || 
                    (log.eventType || '').toLowerCase().includes('approved') ||
                    log.planStatus === 'active';

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl bg-black/10 dark:bg-white/5 border border-border/60 hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            isApproved
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}>
                            {log.orderStatus || 'paid'}
                          </span>

                          <span className="font-bold text-text-main text-sm">
                            {log.customerName || log.customerEmail}
                          </span>

                          <span className="text-[10px] text-text-muted font-mono bg-black/20 dark:bg-white/10 px-2 py-0.5 rounded">
                            {log.customerEmail}
                          </span>

                          {log.isSimulation && (
                            <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[9px] font-bold px-2 py-0.5 rounded-full">
                              Simulação
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-text-muted flex-wrap">
                          <span>Pedido: <strong className="text-text-main font-mono">{log.orderId}</strong></span>
                          <span>Produto: <strong>{log.productName}</strong></span>
                          {log.inviteCode && <span>Convite: <strong className="text-brand font-mono">{log.inviteCode}</strong></span>}
                          {log.churchId && <span>ID Igreja: <strong className="text-emerald-400 font-mono">{log.churchId}</strong></span>}
                        </div>
                      </div>

                      {/* Action Buttons for Log Support */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => setInspectingPayload(log)}
                          className="px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-text-main text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-border/60"
                          title="Ver Payload JSON completo do webhook"
                        >
                          <Code size={14} className="text-indigo-400" />
                          Payload JSON
                        </button>

                        <button
                          onClick={() => handleJumpToChurch(log.customerEmail)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/30"
                          title="Ir para a gestão desta igreja no painel"
                        >
                          <Building2 size={14} />
                          Ver Igreja
                          <ArrowUpRight size={12} />
                        </button>

                        <div className="text-right text-[10px] text-text-muted font-mono pl-2 border-l border-border/60 hidden sm:block">
                          {dateStr}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --- CHURCHES LIST TAB (EXISTING) --- */
        <div className="space-y-8 animate-fade-in">
          {/* WhatsApp Quick Prospecting Banner */}
          <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-black border border-emerald-500/40 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <MessageCircle size={26} />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  <Gift size={12} /> Divulgação & Vendas
                </div>
                <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  Convide Líderes de Louvor pelo WhatsApp (30 Dias Grátis VIP)
                </h4>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Gere mais acessos e novas assinaturas compartilhando convites prontos e amigáveis para Igrejas e Ministérios de Louvor.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer relative z-10"
            >
              <Send size={16} /> Abrir Divulgação WhatsApp
            </button>
          </div>

          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Igrejas */}
        <div className="bg-black/5 dark:bg-white/5 border border-border/80 rounded-3xl p-5 space-y-3 relative overflow-hidden group hover:border-brand/40 transition-all">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-black uppercase tracking-wider">Total de Igrejas</span>
            <div className="p-2 rounded-xl bg-brand/10 text-brand">
              <Building2 size={20} />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-text-main tracking-tight">{stats.totalChurches}</span>
            <p className="text-[10px] text-text-muted font-bold mt-1">Igrejas no banco de dados</p>
          </div>
        </div>

        {/* Igrejas Ativas PRO */}
        <div className="bg-black/5 dark:bg-white/5 border border-emerald-500/20 rounded-3xl p-5 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">Igrejas Ativas (PRO)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">{stats.activeChurches}</span>
            <p className="text-[10px] text-text-muted font-bold mt-1">Licenças liberadas</p>
          </div>
        </div>

        {/* Em Degustação / Teste */}
        <div className="bg-black/5 dark:bg-white/5 border border-amber-500/20 rounded-3xl p-5 space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">Em Teste / Trial</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock size={20} />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">{stats.trialChurches}</span>
            <p className="text-[10px] text-text-muted font-bold mt-1">Período de degustação</p>
          </div>
        </div>

        {/* Total de Membros */}
        <div className="bg-black/5 dark:bg-white/5 border border-indigo-500/20 rounded-3xl p-5 space-y-3 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">Total de Membros</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users size={20} />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-indigo-400 tracking-tight">{stats.totalMembers}</span>
            <p className="text-[10px] text-text-muted font-bold mt-1">~{stats.avgMembersPerChurch} usuários/igreja</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-black/5 dark:bg-white/5 border border-border/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, código ou ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/10 dark:bg-white/10 border border-border/80 text-text-main text-xs font-medium placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <span className="text-[10px] font-black uppercase text-text-muted shrink-0 flex items-center gap-1">
            <Filter size={12} /> Status:
          </span>
          {(['all', 'active', 'trial', 'suspended', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-brand text-white shadow-lg shadow-brand/20'
                  : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              {st === 'all' && 'Todos'}
              {st === 'active' && 'Ativo (PRO)'}
              {st === 'trial' && 'Degustação'}
              {st === 'suspended' && 'Suspenso'}
              {st === 'cancelled' && 'Cancelado'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Churches List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-black text-text-main uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} className="text-brand" /> Lista de Igrejas Cadastradas ({filteredChurches.length})
          </h2>
          <span className="text-[10px] font-bold text-text-muted">
            Sincronização em tempo real via Firestore
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-black/5 dark:bg-white/5 border border-border/80 rounded-3xl space-y-3">
            <RefreshCw size={24} className="animate-spin text-brand mx-auto" />
            <p className="text-xs font-bold text-text-muted">Carregando dados mestre das igrejas...</p>
          </div>
        ) : filteredChurches.length === 0 ? (
          <div className="p-12 text-center bg-black/5 dark:bg-white/5 border border-border/80 rounded-3xl space-y-2">
            <Building2 size={32} className="text-text-muted mx-auto opacity-50" />
            <p className="text-sm font-bold text-text-main">Nenhuma igreja encontrada com este filtro.</p>
            <p className="text-xs text-text-muted">Tente alterar o termo de busca ou limpar os filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredChurches.map((church) => {
              const churchMembers = members.filter(m => (m.churchId || 'semente') === church.id);
              const isExpanded = expandedChurchId === church.id;
              const isExtending = quickExtendChurchId === church.id;

              // Format date
              const formattedCreated = church.createdAt
                ? new Date(church.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'Padrão';

              const formattedExpires = church.planExpiresAt
                ? new Date(church.planExpiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'Sem expiração (Vitalício)';

              const isExpired = church.planExpiresAt && new Date(church.planExpiresAt) < new Date();

              return (
                <div
                  key={church.id}
                  className={`bg-black/5 dark:bg-white/5 border rounded-3xl transition-all duration-200 overflow-hidden ${
                    church.planStatus === 'suspended'
                      ? 'border-red-500/30'
                      : church.planStatus === 'trial'
                      ? 'border-amber-500/30'
                      : 'border-border/80 hover:border-brand/40'
                  }`}
                >
                  {/* Top Summary Bar */}
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-2xl border shrink-0 mt-0.5 ${
                        church.planStatus === 'active' || !church.planStatus
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : church.planStatus === 'trial'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        <Building2 size={24} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-text-main tracking-tight">{church.name}</h3>
                          
                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            church.planStatus === 'active' || !church.planStatus
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : church.planStatus === 'trial'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}>
                            {church.planStatus === 'active' || !church.planStatus ? '• Ativo (PRO)' : church.planStatus === 'trial' ? '• Em Teste' : '• Suspenso'}
                          </span>

                          {isExpired && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-black uppercase">
                              Licença Expirada
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                          <span className="flex items-center gap-1 font-mono font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                            <Key size={12} /> {church.inviteCode}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {churchMembers.length} membros
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> Criado em {formattedCreated}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                      {/* Status Selector Dropdown */}
                      <select
                        value={church.planStatus || 'active'}
                        onChange={(e) => handleUpdateStatus(church.id, e.target.value as any)}
                        className="px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 border border-border/80 text-text-main text-xs font-bold focus:outline-none focus:border-brand cursor-pointer"
                      >
                        <option value="active" className="bg-slate-900 text-emerald-400 font-bold">Ativo (PRO)</option>
                        <option value="trial" className="bg-slate-900 text-amber-400 font-bold">Degustação (Trial)</option>
                        <option value="suspended" className="bg-slate-900 text-red-400 font-bold">Suspenso</option>
                        <option value="cancelled" className="bg-slate-900 text-slate-400 font-bold">Cancelado</option>
                      </select>

                      {/* License Renew Button */}
                      <button
                        onClick={() => setQuickExtendChurchId(isExtending ? null : church.id)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <Clock size={14} /> Validade
                      </button>

                      {/* Details / Members Expand Button */}
                      <button
                        onClick={() => setExpandedChurchId(isExpanded ? null : church.id)}
                        className="px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-text-main border border-border/80 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Detalhes
                      </button>

                      {/* Delete Church Button */}
                      {deletingChurchId === church.id ? (
                        <div className="flex items-center gap-1 bg-red-500/10 p-1 rounded-xl border border-red-500/30">
                          <span className="text-[10px] text-red-400 font-bold px-1 hidden sm:inline">Confirmar?</span>
                          <button
                            onClick={() => handleDeleteChurch(church.id, church.name)}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase transition-all cursor-pointer shadow-md"
                          >
                            Sim, Excluir
                          </button>
                          <button
                            onClick={() => setDeletingChurchId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingChurchId(church.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/20 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Excluir igreja / teste"
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick License Extension Popup Bar */}
                  <AnimatePresence>
                    {isExtending && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-indigo-950/40 border-t border-indigo-500/20 p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 text-indigo-200 font-bold">
                          <Clock size={16} className="text-amber-400" />
                          <span>Estender/Definir Validade da Licença:</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleExtendLicense(church.id, 30)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-500/30 font-bold"
                          >
                            +30 Dias
                          </button>
                          <button
                            onClick={() => handleExtendLicense(church.id, 90)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-500/30 font-bold"
                          >
                            +90 Dias
                          </button>
                          <button
                            onClick={() => handleExtendLicense(church.id, 365)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-500/30 font-bold"
                          >
                            +1 Ano (365d)
                          </button>
                          <button
                            onClick={() => handleExtendLicense(church.id, null)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 font-bold"
                          >
                            Vitalício (Infinita)
                          </button>
                          <button
                            onClick={() => setQuickExtendChurchId(null)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expanded Detail Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border/60 bg-black/10 dark:bg-white/[0.02] p-5 space-y-6"
                      >
                        {/* Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="bg-black/5 dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 space-y-1">
                            <span className="text-[10px] font-black uppercase text-text-muted">Validade Atual da Licença</span>
                            <p className="text-sm font-bold text-text-main flex items-center gap-1.5">
                              <Calendar size={14} className="text-brand" /> {formattedExpires}
                            </p>
                          </div>

                          <div className="bg-black/5 dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-text-muted">Plano Contratado</span>
                            <div className="flex items-center gap-2">
                              <Sparkles size={14} className="text-amber-400 shrink-0" />
                              <select
                                value={church.planName || 'Plano Completo'}
                                onChange={(e) => handleUpdatePlanName(church.id, e.target.value)}
                                className="bg-transparent text-sm font-bold text-text-main focus:outline-none cursor-pointer border-b border-dashed border-amber-400/50 pb-0.5"
                              >
                                <option value="Plano Completo">Plano Completo (R$ 49/mês)</option>
                                <option value="Plano Semeadora (Gratuito)">Plano Semeadora (Gratuito)</option>
                                <option value="Plano Premium">Plano Premium (R$ 99/mês)</option>
                                <option value="Plano Vitalício">Plano Vitalício (Ilimitado)</option>
                              </select>
                            </div>
                          </div>

                          <div className="bg-black/5 dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 space-y-1">
                            <span className="text-[10px] font-black uppercase text-text-muted">E-mail de Contato</span>
                            <p className="text-sm font-bold text-text-main flex items-center gap-1.5 truncate">
                              <Mail size={14} className="text-indigo-400" /> {church.contactEmail || 'Não informado'}
                            </p>
                          </div>
                        </div>

                        {/* Internal Master Notes Editor */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                            <Edit3 size={12} className="text-brand" /> Observações Internas da Igreja (Apenas Master Admin)
                          </label>
                          <div className="flex gap-2">
                            <textarea
                              defaultValue={church.masterNotes || ''}
                              id={`notes-${church.id}`}
                              placeholder="Adicione notas como: telefone do pastor, forma de pagamento Pix, observações do contrato..."
                              rows={2}
                              className="flex-1 p-3 rounded-2xl bg-black/10 dark:bg-white/10 border border-border/80 text-text-main text-xs focus:outline-none focus:border-brand custom-scrollbar"
                            />
                            <button
                              onClick={() => {
                                const val = (document.getElementById(`notes-${church.id}`) as HTMLTextAreaElement)?.value || '';
                                handleSaveNotes(church.id, val);
                              }}
                              className="px-4 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all hover:scale-105"
                            >
                              <Save size={14} /> Salvar
                            </button>
                          </div>
                        </div>

                        {/* Members List Table */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-black text-text-main uppercase tracking-wider flex items-center gap-2">
                            <Users size={14} className="text-indigo-400" /> Membros Cadastrados nesta Igreja ({churchMembers.length})
                          </h4>

                          {churchMembers.length === 0 ? (
                            <p className="text-xs text-text-muted italic bg-black/5 dark:bg-white/5 p-4 rounded-2xl text-center">
                              Nenhum voluntário/membro cadastrado com o código {church.inviteCode} até o momento.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {churchMembers.map(m => (
                                <div key={m.id} className="p-3 bg-black/5 dark:bg-white/5 border border-border/50 rounded-2xl flex items-center gap-3">
                                  {m.photoUrl ? (
                                    <img src={m.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-brand/30" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-brand/20 text-brand font-black text-xs flex items-center justify-center">
                                      {m.name?.charAt(0).toUpperCase() || 'M'}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs font-bold text-text-main truncate">{m.name || 'Membro'}</p>
                                      {m.isAdmin && (
                                        <span className="bg-brand/20 text-brand text-[8px] font-black px-1.5 rounded uppercase">ADM</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-text-muted truncate">{m.email || 'Sem e-mail'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )}

      {/* Modal: Cadastrar Nova Igreja */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand/20 text-brand">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">Cadastrar Nova Igreja</h3>
                    <p className="text-xs text-slate-400">Insira as informações do novo ministério parceiro</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/50"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateChurch} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Nome da Igreja / Ministério *
                  </label>
                  <input
                    type="text"
                    required
                    value={newChurchName}
                    onChange={(e) => setNewChurchName(e.target.value)}
                    placeholder="Ex: Igreja Batista Viva, Comunidade Graça..."
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Código de Convite (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newInviteCode}
                      onChange={(e) => setNewInviteCode(e.target.value)}
                      placeholder="Ex: VIVA2026 (ou auto-gerado)"
                      className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white uppercase font-mono placeholder:text-slate-500 focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Status da Conta
                    </label>
                    <select
                      value={newPlanStatus}
                      onChange={(e) => setNewPlanStatus(e.target.value as any)}
                      className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="active">Ativo (Liberado)</option>
                      <option value="trial">Degustação / Teste (30 dias)</option>
                      <option value="suspended">Suspenso</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Plano Contratado
                    </label>
                    <select
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand cursor-pointer font-bold"
                    >
                      <option value="Plano Completo">Plano Completo (R$ 49/mês)</option>
                      <option value="Plano Semeadora (Gratuito)">Plano Semeadora (Gratuito)</option>
                      <option value="Plano Premium">Plano Premium (R$ 99/mês)</option>
                      <option value="Plano Vitalício">Plano Vitalício (Ilimitado)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Duração da Licença
                    </label>
                    <select
                      value={newPlanDurationDays}
                      onChange={(e) => setNewPlanDurationDays(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="30">30 Dias (Degustação/Mensal)</option>
                      <option value="90">90 Dias (Trimestral)</option>
                      <option value="365">1 Ano / 365 Dias (Anual)</option>
                      <option value="unlimited">Vitalício (Sem Expiração)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      E-mail do Responsável
                    </label>
                    <input
                      type="email"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                      placeholder="pastor@igreja.com"
                      className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Observações Internas (Master)
                  </label>
                  <textarea
                    rows={2}
                    value={newMasterNotes}
                    onChange={(e) => setNewMasterNotes(e.target.value)}
                    placeholder="Detalhes do pagamento Pix, data de assinatura..."
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand custom-scrollbar"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-2xl bg-brand hover:bg-brand-hover text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-brand/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Check size={16} />} Cadastrar Igreja
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Inspecionar Payload JSON Raw Webhook Kiwify */}
      <AnimatePresence>
        {inspectingPayload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Code size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                      Payload JSON do Webhook Kiwify
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Pedido #{inspectingPayload.orderId} • {inspectingPayload.customerEmail}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingPayload(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Payload Information Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Status Pedido:</span>
                  <div className="font-bold text-emerald-400">{inspectingPayload.orderStatus}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Evento Kiwify:</span>
                  <div className="font-bold text-amber-300">{inspectingPayload.eventType}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Ação no Liloupro:</span>
                  <div className="font-bold text-brand">{inspectingPayload.actionType || 'created'}</div>
                </div>
              </div>

              {/* Code viewer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Objeto JSON Bruto Recebido:</span>
                  <button
                    onClick={handleCopyPayloadJson}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                  >
                    {copiedPayload ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedPayload ? 'Copiado!' : 'Copiar JSON'}
                  </button>
                </div>

                <div className="bg-black border border-slate-800 rounded-2xl p-4 overflow-x-auto max-h-80 custom-scrollbar font-mono text-xs text-indigo-300 leading-relaxed select-all">
                  <pre>{JSON.stringify(inspectingPayload.rawPayload || inspectingPayload, null, 2)}</pre>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setInspectingPayload(null)}
                  className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
