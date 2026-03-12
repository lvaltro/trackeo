/**
 * Edge Function: notify-new-lead
 *
 * Se invoca desde un Database Webhook configurado en Supabase:
 *   Tabla: leads  |  Evento: INSERT
 *
 * Variables de entorno requeridas (Supabase > Project > Edge Functions > Secrets):
 *   NOTIFY_EMAIL_TO   → dirección destino, ej: hola@trackeo.cl
 *   RESEND_API_KEY    → API key de Resend (resend.com) — servicio de email gratuito
 *
 * Si prefieres otro proveedor (SendGrid, Mailgun, SMTP relay), cambia
 * únicamente la sección "Enviar email" conservando el resto de la lógica.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    email: string;
    created_at: string;
    [key: string]: unknown;
  };
  schema: string;
}

serve(async (req: Request) => {
  // Supabase Database Webhooks envían un POST con JSON
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Validar secret compartido para evitar llamadas no autorizadas
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
  if (webhookSecret) {
    const authHeader = req.headers.get('x-webhook-secret');
    if (authHeader !== webhookSecret) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Solo procesar inserciones en la tabla leads
  if (payload.type !== 'INSERT' || payload.table !== 'leads') {
    return new Response('Ignored', { status: 200 });
  }

  const { email, created_at } = payload.record;
  const fecha = new Date(created_at).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // ── Enviar email con Resend ──────────────────────────────────────────────
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const notifyTo = Deno.env.get('NOTIFY_EMAIL_TO');

  if (!resendApiKey || !notifyTo) {
    console.warn('Faltan RESEND_API_KEY o NOTIFY_EMAIL_TO. Email no enviado.');
    return new Response(
      JSON.stringify({ ok: false, reason: 'Missing env vars' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const emailBody = {
    from: 'Trackeo Leads <noreply@trackeo.cl>',
    to: [notifyTo],
    subject: '🚀 Nuevo lead registrado en Trackeo',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f0f0f;color:#f5f5f5;border-radius:12px;">
        <h2 style="color:#f59e0b;margin-top:0;">¡Nuevo lead registrado!</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#94a3b8;width:100px;">Email</td>
            <td style="padding:8px 0;font-weight:600;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#94a3b8;">Fecha</td>
            <td style="padding:8px 0;">${fecha}</td>
          </tr>
        </table>
        <hr style="border-color:#ffffff1a;margin:20px 0;" />
        <p style="color:#64748b;font-size:12px;margin:0;">
          Mensaje automático generado por la landing de Trackeo.
        </p>
      </div>
    `,
  };

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify(emailBody),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    console.error('Error enviando email con Resend:', errText);
    return new Response(
      JSON.stringify({ ok: false, error: errText }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const data = await resendRes.json();
  console.log('Email enviado exitosamente:', data);

  return new Response(
    JSON.stringify({ ok: true, emailId: data.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
