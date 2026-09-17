import { getServiceSongs } from './servicePlaylistUtils';

export interface CalendarEventOptions {
  allSongs?: any[];
  members?: any[];
  user?: any;
  churchData?: any;
}

/**
 * Formata um objeto Date para o formato aceito pelo Google Agenda: YYYYMMDDTHHmmssZ (UTC)
 */
function formatGCalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Extrai e converte a data de início de um culto.
 */
export function getServiceStartDate(service: any): Date {
  if (!service || !service.date) return new Date();
  if (service.date?.toDate) return service.date.toDate();
  if (service.date instanceof Date) return service.date;
  const parsed = new Date(service.date);
  return !isNaN(parsed.getTime()) ? parsed : new Date();
}

/**
 * Gera a URL para adicionar o culto diretamente ao Google Agenda (Google Calendar)
 */
export function generateGoogleCalendarUrl(service: any, options: CalendarEventOptions = {}): string {
  if (!service) return '';

  const startDate = getServiceStartDate(service);
  // Duração padrão estimada de 2 horas para cultos
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const datesParam = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

  const churchName = options.churchData?.name || '';
  const title = `${service.title || 'Culto de Celebração'}${churchName ? ` • ${churchName}` : ' • Ministério de Louvor'}`;
  const location = options.churchData?.address || options.churchData?.city || churchName || '';

  const detailsParts: string[] = [];

  // 1. Identificar se o usuário atual está escalado
  if (options.user && service.scales) {
    const userId = options.user.uid;
    const userRoles: string[] = [];
    
    Object.entries(service.scales).forEach(([role, ids]) => {
      const assignedIds = Array.isArray(ids) ? ids : [ids].filter(Boolean);
      if (assignedIds.includes(userId)) {
        userRoles.push(role);
      }
    });

    if (userRoles.length > 0) {
      detailsParts.push(`⭐ SUA FUNÇÃO NA ESCALA:\n${userRoles.map(r => `• ${r}`).join('\n')}\n`);
    }
  }

  // 2. Lista completa da equipe escalada
  if (service.scales && options.members && options.members.length > 0) {
    const scaleLines: string[] = [];
    Object.entries(service.scales).forEach(([role, ids]) => {
      const assignedIds = Array.isArray(ids) ? ids : [ids].filter(Boolean);
      if (assignedIds.length > 0) {
        const names = assignedIds.map(id => {
          const m = options.members?.find((member: any) => member.id === id || member.uid === id);
          return m?.name || 'Membro';
        });
        scaleLines.push(`• ${role}: ${names.join(', ')}`);
      }
    });

    if (scaleLines.length > 0) {
      detailsParts.push(`👥 EQUIPE ESCALADA:\n${scaleLines.join('\n')}\n`);
    }
  }

  // 3. Repertório / Músicas do Culto
  const songs = getServiceSongs(service, options.allSongs || []);
  if (songs.length > 0) {
    const songLines = songs.map((s, idx) => {
      const keyInfo = s.key || s.tone ? ` (Tom: ${s.key || s.tone})` : '';
      return `${idx + 1}. ${s.title || s.name}${keyInfo}`;
    });
    detailsParts.push(`🎵 REPERTÓRIO DO CULTO:\n${songLines.join('\n')}\n`);
  }

  // 4. Playlist do YouTube se houver
  if (service.playlistUrl) {
    detailsParts.push(`▶️ PLAYLIST DO CULTO:\n${service.playlistUrl}\n`);
  }

  // 5. Rodapé do app
  detailsParts.push(`📱 Gerenciado pelo LiLouPro — Gestão de Louvor & Culto\nhttps://liloupro.app`);

  const details = detailsParts.join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Abre o Google Agenda em nova aba com o evento pré-preenchido.
 */
export function openGoogleCalendar(service: any, options: CalendarEventOptions = {}): void {
  const url = generateGoogleCalendarUrl(service, options);
  if (!url) return;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
