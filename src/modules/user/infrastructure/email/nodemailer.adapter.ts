import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../../../../config/env';
import { MailerPort } from '../../domain/ports/mailer.port';

export class NodemailerAdapter implements MailerPort {
    private readonly transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_PORT === 465,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
        });
    }

    async sendVerificationEmail(to: string, token: string): Promise<void> {
        const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;

        await this.transporter.sendMail({
            from: env.SMTP_FROM,
            to,
            subject: 'Verifica tu correo electrónico',
            html: `
                <h2>Bienvenido a Nexo</h2>
                <p>Haz clic en el siguiente enlace para verificar tu correo. El enlace expira en 60 minutos.</p>
                <a href="${link}">${link}</a>
            `,
        });
    }

    async sendPasswordResetEmail(to: string, token: string): Promise<void> {
        const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;

        await this.transporter.sendMail({
            from: env.SMTP_FROM,
            to,
            subject: 'Restablecer contraseña',
            html: `
                <h2>Solicitud de cambio de contraseña</h2>
                <p>Haz clic en el siguiente enlace para restablecer tu contraseña. El enlace expira en 60 minutos.</p>
                <a href="${link}">${link}</a>
                <p>Si no solicitaste este cambio, ignora este correo.</p>
            `,
        });
    }
}
