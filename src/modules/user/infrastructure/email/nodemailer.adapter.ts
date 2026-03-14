
import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../../../../config/env';
import { MailerPort } from '../../domain/ports/mailer.port';
import { readFileSync } from 'fs';
import { join } from 'path';


export class NodemailerAdapter implements MailerPort {
    private readonly transporter: Transporter;
    private readonly verificationTemplate: string;
    private readonly resetPasswordTemplate: string;

    constructor() {
        this.transporter = nodemailer.createTransport(
            env.NODE_ENV === 'test'
                ? ({ jsonTransport: true } as Parameters<typeof nodemailer.createTransport>[0])
                : {
                    host: env.SMTP_HOST,
                    port: env.SMTP_PORT,
                    secure: env.SMTP_PORT === 465,
                    auth: {
                        user: env.SMTP_USER,
                        pass: env.SMTP_PASS,
                    },
                },
        );
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
        await this.transporter.sendMail({
            from: env.SMTP_FROM,
            to,
            subject: 'Verifica tu correo electrónico – Nexo',
            html,
        });
    }

    async sendPasswordResetEmail(to: string, token: string): Promise<void> {
        const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
        const html = this.render(this.resetPasswordTemplate, {
            link,
            year: new Date().getFullYear(),
        });
        await this.transporter.sendMail({
            from: env.SMTP_FROM,
            to,
            subject: 'Restablecer contraseña – Nexo',
            html,
        });
    }
}
