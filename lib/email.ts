import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export async function sendEmail({ to, subject, body, html }: SendEmailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: body,
    html: html || body.replace(/\n/g, "<br>"),
  });

  return info;
}
