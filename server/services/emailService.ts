import nodemailer from 'nodemailer';
import type { Company } from '@shared/schema';

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
}

export interface CustomDomainEmailData {
  companyName: string;
  companyEmail: string;
  requestedDomain: string;
  currentDomain?: string;
  status: 'approved' | 'rejected';
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config = this.getConfig();

    if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
      console.warn('⚠️ [EMAIL] SMTP não configurado. Emails não serão enviados.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure, // true for 465, false for other ports
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword,
        },
      });

      console.log('✅ [EMAIL] Transporter SMTP configurado com sucesso');
    } catch (error) {
      console.error('❌ [EMAIL] Erro ao configurar SMTP:', error);
    }
  }

  private getConfig(): EmailConfig {
    return {
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER || '',
      smtpPassword: process.env.SMTP_PASSWORD || '',
      smtpSecure: process.env.SMTP_SECURE === 'true',
      fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@example.com',
      fromName: process.env.SMTP_FROM_NAME || 'Sistema Multi-Empresa',
    };
  }

  async sendCustomDomainApprovedEmail(data: CustomDomainEmailData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('⚠️ [EMAIL] Transporter não configurado. Email não enviado.');
      return false;
    }

    const config = this.getConfig();

    const htmlContent = this.getApprovedEmailTemplate(data);

    try {
      await this.transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: data.companyEmail,
        subject: 'Domínio Customizado Aprovado ✅',
        html: htmlContent,
      });

      console.log(`✅ [EMAIL] Email de aprovação enviado para ${data.companyEmail}`);
      return true;
    } catch (error) {
      console.error('❌ [EMAIL] Erro ao enviar email de aprovação:', error);
      return false;
    }
  }

  async sendCustomDomainRejectedEmail(data: CustomDomainEmailData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('⚠️ [EMAIL] Transporter não configurado. Email não enviado.');
      return false;
    }

    const config = this.getConfig();

    const htmlContent = this.getRejectedEmailTemplate(data);

    try {
      await this.transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: data.companyEmail,
        subject: 'Solicitação de Domínio Customizado Rejeitada',
        html: htmlContent,
      });

      console.log(`✅ [EMAIL] Email de rejeição enviado para ${data.companyEmail}`);
      return true;
    } catch (error) {
      console.error('❌ [EMAIL] Erro ao enviar email de rejeição:', error);
      return false;
    }
  }

  async sendCustomEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      console.warn('⚠️ [EMAIL] Transporter não configurado. Email não enviado.');
      return false;
    }

    const config = this.getConfig();

    try {
      await this.transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to,
        subject,
        html,
      });

      console.log(`✅ [EMAIL] Email customizado enviado para ${to}`);
      return true;
    } catch (error) {
      console.error('❌ [EMAIL] Erro ao enviar email customizado:', error);
      return false;
    }
  }

  private getApprovedEmailTemplate(data: CustomDomainEmailData): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Domínio Aprovado</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .success-badge {
      display: inline-block;
      background: #22c55e;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    h1 {
      color: #1e293b;
      font-size: 24px;
      margin: 0 0 16px 0;
    }
    .domain-box {
      background: #f1f5f9;
      border-left: 4px solid #22c55e;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .domain-box strong {
      color: #0f172a;
      font-size: 18px;
    }
    .info-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 16px;
      margin: 24px 0;
      border-radius: 6px;
    }
    .info-box h3 {
      margin: 0 0 8px 0;
      color: #1e40af;
      font-size: 16px;
    }
    .info-box p {
      margin: 4px 0;
      color: #1e40af;
      font-size: 14px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 16px 0;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-badge">✅ APROVADO</div>
      <h1>Domínio Customizado Conectado!</h1>
      <p>Olá, <strong>${data.companyName}</strong></p>
    </div>

    <p>Temos uma ótima notícia! Seu domínio customizado foi aprovado e está ativo.</p>

    <div class="domain-box">
      <strong>🌐 ${data.requestedDomain}</strong>
      <p style="margin: 8px 0 0 0; color: #64748b;">Seu novo domínio está funcionando!</p>
    </div>

    ${data.currentDomain ? `
    <div class="info-box">
      <h3>📋 Informações</h3>
      <p><strong>Domínio anterior:</strong> ${data.currentDomain}</p>
      <p><strong>Novo domínio:</strong> ${data.requestedDomain}</p>
      <p><strong>Status:</strong> Conectado e funcionando</p>
    </div>
    ` : ''}

    <p>Seu site agora está acessível através do novo domínio. Todos os acessos serão automaticamente direcionados para o domínio customizado.</p>

    <div class="footer">
      <p>Este é um email automático, por favor não responda.</p>
      <p>&copy; ${new Date().getFullYear()} Sistema Multi-Empresa. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private getRejectedEmailTemplate(data: CustomDomainEmailData): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitação Rejeitada</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8fafc;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .rejected-badge {
      display: inline-block;
      background: #ef4444;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    h1 {
      color: #1e293b;
      font-size: 24px;
      margin: 0 0 16px 0;
    }
    .domain-box {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .domain-box strong {
      color: #991b1b;
      font-size: 18px;
    }
    .info-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: 16px;
      margin: 24px 0;
      border-radius: 6px;
    }
    .info-box h3 {
      margin: 0 0 8px 0;
      color: #92400e;
      font-size: 16px;
    }
    .info-box p {
      margin: 4px 0;
      color: #78350f;
      font-size: 14px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    ul {
      margin: 16px 0;
      padding-left: 24px;
    }
    li {
      margin: 8px 0;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="rejected-badge">❌ REJEITADO</div>
      <h1>Solicitação de Domínio Rejeitada</h1>
      <p>Olá, <strong>${data.companyName}</strong></p>
    </div>

    <p>Infelizmente, sua solicitação de domínio customizado não pôde ser aprovada neste momento.</p>

    <div class="domain-box">
      <strong>🌐 ${data.requestedDomain}</strong>
      <p style="margin: 8px 0 0 0; color: #64748b;">Domínio solicitado</p>
    </div>

    <div class="info-box">
      <h3>⚠️ Motivos comuns para rejeição:</h3>
      <ul>
        <li>DNS não configurado corretamente</li>
        <li>Domínio já está em uso por outra empresa</li>
        <li>Domínio não aponta para nossos servidores</li>
        <li>Problemas de verificação de propriedade</li>
      </ul>
    </div>

    ${data.currentDomain ? `
    <p><strong>Seu domínio atual permanece ativo:</strong> ${data.currentDomain}</p>
    ` : ''}

    <p>Se você acredita que houve um erro ou deseja mais informações, entre em contato com nosso suporte.</p>

    <div class="footer">
      <p>Este é um email automático, por favor não responda.</p>
      <p>&copy; ${new Date().getFullYear()} Sistema Multi-Empresa. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}
