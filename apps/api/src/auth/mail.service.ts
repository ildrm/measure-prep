import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import nodemailer, { Transporter } from "nodemailer";

@Injectable()
export class MailService {
  private readonly transporter?: Transporter;
  constructor() {
    if (!process.env.SMTP_HOST) return;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
  }

  async sendVerification(email: string, token: string) {
    const url = this.link("verify-email", token);
    await this.send(email, "Verify your Measure account", `Verify your Measure account: ${url}`, `<p>Verify your Measure account:</p><p><a href="${url}">Verify email address</a></p><p>This link expires in 24 hours.</p>`);
  }

  async sendPasswordReset(email: string, token: string) {
    const url = this.link("reset-password", token);
    await this.send(email, "Reset your Measure password", `Reset your Measure password: ${url}`, `<p>Reset your Measure password:</p><p><a href="${url}">Choose a new password</a></p><p>This link expires in 30 minutes. Ignore this email if you did not request it.</p>`);
  }

  async verifyConnection() {
    if (!this.transporter) return false;
    await this.transporter.verify(); return true;
  }

  private link(path: string, token: string) {
    const base = (process.env.APP_PUBLIC_URL ?? "http://localhost:3000").replace(/\/$/, "");
    return `${base}/${path}?token=${encodeURIComponent(token)}`;
  }

  private async send(to: string, subject: string, text: string, html: string) {
    if (!this.transporter) {
      if (process.env.NODE_ENV === "production") throw new ServiceUnavailableException("Email delivery is not configured.");
      return;
    }
    await this.transporter.sendMail({ from: process.env.EMAIL_FROM ?? "Measure <no-reply@measure.local>", to, subject, text, html });
  }
}
