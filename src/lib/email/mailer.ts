import nodemailer from 'nodemailer'

export class EmailNotConfiguredError extends Error {
  constructor(message = 'Email is not configured') {
    super(message)
    this.name = 'EmailNotConfiguredError'
  }
}

let cachedTransport: nodemailer.Transporter | null = null

// Sends through the same SMTP server already configured for Supabase Auth
// emails (Project Settings -> Auth -> SMTP Settings) -- Supabase itself has
// no API for sending arbitrary custom emails, only its own auth templates,
// so this talks to that SMTP server directly. Mirrors the
// StripeNotConfiguredError/WalletNotConfiguredError pattern: missing env
// vars fail cleanly at request time instead of crashing at import time.
function getTransport(): nodemailer.Transporter {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !port || !user || !pass) throw new EmailNotConfiguredError()

  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    })
  }
  return cachedTransport
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const from = process.env.SMTP_FROM
  if (!from) throw new EmailNotConfiguredError('SMTP_FROM is not configured')

  const transport = getTransport()
  await transport.sendMail({ from, to, subject, html })
}
