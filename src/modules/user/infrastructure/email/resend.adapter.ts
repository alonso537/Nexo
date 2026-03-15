import { Resend } from 'resend';
import { env } from '../../../../config/env';
import { MailerPort } from '../../domain/ports/mailer.port';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppError } from '../../../../shared/domain/errors/AppError';

export class ResendAdapter implements MailerPort {
  private readonly client: Resend;
  private readonly verificationTemplate: string;
  private readonly resetPasswordTemplate: string;

  constructor() {
    this.client = new Resend(env.SMTP_PASS); // SMTP_PASS = Resend API Key
    this.verificationTemplate = readFileSync(
      join(__dirname, 'templates', 'verification.html'),
      'utf8',
    );
    this.resetPasswordTemplate = readFileSync(
      join(__dirname, 'templates', 'reset-password.html'),
      'utf8',
    );
  }

  private render(template: string, vars: Record<string, string | number>): string {
    return template
      .replace(/{{\s*link\s*}}/g, String(vars.link))
      .replace(/{{\s*year\s*}}/g, String(vars.year));
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = this.render(this.verificationTemplate, {
      link,
      year: new Date().getFullYear(),
    });
    const { error } = await this.client.emails.send({
      from: env.SMTP_FROM,
      to,
      subject: 'Verifica tu correo electrónico – Nexo',
      html,
    });

    if (error) {
      throw new AppError(`Resend error: ${error.message}`, 500, 'EMAIL_SEND_ERROR');
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = this.render(this.resetPasswordTemplate, {
      link,
      year: new Date().getFullYear(),
    });
    const { error } = await this.client.emails.send({
      from: env.SMTP_FROM,
      to,
      subject: 'Restablecer contraseña – Nexo',
      html,
    });

    if (error) {
      throw new AppError(`Resend error: ${error.message}`, 500, 'EMAIL_SEND_ERROR');
    }
  }
}
