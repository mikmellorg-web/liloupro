/**
 * Serviço Centralizado de Geração e Envio de E-mails do LiLouPro
 * Suporta modelos HTML responsivos de alta qualidade visual para os eventos do sistema.
 */

export interface EmailTemplatePayload {
  type: 
    | 'welcome_password_definition'
    | 'payment_approved'
    | 'payment_failed'
    | 'subscription_cancelled'
    | 'password_reset'
    | 'subscription_renewed'
    | 'subscription_expiring_warning'
    | 'schedule_report'
    | 'availability_report';
  recipientEmail: string;
  recipientName: string;
  churchName?: string;
  planName?: string;
  startDateFormatted?: string;
  passwordSetupUrl?: string;
  loginUrl?: string;
  whatsappSupportUrl?: string;
  reason?: string;
  reportTitle?: string;
  reportPeriod?: string;
  reportContent?: string;
  serviceDate?: string;
  rosterDetails?: { role: string; members: string }[];
}

export function generateEmailHtml(payload: EmailTemplatePayload): { subject: string; html: string } {
  const brandGreen = '#10b981';
  const brandDark = '#0b1120';
  const supportWhatsapp = payload.whatsappSupportUrl || 'https://wa.me/5511999999999?text=Olá,%20preciso%20de%20suporte%20no%20LiLouPro';
  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://liloupro.com.br';
  const loginUrl = payload.loginUrl || `${appBaseUrl}/login`;

  let subject = 'LiLouPro - Gestão de Louvor e Culto';
  let contentHtml = '';

  switch (payload.type) {
    case 'welcome_password_definition':
      subject = `🎉 Bem-vindo ao LiLouPro! Ativação do ${payload.planName || 'Plano Completo'}`;
      contentHtml = `
        <h2 style="color: #ffffff; font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 12px;">
          Olá, ${payload.recipientName}!
        </h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Parabéns! O pagamento da assinatura do <strong>${payload.planName || 'Plano Completo'}</strong> para a <strong>${payload.churchName || 'sua igreja'}</strong> foi aprovado com sucesso.
        </p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Sua conta já foi criada automaticamente com o e-mail <strong>${payload.recipientEmail}</strong>. Por motivos de segurança, clique no botão abaixo para definir sua senha de acesso exclusiva:
        </p>

        <!-- Botão Principal Definir Senha -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${payload.passwordSetupUrl || '#'}" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #0f172a; font-weight: 900; text-decoration: none; padding: 16px 32px; border-radius: 14px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);">
            🔑 Criar Minha Senha de Acesso
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 10px; margin-bottom: 24px;">
          Este link é único e válido por 24 horas.
        </p>

        <!-- Botões Secundários de Acesso & Suporte -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 20px;">
          <tr>
            <td align="center">
              <a href="${loginUrl}" target="_blank" style="color: #38bdf8; font-size: 13px; font-weight: bold; text-decoration: none; margin-right: 15px;">
                🚀 Acessar o LiLouPro
              </a>
              <a href="${supportWhatsapp}" target="_blank" style="color: #22c55e; font-size: 13px; font-weight: bold; text-decoration: none;">
                💬 Suporte no WhatsApp
              </a>
            </td>
          </tr>
        </table>
      `;
      break;

    case 'payment_approved':
      subject = `✅ Pagamento Aprovado - ${payload.planName || 'LiLouPro'}`;
      contentHtml = `
        <h2 style="color: #ffffff; font-size: 22px; font-weight: 800; margin-top: 0;">
          Assinatura Renovada / Aprovada!
        </h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Olá, ${payload.recipientName}! Confirmamos o recebimento do pagamento referente ao <strong>${payload.planName || 'LiLouPro'}</strong> para a <strong>${payload.churchName || 'sua igreja'}</strong>.
        </p>
        <div style="background-color: #1e293b; border: 1px solid #334155; padding: 16px; border-radius: 12px; margin: 20px 0; color: #e2e8f0; font-size: 13px;">
          <strong>Plano Ativo:</strong> ${payload.planName || 'Plano Completo'}<br/>
          <strong>Data de Início:</strong> ${payload.startDateFormatted || new Date().toLocaleDateString('pt-BR')}<br/>
          <strong>Status:</strong> Ativo & Ilimitado
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${loginUrl}" target="_blank" style="background-color: #10b981; color: #0f172a; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 13px; text-transform: uppercase;">
            Acessar Painel da Igreja
          </a>
        </div>
      `;
      break;

    case 'payment_failed':
      subject = `⚠️ Problema na renovação da assinatura - ${payload.churchName || 'LiLouPro'}`;
      contentHtml = `
        <h2 style="color: #f87171; font-size: 20px; font-weight: 800; margin-top: 0;">
          Não conseguimos processar o seu pagamento
        </h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Olá, ${payload.recipientName}. A tentativa de cobrança do <strong>${payload.planName || 'LiLouPro'}</strong> para a <strong>${payload.churchName || 'sua igreja'}</strong> não foi concluída.
        </p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          <strong>Importante: Nenhum dado do seu ministério foi apagado!</strong> Seus membros, músicas e liturgias continuam seguros. Caso precise atualizar os dados do cartão, utilize o link de suporte abaixo.
        </p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${supportWhatsapp}" target="_blank" style="background-color: #ef4444; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 13px;">
            Falar com Suporte de Cobrança
          </a>
        </div>
      `;
      break;

    case 'subscription_cancelled':
      subject = `Aviso de alteração do plano - ${payload.churchName || 'LiLouPro'}`;
      contentHtml = `
        <h2 style="color: #fbbf24; font-size: 20px; font-weight: 800; margin-top: 0;">
          Sua assinatura foi cancelada
        </h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Olá, ${payload.recipientName}. Confirmamos o cancelamento da sua assinatura do <strong>${payload.planName || 'LiLouPro'}</strong>.
        </p>
        <div style="background-color: #1e293b; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0; color: #f1f5f9; font-size: 13px; line-height: 1.6;">
          <strong>Seus dados estão 100% seguros!</strong><br/>
          Sua igreja foi migrada automaticamente para o <strong>Plano Semeadora (Gratuito)</strong>. Nenhuma música, membro ou histórico foi excluído.
        </div>
      `;
      break;

    case 'password_reset':
      subject = `🔑 Redefinição de senha do LiLouPro`;
      contentHtml = `
        <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0;">
          Redefinição de Senha
        </h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Olá, ${payload.recipientName}. Recebemos uma solicitação para redefinir a senha de acesso à conta de e-mail <strong>${payload.recipientEmail}</strong>.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${payload.passwordSetupUrl || '#'}" target="_blank" style="background-color: #10b981; color: #0f172a; font-weight: 900; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 13px; text-transform: uppercase;">
            Redefinir Minha Senha
          </a>
        </div>
      `;
      break;

    case 'schedule_report':
      subject = `📋 Relatório de Escala: ${payload.reportTitle || 'Culto'} - ${payload.serviceDate || ''}`;
      contentHtml = `
        <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0;">
          📋 ${payload.reportTitle || 'Relatório de Escala'}
        </h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Olá, ${payload.recipientName}. Segue o relatório de escala para o culto <strong>${payload.reportTitle || 'Culto'}</strong> em <strong>${payload.serviceDate || ''}</strong>.
        </p>
        <div style="background-color: #1e293b; border: 1px solid #334155; padding: 20px; border-radius: 12px; margin: 20px 0; font-size: 13px; color: #f1f5f9; line-height: 1.6;">
          ${payload.rosterDetails ? payload.rosterDetails.map(r => `<div style="margin-bottom: 8px;"><strong>• ${r.role}:</strong> ${r.members}</div>`).join('') : `<pre style="white-space: pre-wrap; margin:0;">${payload.reportContent || ''}</pre>`}
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${loginUrl}" target="_blank" style="background-color: #10b981; color: #0f172a; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 12px; text-transform: uppercase;">
            Abrir Escala no App
          </a>
        </div>
      `;
      break;

    case 'availability_report':
      subject = `🗓️ Relatório de Disponibilidade de Ministros - ${payload.reportPeriod || ''}`;
      contentHtml = `
        <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0;">
          🗓️ Relatório de Disponibilidade da Equipe
        </h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Olá, ${payload.recipientName}. Aqui está a atualização sobre a disponibilidade dos ministros para <strong>${payload.reportPeriod || 'o mês'}</strong>.
        </p>
        <div style="background-color: #1e293b; border-left: 4px solid #10b981; padding: 18px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #f1f5f9; line-height: 1.6;">
          <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${payload.reportContent || ''}</pre>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${loginUrl}" target="_blank" style="background-color: #10b981; color: #0f172a; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 12px; text-transform: uppercase;">
            Acessar Painel de Escalas
          </a>
        </div>
      `;
      break;

    default:
      contentHtml = `<p style="color: #cbd5e1;">Notificação automática do LiLouPro.</p>`;
  }

  const wrapperHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" max-width="580" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              
              <!-- Header Brand Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #0b1120 0%, #1e293b 100%); padding: 28px; text-align: center; border-b: 1px solid #1e293b;">
                  <div style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                    LiLou<span style="color: #10b981;">pro</span>
                  </div>
                  <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-top: 4px; font-weight: 800;">
                    Plataforma Profissional de Louvor e Culto
                  </div>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 32px 28px;">
                  ${contentHtml}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #0b1120; padding: 20px 28px; text-align: center; border-top: 1px solid #1e293b; color: #64748b; font-size: 11px;">
                  © ${new Date().getFullYear()} LiLouPro — Gestão Inteligente de Louvor e Ministérios de Culto.<br/>
                  Este é um e-mail automático do sistema.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { subject, html: wrapperHtml };
}

export function createMailtoLink(recipientEmail: string, subject: string, body: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`;
}
