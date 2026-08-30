// LiLouPro SongsView - clean build
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { toPng } from 'html-to-image';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Music, Calendar, Users, Home, Search, Plus, Minus, Download, Image as ImageIcon, Upload,
  Trash2, Edit, Save, ArrowLeft, Volume2, Volume1, FileText, ExternalLink, Bell,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, LogOut, Check, X, Sparkles, CloudOff, Wifi, WifiOff, Database,
  Clock, Activity, Maximize2, Minimize2, ThumbsUp, Menu, MoreHorizontal,
  Play, Pause, BookOpen, Book, Quote, GripVertical, Timer, ChevronsDown, RefreshCcw,
  Settings, FileDown, Youtube, MessageSquare, Share2, Zap, BarChart2, Copy,
  Send, Star, Lock, Unlock, CornerDownRight, Bold, Italic, Underline, Tv,
  AlertTriangle, Smartphone, Columns, Mic, MicOff, Loader2, GraduationCap, Camera, Gift, Baby, HelpCircle,
  Flame, TrendingUp, TrendingDown, Sliders, Layers, Bluetooth, Radio, Mail
} from 'lucide-react';
import { Music2 } from './MusicIcon';
import { BossPedalIcon } from './BossPedalIcon';
import { ChromaticTunerModal } from './ChromaticTunerModal';
import { StudyMetronomeModal } from './StudyMetronomeModal';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { 
  loginWithGoogle, logout, db, handleFirestoreError, OperationType,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  updateProfile, auth 
} from '../lib/firebase';
import { 
  collection, query, onSnapshot, addDoc, deleteDoc, getDocs,
  doc, updateDoc, setDoc, getDoc, orderBy, Timestamp, where, serverTimestamp, deleteField 
} from 'firebase/firestore';
import { 
  transposeLyricsAndChords, transposeChord, isChordLine, detectKey, isChordWord, 
  isAnnotationOrHeaderWord, parseChordLineIntoTokens, getCleanChordName, cleanTablatures, 
  cleanCifraHtml, HarmonicDisplayMode, convertLyricsAndChordsToHarmonicMode, 
  convertSingleChordToHarmonicMode, convertHarmonicToChordName, ChordToken, 
  areChordsInCapoShape, getCapoSemitonesFromText, cleanLyricsForDisplay, 
  extractLyricsFromChords, getEffectiveLyrics, stripDynamicsFromText 
} from '../services/chordService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportJsonToExcel } from '../utils/excelExport';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BibleSearch } from './BibleSearch';
import { ProjectorDisplay } from './ProjectorDisplay';
import { ProjectionView } from './ProjectionView';
import { ChatView } from './ChatView';
import { ChordDictionaryModal, ChordDictionaryCard, QuickChordPopover } from './ChordDictionary';
import CommercialLandingPage from './CommercialLandingPage';
import TheoryStudyView from './TheoryStudyView';
import { LeaderOnboardingWizard } from './LeaderOnboardingWizard';
import { CachedAvatar } from './CachedAvatar';
import BibleReaderView from './BibleReaderView';
import { QuickBibleSearch } from './QuickBibleSearch';
import { OfflineView } from './OfflineView';
import { SplashIntro } from './SplashIntro';
import { BibleVersionProvider } from '../contexts/BibleVersionContext';
import HelpCenter from './HelpCenter';
import ContextualHelp from './ContextualHelp';
import { FootswitchModal, FootswitchConfig, MVAVE_CHOCOLATE_DEFAULT_MAPPINGS } from './FootswitchModal';
import { getServicePlaylistSongs, getServiceSongs, getServiceSongIds, updateServicePlaylistUrl } from '../utils/servicePlaylistUtils';




import {
  cn, getArtistImage, getArtistInitials, getArtistGradient, artistImageCache, cleanChordText, ArtistAvatar,
  formatBirthDate, EasyBirthDatePicker, getStyledChars, getStyledTextRuns, ChordButton, PairedChordLyricsRow,
  isDynamicTerm, getDynamicType, formatDynamicLabel, triggerDynamicExplanation, triggerDynamicsGuideModal,
  getDynamicExplanationDetails, DynamicExplanationModal, isSectionHeaderContent, parseBracketSubContent,
  parseLineSectionAndDynamics, RenderTextWithInlineBadges, RenderSectionOrDynamicsLine, SingleLineRow,
  compressAndResizeImage, ConfirmButton, formatDate, formatTime, NotificationCenter, getLocalDateTimeString,
  getLocalDateString, getFormatNameForPdf, Button, Card, Input, normalizeSongTitle, calculateSongMatchScore,
  findBestSongMatch, parseYoutubeVideoId, SERVICE_THEMES, getContrastColor
} from './songsShared';

export function AvailabilityView({ createNotifications, theme }: { createNotifications?: any, theme?: 'light' | 'dark' }) {
  const { user, isAdmin, memberData } = useAuth();
  const userChurchId = memberData?.churchId || 'semente';
  const [currentDate, setCurrentDate] = useState(new Date());
  const lastUnlockedTargetRef = useRef<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [submissionStatus, setSubmissionStatus] = useState<{ success: boolean; message: string; admins: { name: string; phone: string }[]; adminEmails?: { name: string; email: string }[] } | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [lockStatus, setLockStatus] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [unlockHours, setUnlockHours] = useState<number>(() => {
    const saved = localStorage.getItem('app-availability-unlock-hours');
    return saved ? Number(saved) : 48;
  });
  const [presetHours, setPresetHours] = useState<string>(() => {
    const saved = localStorage.getItem('app-availability-unlock-hours');
    const val = saved ? Number(saved) : 48;
    return [12, 24, 48, 72, 120, 168].includes(val) ? String(val) : 'custom';
  });
  const [reminderDeadline, setReminderDeadline] = useState<string>(() => {
    return localStorage.getItem('app-reminder-deadline') || '20:00';
  });
  const [reminderMessageTemplate, setReminderMessageTemplate] = useState<string>(() => {
    return localStorage.getItem('app-reminder-template') || 
      'Olá {NOME} tudo bem? O prazo para marcar sua disponibilidade na escala do Louvor termina hoje, conto com sua colaboração. Obrigado por servir na igreja local! Deus abençoe!';
  });

  useEffect(() => {
    localStorage.setItem('app-reminder-deadline', reminderDeadline);
  }, [reminderDeadline]);

  useEffect(() => {
    localStorage.setItem('app-reminder-template', reminderMessageTemplate);
  }, [reminderMessageTemplate]);

  // Automatically detect if there is a month that has been unlocked (released) for scheduling,
  // and direct the member to that month as the default on first load or when a new month is unlocked.
  useEffect(() => {
    if (!user) return;
    const locksQuery = collection(db, 'availability_locks');
    const unsubscribe = onSnapshot(locksQuery, (snap) => {
      const allLocks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const unlockedLocks = allLocks.filter(lock => lock.unlocked === true);

      if (unlockedLocks.length > 0) {
        // Sort chronologically (ID is "YYYY-MM" so alphabetical sort matches chronological)
        unlockedLocks.sort((a, b) => a.id.localeCompare(b.id));

        const now = new Date();
        const nowMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Look for future unlocked months relative to today (e.g. '2026-08' > '2026-07')
        const futureUnlockedLocks = unlockedLocks.filter(lock => lock.id > nowMonthStr);

        let targetLock: any = null;
        if (futureUnlockedLocks.length > 0) {
          // Prioritize the latest future unlocked month (e.g. August when we are in July)
          targetLock = futureUnlockedLocks[futureUnlockedLocks.length - 1];
        } else {
          // If no future month unlocked, check if current month is unlocked
          const currentLock = unlockedLocks.find(lock => lock.id === nowMonthStr);
          if (currentLock) {
            targetLock = currentLock;
          } else {
            // Otherwise pick the latest unlocked month overall
            targetLock = unlockedLocks[unlockedLocks.length - 1];
          }
        }

        if (targetLock && targetLock.id !== lastUnlockedTargetRef.current) {
          const [yearStr, monthStr] = targetLock.id.split('-');
          const targetYear = parseInt(yearStr, 10);
          const targetMonth = parseInt(monthStr, 10) - 1;

          if (!isNaN(targetYear) && !isNaN(targetMonth)) {
            lastUnlockedTargetRef.current = targetLock.id;
            const updatedDate = new Date(targetYear, targetMonth, 1);
            setCurrentDate(updatedDate);
            setSelectedDate(updatedDate);
          }
        }
      }
    }, (error) => {
      console.error("Error listening to availability locks:", error);
    });

    return () => unsubscribe();
  }, [user]);
  
  const [detailMember, setDetailMember] = useState<any>(null);
  const [detailAvailability, setDetailAvailability] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit-admin'>('view');
  const [adminSelectedDate, setAdminSelectedDate] = useState<Date | null>(null);

  const cleanWhatsapp = (num: string) => {
    if (!num) return '';
    const digits = num.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10 || digits.length === 11) {
      return '55' + digits;
    }
    return digits;
  };

  const getFiveHoursBefore = (deadlineStr: string) => {
    try {
      if (!deadlineStr || !deadlineStr.includes(':')) return '';
      const [hStr, mStr] = deadlineStr.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (isNaN(h) || isNaN(m)) return '';
      let targetH = h - 5;
      if (targetH < 0) targetH += 24;
      return `${String(targetH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } catch (e) {
      return '';
    }
  };

  const handleSendReminder = (m: any) => {
    const rawPhone = m.whatsapp || '';
    const phone = cleanWhatsapp(rawPhone);
    const fullName = m.name || m.email?.split('@')[0] || 'Ministro';
    const name = fullName.trim().split(' ')[0];
    
    let message = reminderMessageTemplate
      .replace(/{NOME DA PESSOA}/g, name)
      .replace(/{NOME}/g, name)
      .replace(/NOME DA PESSOA/g, name);
    
    const encodedMessage = encodeURIComponent(message);
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  };

  const handleCopyGroupAnnouncement = () => {
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const names = missingMembers.map(m => {
      const fullName = m.name || m.email?.split('@')[0] || 'Ministro';
      const firstName = fullName.trim().split(' ')[0];
      return `• *${firstName}*`;
    }).join('\n');
    const message = `📢 *ATENÇÃO MINISTÉRIO DE LOUVOR* 📢\n\n🗓️ Hoje é o último dia para cadastrar sua disponibilidade para as escalas do mês de *${monthName}*.\n\n⚠️ O prazo encerra *HOJE às ${reminderDeadline}*!\n\n⏳ *Falta preencher:*\n${names}\n\nPor favor, acessem o sistema e façam suas marcações o quanto antes! 👇\n🔗 ${window.location.origin}\n\nContamos com a colaboração de todos! 🙏`;
    
    navigator.clipboard.writeText(message);
    alert("Mensagem para o grupo copiada para a área de transferência! Cole no WhatsApp do ministério.");
  };

  const handleViewAvailabilityDetail = async (member: any) => {
    setDetailMember(member);
    setModalMode('view');
    setAdminSelectedDate(null);
    setLoadingDetail(true);
    setDetailAvailability([]);
    
    try {
      const q = query(
        collection(db, 'availability'),
        where('userId', '==', member.id || member.uid || member.userId),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => doc.data());
      setDetailAvailability(data);
    } catch (e) {
      console.error("Erro ao carregar disponibilidade detalhada:", e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const setAdminMemberAvailability = async (memberId: string, date: Date, status: 'available' | 'unavailable' | 'clear') => {
    if (!isAdmin) return;
    const dateStr = getLocalDateString(date);
    const availabilityPath = 'availability';
    const availabilityId = `${memberId}_${dateStr}`;
    const availRef = doc(db, availabilityPath, availabilityId);
    
    try {
      if (status === 'clear') {
        await deleteDoc(availRef);
        setDetailAvailability(prev => prev.filter(a => a.date !== dateStr));
      } else {
        await setDoc(availRef, {
          userId: memberId,
          date: dateStr,
          status: status,
          updatedAt: serverTimestamp(),
        });
        const updated = {
          userId: memberId,
          date: dateStr,
          status: status,
          updatedAt: new Date()
        };
        setDetailAvailability(prev => {
          const filtered = prev.filter(a => a.date !== dateStr);
          return [...filtered, updated];
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, availabilityPath);
    }
  };

  const toggleMemberFinishedStatus = async (member: any) => {
    if (!isAdmin) return;
    try {
      const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const statusMap = member.availabilityStatus || {};
      const isFinished = statusMap[currentMonthStr] === 'finished';
      
      const newStatusMap = {
        ...statusMap,
        [currentMonthStr]: isFinished ? 'pending' : 'finished'
      };
      
      const memberRef = doc(db, 'members', member.id);
      await updateDoc(memberRef, {
        availabilityStatus: newStatusMap,
        lastAvailabilityUpdate: serverTimestamp()
      });
      
      setDetailMember(prev => ({
        ...prev,
        availabilityStatus: newStatusMap
      }));
    } catch (e) {
      console.error("Erro ao alterar status de conclusão:", e);
      alert("Erro ao alterar status de conclusão.");
    }
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const startStr = `${year}-${month}-01`;
      
      const nextMonthDate = new Date(year, currentDate.getMonth() + 1, 1);
      const nextYear = nextMonthDate.getFullYear();
      const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
      const endStr = `${nextYear}-${nextMonth}-01`;

      const qAllAvail = query(
        collection(db, 'availability'),
        where('date', '>=', startStr),
        where('date', '<', endStr)
      );
      const snapAllAvail = await getDocs(qAllAvail);
      const allAvailDocs = snapAllAvail.docs.map(doc => doc.data());

      const excelData = finishedMembers.map(m => {
        const memberAvailDocs = allAvailDocs.filter(doc => doc.userId === m.id && doc.status === 'available');
        const sortedDates = memberAvailDocs
          .map(doc => doc.date)
          .sort((a, b) => a.localeCompare(b));
        
        const formattedDates = sortedDates.map(dateStr => {
          const [yr, mo, dy] = dateStr.split('-');
          const dateObj = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, parseInt(dy, 10));
          const weekdayStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
          return `${dy}/${mo} (${weekdayStr})`;
        }).join(', ');

        const rolesStr = Array.isArray(m.roles) ? m.roles.join(', ') : m.roles || '';

        return {
          "Nome do Ministro": m.name || m.email?.split('@')[0] || '',
          "E-mail": m.email || '',
          "WhatsApp": m.whatsapp || '',
          "Instrumentos / Funções": rolesStr,
          "Dias Disponíveis": formattedDates,
          "Quantidade de Dias": sortedDates.length,
          "Mês de Referência": currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        };
      });

      if (excelData.length === 0) {
        alert("Nenhum ministro marcou a disponibilidade ainda para este mês.");
        return;
      }

      exportJsonToExcel(
        excelData,
        `Disponibilidade_Marcaram_${month}_${year}`,
        "Disponibilidade"
      );
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      alert("Ocorreu um erro ao exportar o arquivo Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleSendAvailabilityEmailReport = async () => {
    try {
      let recipients: string[] = [];
      const settingsSnap = await getDoc(doc(db, 'settings', 'notifications'));
      if (settingsSnap.exists()) {
        const sd = settingsSnap.data();
        if (sd.adminEmail && sd.adminEmail.trim()) recipients.push(sd.adminEmail.trim());
        if (sd.adminEmail2 && sd.adminEmail2.trim()) recipients.push(sd.adminEmail2.trim());
        if (sd.adminEmail3 && sd.adminEmail3.trim()) recipients.push(sd.adminEmail3.trim());
      }
      if (recipients.length === 0) {
        const adminMembers = allMembers.filter(m => (m.isAdmin || m.email === 'mikmellorg@gmail.com') && m.email);
        adminMembers.forEach(a => { if (a.email && !recipients.includes(a.email)) recipients.push(a.email); });
      }

      const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      let bodyText = `🗓️ RELATÓRIO DE DISPONIBILIDADE DA EQUIPE DE LOUVOR\n`;
      bodyText += `Período: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}\n\n`;
      bodyText += `📊 RESUMO DE PARTICIPAÇÃO:\n`;
      bodyText += `• Total de Ministros Ativos: ${activeMembers.length}\n`;
      bodyText += `• Ministros Concluídos: ${finishedMembers.length}\n`;
      bodyText += `• Ministros Pendentes: ${missingMembers.length}\n\n`;

      if (missingMembers.length > 0) {
        bodyText += `⚠️ MEMBROS PENDENTES DE MARCAÇÃO:\n`;
        missingMembers.forEach(m => {
          bodyText += `• ${m.name || m.email}\n`;
        });
      } else {
        bodyText += `🎉 Todos os ministros já concluíram a marcação de disponibilidade!\n`;
      }

      bodyText += `\n_Relatório gerado via LiLouPro_`;

      const recipientStr = recipients.length > 0 ? recipients.join(',') : '';
      const subject = `🗓️ Relatório de Disponibilidade - ${monthName} - LiLouPro`;
      const mailtoUrl = `mailto:${recipientStr}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      window.open(mailtoUrl, '_self');
    } catch (e) {
      console.error("Erro ao preparar e-mail:", e);
      alert("Ocorreu um erro ao preparar o e-mail de relatório.");
    }
  };

  const handleDownloadMonthlyAvailabilityPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const startStr = `${year}-${month}-01`;
      
      const nextMonthDate = new Date(year, currentDate.getMonth() + 1, 1);
      const nextYear = nextMonthDate.getFullYear();
      const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
      const endStr = `${nextYear}-${nextMonth}-01`;

      const qAllAvail = query(
        collection(db, 'availability'),
        where('date', '>=', startStr),
        where('date', '<', endStr)
      );
      const snapAllAvail = await getDocs(qAllAvail);
      const allAvailDocs = snapAllAvail.docs.map(doc => doc.data());

      const availMapByDate: Record<string, string[]> = {};
      allAvailDocs.filter(d => d.status === 'available').forEach(doc => {
        if (!availMapByDate[doc.date]) {
          availMapByDate[doc.date] = [];
        }
        availMapByDate[doc.date].push(doc.userId);
      });

      const sortedServices = [...services].sort((a, b) => a.date.localeCompare(b.date));

      const doc = new jsPDF();
      
      // Header Banner
      doc.setFillColor(6, 11, 31);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      doc.text(`Relatório de Disponibilidade dos Ministros`, 14, 18);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Período da Escala: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 14, 26);
      doc.setFontSize(9);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 33);

      // Section 1: Resume / Metadata Overview
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo de Participação", 14, 52);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Total de Ministros Ativos: ${activeMembers.length}`, 14, 59);
      doc.text(`Ministros que marcaram disponibilidade: ${finishedMembers.length}`, 14, 65);
      doc.text(`Ministros com marcação pendente (faltantes): ${missingMembers.length}`, 14, 71);

      // Border Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 76, 196, 76);

      // Section 2: Detailed day-by-day availability
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Detalhamento por Dia de Culto", 14, 85);

      const tableData: any[][] = [];
      sortedServices.forEach(service => {
        const sDateObj = new Date(service.date);
        const formattedDate = sDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' });
        const formattedTime = sDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const dateKey = service.date.split('T')[0];
        const availableUserIds = availMapByDate[dateKey] || [];
        
        const availableNames = availableUserIds
          .map(uId => {
            const memberObj = activeMembers.find(m => m.id === uId || m.uid === uId);
            if (!memberObj) return null;
            const rawName = memberObj.name || memberObj.email?.split('@')[0] || '';
            const formattedName = getFormatNameForPdf(rawName);
            const rolesStr = Array.isArray(memberObj.roles) && memberObj.roles.length > 0
              ? ` (${memberObj.roles.slice(0, 2).join(', ')})`
              : '';
            return `${formattedName}${rolesStr}`;
          })
          .filter(Boolean);

        const availableNamesStr = availableNames.length > 0 
          ? availableNames.join('\n') 
          : 'Nenhum ministro marcado como disponível para este dia';

        tableData.push([
          `${formattedDate}\n(${formattedTime})`,
          service.title,
          availableNames.length,
          availableNamesStr
        ]);
      });

      autoTable(doc, {
        startY: 91,
        head: [['Data / Hora', 'Culto', 'Qtd', 'Ministros Disponíveis']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [43, 169, 184], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        styles: { 
          fontSize: 8.5, 
          cellPadding: 4,
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
          valign: 'top',
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold' },
          1: { cellWidth: 40 },
          2: { cellWidth: 12, halign: 'center' },
          3: { cellWidth: 'auto' }
        }
      });

      // Section 3: Overall member status on a second page
      doc.addPage();
      doc.setFillColor(6, 11, 31);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Status Geral de Todos os Ministros de Escala", 14, 13);

      const memberRows: any[][] = [];
      activeMembers.forEach(member => {
        const isFin = finishedMembers.some(m => m.id === member.id);
        const userAvails = allAvailDocs.filter(d => d.userId === member.id && d.status === 'available');
        const totalAvailsStr = isFin 
          ? `${userAvails.length} dia(s) livre(s)`
          : 'Não marcou';

        const rawName = member.name || member.email || '';
        memberRows.push([
          getFormatNameForPdf(rawName),
          Array.isArray(member.roles) ? member.roles.join(', ') : member.roles || '-',
          isFin ? 'CONCLUÍDO' : 'PENDENTE',
          totalAvailsStr
        ]);
      });

      memberRows.sort((a, b) => {
        if (a[2] === b[2]) {
          return a[0].localeCompare(b[0]);
        }
        return a[2] === 'CONCLUÍDO' ? -1 : 1;
      });

      autoTable(doc, {
        startY: 28,
        head: [['Ministro', 'Instrumentos / Funções', 'Status', 'Dias Disponíveis']],
        body: memberRows,
        theme: 'striped',
        headStyles: { 
          fillColor: [6, 11, 31], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8.5, 
          cellPadding: 4 
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 65 },
          2: { 
            cellWidth: 30, 
            halign: 'center',
            fontStyle: 'bold'
          },
          3: { cellWidth: 'auto', halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const val = data.cell.raw;
            if (val === 'CONCLUÍDO') {
              data.cell.styles.textColor = [34, 197, 94];
            } else {
              data.cell.styles.textColor = [234, 179, 8];
            }
          }
        }
      });

      doc.save(`Acompanhamento_Disponibilidade_${month}_${year}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const startStr = `${year}-${month}-01T00:00`;
    
    // End of month should be the start of the next month to cover everything
    const nextMonthDate = new Date(year, currentDate.getMonth() + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const endStr = `${nextYear}-${nextMonth}-01T00:00`;
    
    // All members for context
    const memberPath = 'members';
    const unsubMembers = onSnapshot(collection(db, memberPath), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const filtered = docs.filter(m => m.churchId === userChurchId || (!m.churchId && userChurchId === 'semente'));
      setAllMembers(filtered);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, memberPath);
    });

    // Scheduled services for context
    const servicePath = 'services';
    const qServices = query(
      collection(db, servicePath),
      where('date', '>=', startStr),
      where('date', '<', endStr),
      orderBy('date', 'asc')
    );

    const unsubServices = onSnapshot(qServices, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const filtered = docs.filter(s => s.churchId === userChurchId || (!s.churchId && userChurchId === 'semente'));
      setServices(filtered);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, servicePath);
    });

    // Personal availability
    const availabilityPath = 'availability';
    const qAvail = query(
      collection(db, availabilityPath),
      where('userId', '==', user.uid),
      where('date', '>=', startStr.split('T')[0]),
      where('date', '<', endStr.split('T')[0])
    );

    const unsubAvail = onSnapshot(qAvail, (snap) => {
      setAvailabilities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, availabilityPath);
    });

    // Lock status for the current month
    const currentMonthStr = `${year}-${month}`;
    const lockRef = doc(db, 'availability_locks', currentMonthStr);
    const unsubLock = onSnapshot(lockRef, (snap) => {
      if (snap.exists()) {
        setLockStatus(snap.data());
      } else {
        setLockStatus({ unlocked: false });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `availability_locks/${currentMonthStr}`);
    });

    return () => {
      unsubMembers();
      unsubServices();
      unsubAvail();
      unsubLock();
    };
  }, [currentDate, user, userChurchId]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  useEffect(() => {
    if (!lockStatus || !lockStatus.unlocked || !lockStatus.deadline) {
      setTimeLeft('');
      return;
    }

    const calculateTimeLeft = () => {
      const deadlineTime = new Date(lockStatus.deadline).getTime();
      const diff = deadlineTime - Date.now();

      if (diff <= 0) {
        setTimeLeft('expired');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [lockStatus]);

  const isLocked = !lockStatus?.unlocked || timeLeft === 'expired';

  const setDayAvailability = async (date: Date, status: 'available' | 'unavailable') => {
    if (!user) return;
    if (isLocked) {
      alert("A marcação de disponibilidade para este mês está bloqueada no momento.");
      return;
    }
    const dateStr = getLocalDateString(date);
    const availabilityPath = 'availability';
    const availabilityId = `${user.uid}_${dateStr}`;
    
    try {
      const availRef = doc(db, availabilityPath, availabilityId);
      const existingStatus = availabilities.find(a => a.date === dateStr)?.status;
      
      if (existingStatus === status) {
        await deleteDoc(availRef);
      } else {
        await setDoc(availRef, {
          userId: user.uid,
          date: dateStr,
          status: status,
          updatedAt: serverTimestamp(),
        });
      }

      // Reset monthly status to pending on change so they are forced to finalize and notify again
      const currentUserData = allMembers.find(m => m.id === user.uid);
      const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      if (currentUserData?.availabilityStatus?.[currentMonthStr] === 'finished') {
        const updatedStatus = { ...(currentUserData.availabilityStatus || {}) };
        delete updatedStatus[currentMonthStr];
        await updateDoc(doc(db, 'members', user.uid), {
          availabilityStatus: updatedStatus
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, availabilityPath);
    }
  };

  const activeLockHours = useMemo(() => {
    if (lockStatus?.hours) return Number(lockStatus.hours);
    if (lockStatus?.deadline && lockStatus?.unlockedAt) {
      const start = new Date(lockStatus.unlockedAt).getTime();
      const end = new Date(lockStatus.deadline).getTime();
      const diffHours = Math.round((end - start) / (1000 * 60 * 60));
      if (diffHours > 0) return diffHours;
    }
    return unlockHours || 48;
  }, [lockStatus, unlockHours]);

  const handleToggleAvailabilityLock = async () => {
    const wantToUnlock = isLocked;

    try {
      const lockRef = doc(db, 'availability_locks', currentMonthStr);
      if (wantToUnlock) {
        const hoursToSet = unlockHours > 0 ? unlockHours : 48;
        const unlockedAt = new Date().toISOString();
        const deadline = new Date(Date.now() + hoursToSet * 60 * 60 * 1000).toISOString();
        
        await setDoc(lockRef, {
          unlocked: true,
          unlockedAt,
          deadline,
          hours: hoursToSet,
        });

        // Trigger notifications to everyone
        if (createNotifications) {
          const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          const hoursFormatted = hoursToSet >= 24 && hoursToSet % 24 === 0 
            ? `${hoursToSet / 24} dia${hoursToSet / 24 > 1 ? 's' : ''}` 
            : `${hoursToSet} horas`;
          await createNotifications(
            "🗓️ Marcação do Mês Liberada!",
            `A marcação de disponibilidade para o mês de ${monthName} foi liberada! Você tem ${hoursFormatted} (${hoursToSet}h) para preencher seus dias livres.`,
            "announcement"
          );
        }
      } else {
        await setDoc(lockRef, {
          unlocked: false,
          hours: activeLockHours,
        });
      }
    } catch (e) {
      console.error("Erro ao alterar o status de bloqueio do calendário:", e);
    }
  };

  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const activeMembers = useMemo(() => {
    return allMembers.filter(m => Array.isArray(m.roles) && m.roles.length > 0);
  }, [allMembers]);

  const finishedMembers = useMemo(() => {
    return activeMembers.filter(m => m.availabilityStatus?.[currentMonthStr] === 'finished');
  }, [activeMembers, currentMonthStr]);

  const missingMembers = useMemo(() => {
    return activeMembers.filter(m => m.availabilityStatus?.[currentMonthStr] !== 'finished');
  }, [activeMembers, currentMonthStr]);

  const currentUserData = allMembers.find(m => m.id === user?.uid);
  const isFinished = currentUserData?.availabilityStatus?.[currentMonthStr] === 'finished';

  const availableDaysCount = availabilities.filter(a => a.status === 'available').length;
  const daysWithServices = services.map(s => new Date(s.date).getDate());

  const handleFinishAvailability = async () => {
    if (!user || isFinished) return;
    setIsFinishing(true);
    
    try {
      const memberPath = `members/${user.uid}`;
      const statusMap = currentUserData?.availabilityStatus || {};
      
      // Mark as finished in database
      await updateDoc(doc(db, 'members', user.uid), {
        availabilityStatus: {
          ...statusMap,
          [currentMonthStr]: 'finished'
        },
        lastAvailabilityUpdate: serverTimestamp()
      });

      // Calculate missing members
      const localActiveMembers = allMembers.filter(m => Array.isArray(m.roles) && m.roles.length > 0);
      const localFinishedMembers = localActiveMembers.filter(m => m.availabilityStatus?.[currentMonthStr] === 'finished');
      const localMissingMembers = localActiveMembers.filter(m => m.availabilityStatus?.[currentMonthStr] !== 'finished' && m.id !== user.uid);
      
      const missingCount = localMissingMembers.length;
      const finishedCount = localFinishedMembers.length + 1; // including current user
      
      // Get Admin phones and emails from settings and members list
      let adminTargets: { name: string; phone: string }[] = [];
      let adminEmailTargets: { name: string; email: string }[] = [];
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'notifications'));
        if (settingsSnap.exists()) {
          const sd = settingsSnap.data();
          if (sd.whatsappAdmin) {
            const p = cleanWhatsapp(sd.whatsappAdmin);
            if (p) {
              const matchingMember = allMembers.find(m => m.whatsapp && cleanWhatsapp(m.whatsapp) === p);
              adminTargets.push({
                name: matchingMember?.name || 'Administrador Principal',
                phone: p
              });
            }
          }
          if (sd.whatsappAdmin2) {
            const p2 = cleanWhatsapp(sd.whatsappAdmin2);
            if (p2) {
              const matchingMember = allMembers.find(m => m.whatsapp && cleanWhatsapp(m.whatsapp) === p2);
              adminTargets.push({
                name: matchingMember?.name || 'Administrador Auxiliar 1',
                phone: p2
              });
            }
          }
          if (sd.whatsappAdmin3) {
            const p3 = cleanWhatsapp(sd.whatsappAdmin3);
            if (p3) {
              const matchingMember = allMembers.find(m => m.whatsapp && cleanWhatsapp(m.whatsapp) === p3);
              adminTargets.push({
                name: matchingMember?.name || 'Administrador Auxiliar 2',
                phone: p3
              });
            }
          }

          if (sd.adminEmail && sd.adminEmail.trim()) {
            adminEmailTargets.push({ name: 'Administrador Principal', email: sd.adminEmail.trim() });
          }
          if (sd.adminEmail2 && sd.adminEmail2.trim()) {
            adminEmailTargets.push({ name: 'Administrador Auxiliar 1', email: sd.adminEmail2.trim() });
          }
          if (sd.adminEmail3 && sd.adminEmail3.trim()) {
            adminEmailTargets.push({ name: 'Administrador Auxiliar 2', email: sd.adminEmail3.trim() });
          }
        }
      } catch (e) {
        console.log("Using fallback admin phones and emails");
      }

      // Fallback from members where isAdmin is true if not configured
      if (adminTargets.length === 0 || adminEmailTargets.length === 0) {
        const adminMembers = allMembers.filter(m => m.isAdmin === true || m.email === 'mikmellorg@gmail.com');
        adminMembers.forEach(a => {
          const phone = cleanWhatsapp(a.whatsapp || '');
          if (phone && adminTargets.length === 0) {
            adminTargets.push({
              name: a.name || 'Coordenador',
              phone: phone
            });
          }
          if (a.email && adminEmailTargets.length === 0) {
            adminEmailTargets.push({
              name: a.name || 'Coordenador',
              email: a.email
            });
          }
        });
      }

      // Create message
      let message = `*🗓️ DISPONIBILIDADE CONCLUÍDA*\n\n`;
      message += `O membro *${currentUserData?.name || currentUserData?.email || 'Membro'}* acabou de concluir a sua marcação de disponibilidade para o mês de *${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}*.\n\n`;
      
      message += `📊 *CONTAGEM GERAL:*\n`;
      message += `✅ Marcaram: *${finishedCount} de ${localActiveMembers.length}*\n`;
      message += `⏳ Faltando marcar: *${missingCount} de ${localActiveMembers.length}*\n\n`;
      
      if (missingCount > 0) {
        message += `⚠️ *MEMBROS PENDENTES DE MARCAÇÃO:*\n`;
        localMissingMembers.forEach(m => {
          message += `• ${m.name || m.email}\n`;
        });
      } else {
        message += `🎉 *TODOS OS MEMBROS CONCLUÍRAM!* A escala de ministros já pode ser elaborada e editada no painel administrativo.`;
      }

      message += `\n\n_Enviado via LiLouPro_`;

      const encodedMessage = encodeURIComponent(message);
      
      // Also write in-app notifications for ALL administrators to ensure they never miss it!
      const adminUsersDocs = allMembers.filter(m => m.isAdmin === true || m.email === 'mikmellorg@gmail.com');
      const inAppNotificationsPromises = adminUsersDocs.map(admin => {
        const adminUserId = admin.id || admin.uid;
        if (!adminUserId || adminUserId === user.uid) return Promise.resolve();
        return addDoc(collection(db, 'notifications'), {
          userId: adminUserId,
          title: `🗓️ Disponibilidade de ${currentUserData?.name || 'Membro'}`,
          content: `${currentUserData?.name || 'Um ministro'} acabou de concluir a sua marcação para ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.`,
          type: 'general',
          read: false,
          createdAt: serverTimestamp()
        });
      });
      await Promise.all(inAppNotificationsPromises);

      // Store success state and show the popup dialog
      setSubmissionStatus({
        success: true,
        message: message,
        admins: adminTargets,
        adminEmails: adminEmailTargets
      });

      // Attempt popup for the first admin immediately
      if (adminTargets.length > 0) {
        try {
          const firstAdmin = adminTargets[0];
          const waUrl = `https://wa.me/${firstAdmin.phone}?text=${encodedMessage}`;
          const confirmMsg = `Sua disponibilidade para ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} foi salva com sucesso!\n\nDeseja abrir o WhatsApp agora para enviar a mensagem de notificação para o coordenador ${firstAdmin.name}?`;
          
          if (window.confirm(confirmMsg)) {
            window.open(waUrl, '_blank');
          }
        } catch (e) {
          console.log("Auto-popup blocked, user will use the modal buttons.");
        }
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `members/${user?.uid}`);
    } finally {
      setIsFinishing(false);
    }
  };

  const getServicesForDay = (day: number) => {
    const dayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return services.filter(s => s.date.startsWith(dayStr));
  };

  const getAvailabilityForDay = (day: number) => {
    const dateStr = getLocalDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    return availabilities.find(a => a.date === dateStr);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
       <div className="flex flex-col items-center justify-center text-center gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-text-main tracking-tight">Minha Disponibilidade</h1>
            <p className="text-text-main text-lg font-bold">Marque todos os seus dias livres para facilitar a criação da escala.</p>
          </div>
          
          <div className="w-full max-w-xl text-left">
            <ContextualHelp 
              id="availability"
              title="Disponibilidade: Como marcar?"
              description="A marcação de disponibilidade permite que a liderança crie escalas justas sem conflitos e sem a necessidade de perguntar um a um no WhatsApp."
              steps={[
                "Utilize os botões do Mês de Referência para planejar o mês correto.",
                "Clique em qualquer dia do calendário para alternar o status: Disponível (Verde), Parcialmente Disponível (Amarelo) ou Indisponível (Vermelho).",
                "Ao terminar de marcar, clique no botão 'Finalizar Envio' abaixo para notificar os líderes e confirmar sua participação."
              ]}
              tip="Mantenha sua agenda sempre atualizada! Se surgir um imprevisto ou viagem, você pode atualizar suas datas a qualquer momento antes do fechamento da escala."
              theme={theme}
            />
          </div>
          
          <div className="w-full max-w-4xl grid sm:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col items-center justify-center border-border bg-card/50">
               <span className="text-[10px] font-black uppercase tracking-widest text-text-main mb-1">Mês de Referência</span>
               <div className="flex items-center gap-2">
                 <button onClick={prevMonth} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-text-main transition-colors"><ChevronLeft size={18}/></button>
                 <span className="font-black text-text-main uppercase text-xs tracking-tight">
                   {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                 </span>
                 <button onClick={nextMonth} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-text-main transition-colors"><ChevronRight size={18}/></button>
               </div>
            </Card>
 
            <Card className={cn(
              "p-4 flex flex-col items-center justify-center border-border transition-all",
              isFinished ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"
            )}>
               <span className="text-[10px] font-black uppercase tracking-widest text-text-main mb-1">Status do Mês</span>
               <div className="flex items-center gap-2">
                 <div className={cn("w-2 h-2 rounded-full animate-pulse", isFinished ? "bg-green-500" : "bg-yellow-500")} />
                 <span className={cn("font-black text-xs uppercase", isFinished ? "text-green-500" : "text-yellow-600 dark:text-yellow-400")}>
                   {isFinished ? "Concluído" : "Pendente"}
                 </span>
               </div>
            </Card>
 
            <Card className="p-4 flex flex-col items-center justify-center border-border bg-brand/5">
               <span className="text-[10px] font-black uppercase tracking-widest text-text-main mb-1">Status Marcação</span>
               <div className="flex items-center gap-2">
                 <span className="font-black text-text-main text-lg leading-none">{availableDaysCount}</span>
                 <span className="text-[10px] font-bold text-text-main uppercase">Dias Disponíveis</span>
               </div>
            </Card>

            <Card className={cn(
              "p-4 flex flex-col items-center justify-center border-border transition-all",
              isLocked ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"
            )}>
               <span className="text-[10px] font-black uppercase tracking-widest text-text-main mb-1">Período de Marcação</span>
               <div className="flex flex-col items-center gap-1">
                 <div className="flex items-center gap-2">
                   {isLocked ? <Lock size={14} className="text-red-500" /> : <Unlock size={14} className="text-green-500" />}
                   <span className={cn("font-black text-xs uppercase", isLocked ? "text-red-500" : "text-green-500")}>
                     {isLocked ? (timeLeft === 'expired' ? "Prazo Expirado" : "Bloqueado") : "Liberado"}
                   </span>
                 </div>
                 {!isLocked && timeLeft && (
                   <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-green-500/90 dark:text-green-400">
                     <Timer size={10} className="animate-pulse" />
                     <span>{timeLeft}</span>
                   </div>
                 )}
               </div>
            </Card>
          </div>

          {isAdmin && (
            <div className="w-full max-w-4xl p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className={cn("p-2.5 rounded-xl shrink-0", isLocked ? "bg-red-500/15 text-red-500" : "bg-green-500/15 text-green-500")}>
                  {isLocked ? <Lock size={22} /> : <Unlock size={22} />}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-wider text-text-main flex items-center gap-2 flex-wrap">
                    Controle de Marcação (Admin)
                    <span className="text-[10px] bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-md font-bold">
                      Prazo: {activeLockHours >= 24 && activeLockHours % 24 === 0 ? `${activeLockHours / 24}d (${activeLockHours}h)` : `${activeLockHours}h`}
                    </span>
                  </p>
                  <p className="text-[11px] font-bold text-text-muted mt-0.5">
                    {isLocked 
                      ? (timeLeft === 'expired' 
                          ? `O prazo de ${activeLockHours}h expirou. A marcação automática de disponibilidade para os membros está encerrada.` 
                          : "A marcação de disponibilidade está bloqueada.")
                      : `A marcação de disponibilidade está liberada (${activeLockHours}h). Restam: ${timeLeft || 'carregando...'}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                {isLocked && (
                  <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 border border-border p-1.5 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted px-1 hidden sm:inline">Tempo de Liberação:</span>
                    <select
                      value={presetHours}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPresetHours(val);
                        if (val !== 'custom') {
                          const num = Number(val);
                          setUnlockHours(num);
                          localStorage.setItem('app-availability-unlock-hours', String(num));
                        }
                      }}
                      className="bg-card text-text-main text-xs font-bold rounded-lg p-1.5 border border-border outline-none cursor-pointer"
                    >
                      <option value="12">12 horas (1/2 dia)</option>
                      <option value="24">24 horas (1 dia)</option>
                      <option value="48">48 horas (2 dias - Padrão)</option>
                      <option value="72">72 horas (3 dias)</option>
                      <option value="120">120 horas (5 dias)</option>
                      <option value="168">168 horas (7 dias / 1 semana)</option>
                      <option value="custom">Personalizado...</option>
                    </select>

                    {presetHours === 'custom' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="720"
                          value={unlockHours}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(720, Number(e.target.value) || 1));
                            setUnlockHours(val);
                            localStorage.setItem('app-availability-unlock-hours', String(val));
                          }}
                          className="w-16 bg-card text-text-main text-xs font-bold rounded-lg p-1.5 border border-border outline-none text-center"
                          placeholder="Horas"
                        />
                        <span className="text-xs font-bold text-text-muted pr-1">h</span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleToggleAvailabilityLock}
                  className={cn(
                    "px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-md",
                    isLocked 
                      ? "bg-green-600 hover:bg-green-500 text-white border-green-500/30 hover:scale-105" 
                      : "bg-red-600 hover:bg-red-500 text-white border-red-500/30 hover:scale-105"
                  )}
                >
                  {isLocked ? (
                    <>
                      <Unlock size={14} /> Liberar Marcação ({unlockHours}h)
                    </>
                  ) : (
                    <>
                      <Lock size={14} /> Bloquear Marcação
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {!isFinished && !isLocked && availabilities.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-4xl p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left flex items-start gap-3 shadow-sm select-none"
            >
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-black uppercase text-amber-500 tracking-wider">Lembrete de Envio Importante ⚠️</p>
                <p className="text-[11px] font-bold text-text-muted mt-1 leading-normal">
                  Suas marcações estão salvas temporariamente na grade, mas a coordenação continuará vendo seu status como <span className="text-amber-500 font-black underline">PENDENTE</span> no dashboard até que você finalize seu envio.
                  Para que os administradores recebam as notificações e elaborem a escala, por favor, clique no botão <span className="font-extrabold text-text-main">“Finalizar e Notificar Liderança”</span> abaixo para concluir.
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-center">
            <Button
              onClick={handleFinishAvailability}
              disabled={isFinishing || isFinished || isLocked}
              className={cn(
                "px-10 py-3 shadow-xl transition-all font-black uppercase tracking-widest text-[10px] h-12 rounded-xl border group",
                isFinished 
                  ? "bg-green-500 border-green-400 text-white cursor-default" 
                  : (isLocked ? "bg-card border-border text-text-muted cursor-not-allowed opacity-50" : "bg-brand hover:scale-105 border-brand shadow-brand/20")
              )}
            >
              {isFinished ? (
                <div className="flex items-center gap-2">
                  <Check size={18} strokeWidth={3} /> Disponibilidade Enviada
                </div>
              ) : isFinishing ? (
                <div className="flex items-center gap-2">
                  <RefreshCcw size={16} className="animate-spin" /> Notificando Admin...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send size={16} /> Finalizar e Notificar Liderança
                </div>
              )}
            </Button>
          </div>
       </div>

       <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6 sm:p-8 bg-card backdrop-blur-md border border-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Calendar size={120} />
            </div>
            
            <div className="grid grid-cols-7 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d, i) => (
                <div key={d} className={cn("text-center text-[10px] font-black uppercase tracking-widest pb-4", i === 0 ? "text-red-400" : "text-text-main/90")}>
                  {d}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {blanks.map(b => <div key={`b-${b}`} className="aspect-square"></div>)}
              {days.map(d => {
                const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                const dayServices = getServicesForDay(d);
                const availability = getAvailabilityForDay(d);
                const isSunday = dayDate.getDay() === 0;
                const isToday = new Date().toDateString() === dayDate.toDateString();
                const isSelected = selectedDate?.getDate() === d && selectedDate?.getMonth() === currentDate.getMonth();
                const hasServices = dayServices.length > 0;
 
                return (
                  <button 
                    key={d} 
                    onClick={() => setSelectedDate(dayDate)}
                    className={cn(
                      "aspect-square rounded-xl border transition-all flex flex-col items-center justify-center relative group p-1",
                      hasServices && !isSelected ? "border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/5 text-blue-500 dark:text-blue-300" 
                        : (isSunday ? "bg-red-500/5 border-red-500/10 text-red-600 dark:text-red-100" : "bg-black/5 dark:bg-white/5 border-border text-text-main font-black"),
                      isSelected ? "ring-2 ring-brand border-brand bg-brand/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "hover:bg-black/10 dark:hover:bg-white/10 hover:border-text-muted/20",
                      isToday && "bg-brand/10 border-brand/50 ring-1 ring-brand/30"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-black relative z-10", 
                      (isSunday && !hasServices) && "text-red-400", 
                      hasServices && "text-blue-500 dark:text-blue-300",
                      isToday && "text-brand"
                    )}>{d}</span>
                    
                    {hasServices && (
                       <div className="absolute top-1 right-1 opacity-40 group-hover:opacity-100 transition-opacity">
                         <Star size={8} fill="currentColor" className="text-blue-400" />
                       </div>
                    )}

                    <div className="flex flex-col items-center gap-1 mt-1">
                      {availability && (
                         <div className={cn(
                           "w-1.5 h-1.5 rounded-full shadow-sm",
                           availability.status === 'available' ? "bg-green-400" : "bg-red-500"
                         )} />
                      )}
                      {dayServices.length > 0 && (
                        <div className="flex gap-0.5">
                          {dayServices.map(s => (
                            <div key={s.id} className="w-1 h-1 rounded-full bg-blue-400/50" />
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 text-[10px] font-black uppercase tracking-widest text-text-main">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400" /> Disponível</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> Indisponível</div>
              <div className="flex items-center gap-2 sm:col-span-1 border-l sm:border-l pl-3 border-border"><div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" /> Culto Agendado</div>
            </div>
          </Card>

          <div className="space-y-4">
             {selectedDate ? (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-end justify-between px-1">
                    <h3 className="text-xl font-black text-text-main tracking-tight">
                      {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                  </div>
                  
                  <Card className="p-6 bg-card border-border shadow-xl">
                    <p className="text-[16px] font-black text-text-main uppercase tracking-widest mb-4 text-center">Minha Disponibilidade Geral</p>
                    {isLocked && (
                      <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-center">
                        <p className="text-xs font-black text-red-500 flex items-center justify-center gap-1.5 leading-tight">
                          <Lock size={12} />
                          {timeLeft === 'expired' 
                            ? `Prazo de ${activeLockHours}h expirou. Marcação bloqueada.` 
                            : "Calendário bloqueado pelo administrador."}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {(['available', 'unavailable'] as const).map(status => {
                        const dateStr = getLocalDateString(selectedDate);
                        const isActive = availabilities.find(a => a.date === dateStr)?.status === status;
                        return (
                          <button
                            key={status}
                            onClick={() => setDayAvailability(selectedDate, status)}
                            disabled={isLocked}
                            className={cn(
                              "py-4 px-2 rounded-2xl flex flex-col items-center justify-center transition-all border gap-2 group",
                              isActive 
                                ? (status === 'available' ? "bg-green-500 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "bg-red-500 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]")
                                : "bg-black/5 dark:bg-white/5 border-border text-text-main font-black hover:bg-black/10 hover:border-brand/40",
                              isLocked && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {status === 'available' ? <Check size={20} strokeWidth={3}/> : <X size={20} strokeWidth={3}/>}
                            <span className="text-[14px] font-black uppercase tracking-widest">
                              {status === 'available' ? 'Conte comigo' : 'Não posso'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Card>

                  {getServicesForDay(selectedDate.getDate()).length > 0 && (
                    <div className="space-y-4">
                      <p className="text-[12px] font-black text-text-main uppercase tracking-widest pl-1">Cultos agendados para este dia:</p>
                      {getServicesForDay(selectedDate.getDate()).map(service => (
                        <Card key={service.id} className="p-5 border-border bg-card flex items-center justify-between group">
                          <div>
                            <h4 className="font-black text-text-main text-lg tracking-tight">{service.title}</h4>
                            <p className="text-xs text-text-main font-black mt-1 flex items-center gap-1.5 ">
                               <Clock size={12} className="text-text-main"/>
                               {new Date(service.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex -space-x-1.5 overflow-hidden">
                             {(() => {
                               const matchedIds = Array.from(new Set(Object.values(service.scales || {}).flat().filter(Boolean) as string[]));
                               return matchedIds.slice(0, 4).map((memberId) => {
                                 const m = allMembers.find(mem => mem.id === memberId || mem.uid === memberId);
                                 return (
                                   <div 
                                     key={memberId} 
                                     className="w-7 h-7 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-[10px] font-black text-brand overflow-hidden shrink-0 relative"
                                     title={m?.name || "Integrante"}
                                   >
                                     <CachedAvatar 
                                       photoUrl={m?.photoUrl} 
                                       alt={m?.name} 
                                       className="w-full h-full" 
                                       fallbackText={m?.name}
                                     />
                                   </div>
                                 );
                               });
                             })()}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
               </div>
             ) : (
               <div className="h-full flex items-center justify-center p-10 text-center border-2 border-dashed border-border rounded-3xl opacity-50">
                  <div className="max-w-xs space-y-4">
                       <Calendar size={48} className="mx-auto text-text-main" />
                     <p className="text-sm text-text-main font-black italic">Selecione um dia no calendário para gerenciar sua disponibilidade.</p>
                  </div>
               </div>
             )}
          </div>
       </div>

       {/* Painel de Acompanhamento de Marcações */}
       {isAdmin && (
         <Card className="p-6 bg-card border-border shadow-xl w-full">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5 mb-5">
           <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
               <Activity size={22} className="animate-pulse" />
             </div>
             <div className="text-left">
               <h3 className="text-base font-black uppercase tracking-wider text-text-main">Acompanhamento das Marcações</h3>
               <p className="text-[11px] font-bold text-text-muted mt-0.5">Participação dos ministros na escala de {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
             </div>
           </div>
           
           <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
             <div className="flex gap-4 w-full sm:w-auto">
               <div className="flex-1 sm:flex-initial bg-green-500/10 dark:bg-green-500/5 px-4 py-2 rounded-xl border border-green-500/20 text-center min-w-[80px]">
                 <span className="block text-lg font-black text-green-500">{finishedMembers.length}</span>
                 <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Concluídos</span>
               </div>
               <div className="flex-1 sm:flex-initial bg-yellow-500/10 dark:bg-yellow-500/5 px-4 py-2 rounded-xl border border-yellow-500/20 text-center font-black min-w-[80px]">
                 <span className="block text-lg font-black text-yellow-600 dark:text-yellow-400">{missingMembers.length}</span>
                 <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">Faltantes</span>
               </div>
             </div>
             
             <Button
               onClick={handleSendAvailabilityEmailReport}
               variant="secondary"
               className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/30 font-black text-[10px] uppercase tracking-widest h-10 px-3.5 rounded-xl shrink-0 inline-flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
             >
               <Mail size={14} />
               <span>Enviar E-mail</span>
             </Button>

             <Button
               onClick={handleDownloadMonthlyAvailabilityPdf}
               disabled={isDownloadingPdf}
               variant="primary"
               className="bg-brand hover:brightness-110 text-white font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl shadow-lg shadow-brand/20 shrink-0 inline-flex items-center justify-center gap-2"
             >
               {isDownloadingPdf ? (
                 <>
                   <RefreshCcw size={14} className="animate-spin" />
                   <span>Gerando PDF...</span>
                 </>
               ) : (
                 <>
                   <Download size={14} />
                   <span>Baixar PDF</span>
                 </>
               )}
             </Button>
           </div>
         </div>

         {/* Lembrete / Cobrança de Disponibilidade (Apenas para Admins) */}
         {isAdmin && missingMembers.length > 0 && (
           <div className="mb-6 p-5 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 text-left space-y-4">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
               <div className="flex items-center gap-2">
                 <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                 <h4 className="text-xs font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                   Cobrança de Disponibilidade ⏰
                 </h4>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-text-muted">Prazo termina hoje às:</span>
                 <input 
                   type="text" 
                   value={reminderDeadline} 
                   onChange={e => setReminderDeadline(e.target.value)}
                   placeholder="Ex: 20:00"
                   className="w-20 bg-black/5 dark:bg-white/5 border border-border rounded-lg px-2 py-1 text-xs font-bold text-center text-text-main focus:outline-none focus:ring-1 focus:ring-brand"
                 />
               </div>
             </div>
             
             <div className="space-y-1.5 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border/60">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                 <label className="text-[10px] font-black uppercase tracking-wider text-text-main">
                   Mensagem de Lembrete Individual (WhatsApp) 💬
                 </label>
                 <span className="text-[8px] font-semibold text-zinc-400 dark:text-zinc-500">
                   Use <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">{`{NOME}`}</code> para o nome do ministro
                 </span>
               </div>
               <textarea
                 value={reminderMessageTemplate}
                 onChange={e => setReminderMessageTemplate(e.target.value)}
                 rows={3}
                 className="w-full bg-white/50 dark:bg-zinc-950/50 border border-border/80 rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-brand leading-relaxed"
                 placeholder="Editar a mensagem que será enviada para o WhatsApp de cada um..."
               />
             </div>

             <p className="text-[11px] text-text-muted font-bold leading-relaxed">
               Personalize o horário e a mensagem do template acima. O botão <span className="text-emerald-500">Lembrete</span> ao lado do nome de cada ministro pendente abrirá o WhatsApp individual com essa mensagem formatada. Use o botão abaixo para copiar o aviso coletivo do grupo.
             </p>

             {getFiveHoursBefore(reminderDeadline) && (
               <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                 💡 No WhatsApp pessoal, a sugestão é disparar o lembrete individual às <span className="font-black underline">{getFiveHoursBefore(reminderDeadline)}</span> (5 horas antes do prazo) para que todos tenham tempo de marcar!
               </div>
             )}

             <div className="flex flex-wrap gap-3 pt-2 border-t border-border/40">
               <Button
                 onClick={handleCopyGroupAnnouncement}
                 className="w-full sm:w-auto h-9 px-4 rounded-xl text-[10px] uppercase font-black tracking-wider inline-flex items-center justify-center gap-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main border border-border"
               >
                 <Copy size={12} />
                 <span>Copiar Chamada de Grupo 📋</span>
               </Button>
             </div>
           </div>
         )}

         <div className="grid md:grid-cols-2 gap-6">
           {/* Concluídos */}
           <div className="space-y-3">
             <div className="flex items-center justify-between gap-2">
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                 <p className="text-xs font-black uppercase tracking-wider text-green-500">
                   Marcaram ({finishedMembers.length})
                 </p>
               </div>
               {finishedMembers.length > 0 && (
                 <button
                   onClick={handleExportExcel}
                   disabled={isExportingExcel}
                   className="p-1.5 px-2.5 bg-emerald-500/10 dark:bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider transition-all scale-95 hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-90"
                   title="Exportar dados e dias disponíveis para Excel"
                 >
                   {isExportingExcel ? (
                     <Loader2 size={11} className="animate-spin text-emerald-500" />
                   ) : (
                     <FileDown size={11} className="text-emerald-650 dark:text-emerald-400" />
                   )}
                   <span>Exportar Excel</span>
                 </button>
               )}
             </div>
             {finishedMembers.length > 0 ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                 {finishedMembers.map(m => (
                   <button 
                     key={m.id} 
                     id={`btn-availability-member-${m.id}`}
                     onClick={() => handleViewAvailabilityDetail(m)}
                     className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-green-500/5 text-green-600 dark:text-green-400 border border-green-500/10 leading-snug truncate hover:bg-green-500/15 hover:border-green-500/30 cursor-pointer text-left active:scale-95 transition-all outline-none"
                     title={`${m.name || m.email} (Clique para ver datas)`}
                   >
                     {m.name || m.email?.split('@')[0]}
                   </button>
                 ))}
               </div>
             ) : (
               <p className="text-xs italic text-text-muted font-bold pl-4">Nenhum ministro marcou ainda.</p>
             )}
           </div>

           {/* Faltantes */}
           <div className="space-y-3">
             <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
               <p className="text-xs font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                 Falta Marcar ({missingMembers.length})
               </p>
             </div>
             {missingMembers.length > 0 ? (
               <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                 {missingMembers.map(m => (
                   <div 
                     key={m.id} 
                     className="flex items-center justify-between p-2 rounded-xl bg-yellow-500/5 border border-yellow-500/10 hover:bg-yellow-500/10 transition-all gap-2"
                   >
                     <button 
                       id={`btn-availability-member-${m.id}`}
                       onClick={() => handleViewAvailabilityDetail(m)}
                       className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400 leading-snug truncate text-left grow outline-none py-1.5"
                       title={`${m.name || m.email} (Clique para ver datas)`}
                     >
                       {m.name || m.email?.split('@')[0]}
                       {m.whatsapp && (
                         <span className="block text-[9px] text-zinc-400 font-normal truncate mt-0.5">{m.whatsapp}</span>
                       )}
                     </button>
                     
                     {isAdmin && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           handleSendReminder(m);
                         }}
                         className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all scale-95 hover:scale-100 shrink-0"
                         title="Enviar lembrete individual pelo WhatsApp"
                       >
                         <MessageSquare size={10} />
                         <span>Lembrete</span>
                       </button>
                     )}
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-xs italic text-text-muted font-bold pl-4">Todos os ministros estão em dia! 🎉</p>
             )}
           </div>
         </div>
       </Card>
       )}

       <Card className="p-6 bg-gradient-to-r from-brand/10 to-transparent border-brand/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand/20 rounded-2xl text-brand shrink-0">
               <Activity size={24} />
            </div>
            <div>
               <h4 className="font-black text-text-main uppercase tracking-tight text-sm">Por que marcar disponibilidade?</h4>
               <p className="text-text-main text-sm mt-2 leading-relaxed font-bold">
                 Marcar seus dias livres nos ajuda a organizar as escalas mensais de forma mais justa e eficiente. 
                 Assim, evitamos escalar você em dias que você realmente não pode estar presente.
               </p>
            </div>
          </div>
       </Card>

        <AnimatePresence>
          {detailMember && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
              >
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-white text-xl font-black shadow-lg shadow-brand/20">
                      {(detailMember.name || detailMember.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-text-main leading-tight">{detailMember.name || detailMember.email}</h2>
                      <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Datas Disponíveis</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDetailMember(null)}
                    className="p-2 text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all cursor-pointer outline-none"
                  >
                    <X size={24}/>
                  </button>
                </div>
                {isAdmin && (
                  <div className="px-6 py-2 bg-black/5 dark:bg-white/5 border-b border-border flex items-center justify-around gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalMode('view')}
                      className={cn(
                        "flex-1 py-1 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-center border-dashed border",
                        modalMode === 'view' ? "bg-black/15 dark:bg-white/10 text-brand border-brand font-extrabold" : "text-text-muted hover:text-text-main border-transparent"
                      )}
                    >
                      Visualizar Datas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode('edit-admin');
                        if (!adminSelectedDate) {
                          setAdminSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
                        }
                      }}
                      className={cn(
                        "flex-1 py-1 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5 border-dashed border",
                        modalMode === 'edit-admin' ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-amber-500 font-extrabold" : "text-text-muted hover:text-text-main border-transparent"
                      )}
                    >
                      <Zap size={10} className="text-amber-500" />
                      Marcar Dias (Admin)
                    </button>
                  </div>
                )}

                <div className="p-6 overflow-y-auto flex-1 bg-surface space-y-6">
                  {loadingDetail ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <RefreshCcw size={32} className="text-brand animate-spin" />
                      <p className="text-xs font-black text-text-muted uppercase tracking-widest">Buscando datas...</p>
                    </div>
                  ) : modalMode === 'edit-admin' ? (
                    <div className="space-y-4 text-left">
                      {/* Status Toggle Header */}
                      <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border flex items-center justify-between gap-3">
                        <div className="text-left space-y-0.5">
                          <span className="block text-[8px] font-black text-text-muted uppercase tracking-widest">Status de Conclusão</span>
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              (detailMember.availabilityStatus?.[currentMonthStr] === 'finished') ? "bg-green-500" : "bg-yellow-500"
                            )} />
                            <span className="text-xs font-bold text-text-main">
                              {(detailMember.availabilityStatus?.[currentMonthStr] === 'finished') ? "Preenchido e Concluído" : "Pendente"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleMemberFinishedStatus(detailMember)}
                          className={cn(
                            "py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border shrink-0",
                            (detailMember.availabilityStatus?.[currentMonthStr] === 'finished')
                              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-extrabold hover:bg-yellow-500/20"
                              : "bg-green-500/10 border-green-500/30 text-green-500 font-extrabold hover:bg-green-500/20"
                          )}
                        >
                          {(detailMember.availabilityStatus?.[currentMonthStr] === 'finished') ? "Marcar Pendente" : "Marcar Concluído"}
                        </button>
                      </div>

                      {/* Info Banner */}
                      <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-500 leading-normal">
                        ⚡ <strong>Modo Administrador:</strong> Suas alterações são aplicadas instantaneamente e ignoram qualquer prazo encerrado ou bloqueio do calendário.
                      </div>

                      {/* Mini-Calendar Component of the Reference Month */}
                      <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-border space-y-3">
                        <div className="text-center font-black text-xs text-text-main uppercase tracking-widest pb-1 border-b border-border/40">
                          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="grid grid-cols-7 text-center text-[9px] font-black text-text-muted uppercase tracking-wider">
                          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((wd, idx) => (
                            <span key={idx} className={idx === 0 ? "text-red-400" : ""}>{wd}</span>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {blanks.map(b => <div key={`b-${b}`} className="aspect-square"></div>)}
                          {days.map(d => {
                            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                            const dayStr = getLocalDateString(dayDate);
                            const avail = detailAvailability.find(a => a.date === dayStr);
                            const isSelected = adminSelectedDate?.getDate() === d && adminSelectedDate?.getMonth() === currentDate.getMonth();

                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setAdminSelectedDate(dayDate)}
                                className={cn(
                                  "aspect-square rounded-lg border transition-all flex flex-col items-center justify-center p-1 relative text-[11px] font-black cursor-pointer",
                                  avail?.status === 'available' ? "bg-green-500/20 border-green-500/40 text-green-500 font-extrabold shadow-inner"
                                    : (avail?.status === 'unavailable' ? "bg-red-500/20 border-red-500/40 text-red-500 font-extrabold shadow-inner" : "bg-black/10 dark:bg-white/5 border-border text-text-main"),
                                  isSelected ? "ring-2 ring-amber-500 border-amber-500 scale-102 z-10 font-black" : "hover:bg-black/20 dark:hover:bg-white/10"
                                )}
                              >
                                <span>{d}</span>
                                {avail && (
                                  <div className={cn(
                                    "w-1 h-1 rounded-full absolute bottom-1",
                                    avail.status === 'available' ? "bg-green-500" : "bg-red-500"
                                  )} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        
                        <div className="flex items-center gap-4 justify-center text-[8.5px] font-black text-text-muted uppercase tracking-wider pt-2 border-t border-border/20">
                          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-green-500/20 border border-green-500/40" /> Disponível</span>
                          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/40" /> Indisponível</span>
                        </div>
                      </div>

                      {/* Day Action Controls */}
                      {adminSelectedDate ? (
                        <div className="bg-black/5 dark:bg-white/5 border border-border/80 rounded-xl p-3.5 space-y-2 text-center animate-in fade-in duration-200">
                          <p className="text-[10px] font-black uppercase text-brand tracking-widest pl-1 leading-none mb-1">
                            Dia Selecionado: {adminSelectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </p>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setAdminMemberAvailability(detailMember.id, adminSelectedDate, 'available')}
                              className="py-2.5 px-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20 transition-all font-black uppercase text-[8.1px] tracking-wide"
                            >
                              Disponível ✅
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminMemberAvailability(detailMember.id, adminSelectedDate, 'unavailable')}
                              className="py-2.5 px-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all font-black uppercase text-[8.1px] tracking-wide"
                            >
                              Não Posso ❌
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminMemberAvailability(detailMember.id, adminSelectedDate, 'clear')}
                              className="py-2.5 px-1.5 rounded-lg bg-zinc-550/10 border border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/20 transition-all font-black uppercase text-[8.1px] tracking-wide"
                            >
                              Limpar 🗑️
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-[10px] font-bold text-text-muted italic bg-black/5 dark:bg-white/5 border border-dashed border-border rounded-xl">
                          Selecione um dia acima no mini-grade para alterar a disponibilidade.
                        </div>
                      )}
                    </div>
                  ) : detailAvailability.length > 0 ? (
                    (() => {
                      const grouped: Record<string, any[]> = {};
                      detailAvailability
                        .filter(a => a.status === 'available')
                        .forEach(a => {
                          const date = new Date(a.date + 'T00:00');
                          const monthKey = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                          if (!grouped[monthKey]) grouped[monthKey] = [];
                          grouped[monthKey].push(a);
                        });

                      const monthEntries = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

                      if (monthEntries.length === 0) {
                        return (
                          <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-border w-full">
                            <Calendar size={48} className="mx-auto text-text-muted/30 mb-4" />
                            <p className="text-sm font-black text-text-muted uppercase tracking-widest">Nenhuma data disponível marcada.</p>
                          </div>
                        );
                      }

                      return monthEntries.map(([month, dates]) => (
                        <div key={month} className="space-y-3">
                          <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] pl-1 text-left">{month}</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {dates.sort((a, b) => a.date.localeCompare(b.date)).map((d, i) => {
                              const dateObj = new Date(d.date + 'T00:00');
                              return (
                                <div key={i} className="flex flex-col p-3 bg-black/5 dark:bg-white/5 border border-border rounded-xl text-left">
                                  <span className="text-xs font-black text-text-main">
                                    {dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </span>
                                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight">
                                    {dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-border w-full">
                      <Calendar size={48} className="mx-auto text-text-muted/30 mb-4" />
                      <p className="text-sm font-black text-text-muted uppercase tracking-widest">Nenhuma data marcada.</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-border bg-black/5 dark:bg-white/5 flex justify-center shrink-0">
                  <Button onClick={() => setDetailMember(null)} variant="secondary" className="px-8 font-black uppercase text-[10px] tracking-widest">
                    Fechar
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {submissionStatus && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="p-6 sm:p-8 flex-1 overflow-y-auto text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/5">
                    <Check size={32} strokeWidth={3} className="animate-bounce" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-text-main tracking-tight">Disponibilidade Enviada!</h2>
                    <p className="text-xs font-bold text-text-muted max-w-md mx-auto">
                      Suas preferências foram registradas com sucesso no aplicativo. Além disso, criamos uma notificação em tempo real no painel administrativo dos coordenadores.
                    </p>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-left space-y-3">
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Smartphone size={14} /> Canal WhatsApp das Lideranças
                    </h3>
                    <p className="text-[11px] font-bold text-text-muted leading-relaxed">
                      Seu navegador pode ter bloqueado a abertura automática da janela de envio. Para garantir que os líderes recebam sua mensagem formatada no celular, toque em enviar abaixo para cada um deles:
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {submissionStatus.admins.length > 0 ? (
                        submissionStatus.admins.map((adm, idx) => {
                          const waUrl = `https://wa.me/${adm.phone}?text=${encodeURIComponent(submissionStatus.message)}`;
                          return (
                            <div key={adm.phone + idx} className="flex gap-2 items-center bg-card border border-border/80 rounded-xl p-3 justify-between shadow-sm">
                              <div className="text-left w-2/3">
                                <p className="text-xs font-black text-text-main pr-2 truncate">{adm.name}</p>
                                <p className="text-[9px] font-mono text-text-muted mt-0.5">{adm.phone}</p>
                              </div>
                              <Button
                                onClick={() => window.open(waUrl, '_blank')}
                                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wide rounded-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-xs shrink-0"
                              >
                                Enviar 💬
                              </Button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs font-bold text-center py-2 text-text-muted">Nenhum número de WhatsApp administrativo configurado.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl text-left space-y-3">
                    <h3 className="text-xs font-black text-sky-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Mail size={14} /> Canal E-mail dos Administradores
                    </h3>
                    <p className="text-[11px] font-bold text-text-muted leading-relaxed">
                      Envie o relatório de confirmação de disponibilidade diretamente para o e-mail oficial dos coordenadores da igreja:
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {submissionStatus.adminEmails && submissionStatus.adminEmails.length > 0 ? (
                        submissionStatus.adminEmails.map((adm, idx) => {
                          const mailSubject = `🗓️ Disponibilidade Concluída - ${currentUserData?.name || 'Membro'} - ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
                          const mailtoUrl = `mailto:${adm.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(submissionStatus.message)}`;
                          return (
                            <div key={adm.email + idx} className="flex gap-2 items-center bg-card border border-border/80 rounded-xl p-3 justify-between shadow-sm">
                              <div className="text-left w-2/3">
                                <p className="text-xs font-black text-text-main pr-2 truncate">{adm.name}</p>
                                <p className="text-[9px] font-mono text-text-muted mt-0.5 truncate">{adm.email}</p>
                              </div>
                              <Button
                                onClick={() => window.open(mailtoUrl, '_self')}
                                className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-[10px] uppercase tracking-wide rounded-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-xs shrink-0"
                              >
                                Enviar E-mail ✉️
                              </Button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs font-bold text-center py-2 text-text-muted">Nenhum e-mail administrativo configurado.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted pl-1">Prévia da Mensagem Gerada</label>
                    <pre className="text-[10px] bg-black/15 dark:bg-white/5 border border-border p-4 rounded-xl font-mono text-text-main whitespace-pre-wrap leading-tight text-left select-all cursor-pointer shadow-inner max-h-[160px] overflow-y-auto" title="Clique para selecionar e copiar">
                      {submissionStatus.message}
                    </pre>
                  </div>
                </div>

                <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-border flex items-center justify-center gap-3">
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(submissionStatus.message);
                      alert("Copiado com sucesso para a área de transferência!");
                    }}
                    variant="secondary" 
                    className="flex-1 max-w-[180px] font-black uppercase text-[10px] tracking-widest h-10 border border-border rounded-xl"
                  >
                     Copiar Texto 📋
                  </Button>
                  <Button 
                    onClick={() => setSubmissionStatus(null)} 
                    className="flex-1 max-w-[180px] bg-brand text-white font-black uppercase text-[10px] tracking-widest h-10 rounded-xl"
                  >
                     Entendido ✅
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Floating Sticky Bottom Action Bar for Mobile/Desktop Usability */}
        {!isFinished && !isLocked && availabilities.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg bg-zinc-950/90 dark:bg-zinc-900/95 backdrop-blur-md border border-amber-500/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /> PENDENTE DE ENVIO ⚠️
              </p>
              <p className="text-[10px] font-bold text-text-muted mt-0.5 leading-normal max-w-[260px] xs:max-w-xs">
                Toque em finalizar para enviar sua escala para a liderança.
              </p>
            </div>
            <Button
              onClick={handleFinishAvailability}
              disabled={isFinishing}
              className="bg-brand text-white font-black uppercase text-[10px] tracking-widest h-9 px-4 rounded-xl shadow-lg shadow-brand/20 shrink-0"
            >
              {isFinishing ? (
                <RefreshCcw size={12} className="animate-spin" />
              ) : (
                <div className="flex items-center gap-1.5">
                  <Send size={12} /> Finalizar
                </div>
              )}
            </Button>
          </div>
        )}
    </motion.div>
  );
}

interface LiturgyItem {
  id: string;
  type: string;
  title: string;
  content: string;
  details: string;
  songId?: string;
  moment?: string;
}

interface MomentGroup {
  moment: string;
  items: { item: LiturgyItem; originalIndex: number }[];
}

