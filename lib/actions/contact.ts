"use server";

import { checkRateLimit } from "@/lib/rate-limit";
import type { Locale } from "@/lib/i18n/config";
import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { z } from "zod";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<"name" | "email" | "subject" | "message", string[]>>;
};

export const initialContactFormState: ContactFormState = {
  status: "idle",
  message: "",
};

const contactSchema = z.object({
  locale: z.enum(["id", "en"]),
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0),
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function copy(locale: Locale) {
  return locale === "id"
    ? {
        invalid: "Periksa kembali isian formulir.",
        limited: "Terlalu banyak pesan dikirim. Silakan coba lagi dalam 15 menit.",
        unavailable: "Layanan email belum tersedia. Silakan hubungi melalui alamat email yang tercantum.",
        failed: "Pesan belum dapat dikirim. Silakan coba kembali.",
        success: "Pesan berhasil dikirim. Terima kasih telah menghubungi kami.",
      }
    : {
        invalid: "Please review the form fields.",
        limited: "Too many messages have been sent. Please try again in 15 minutes.",
        unavailable: "The email service is not available yet. Please use the listed email address.",
        failed: "Your message could not be sent. Please try again.",
        success: "Your message has been sent. Thank you for getting in touch.",
      };
}

export async function sendContactMessage(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    locale: formData.get("locale"),
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website") || "",
  });
  const locale: Locale = formData.get("locale") === "en" ? "en" : "id";
  const labels = copy(locale);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: labels.invalid,
      errors: {
        name: flattened.name,
        email: flattened.email,
        subject: flattened.subject,
        message: flattened.message,
      },
    };
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || requestHeaders.get("x-real-ip") || "unknown";
  const rateLimit = await checkRateLimit(`contact:${ip}`, 5, 15 * 60 * 1000);
  if (!rateLimit.success) {
    return { status: "error", message: labels.limited };
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.CONTACT_TO_EMAIL || "budi.rahman@uinjkt.ac.id";
  const from = process.env.SMTP_FROM_EMAIL || user;
  if (!host || !user || !pass || !from) {
    return { status: "error", message: labels.unavailable };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
    const { name, email, subject, message } = parsed.data;
    await transporter.sendMail({
      from,
      to,
      replyTo: email,
      subject: `[BRH Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      html: `
        <h2>New message from brh.co.id</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <hr />
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      `,
    });
    return { status: "success", message: labels.success };
  } catch (error) {
    console.error("Contact form email error:", error);
    return { status: "error", message: labels.failed };
  }
}
