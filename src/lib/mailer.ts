type Attachment = {filename: string; content: string; content_type?: string};

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
};

export async function sendEmail({to, subject, html, attachments}: SendArgs): Promise<{ok: boolean; skipped?: boolean; error?: string}> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? 'no-reply@2erre.online';
  if (!key) {
    console.log('[mailer] RESEND_API_KEY missing — skip send', {to, subject});
    return {ok: true, skipped: true};
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({from, to, subject, html, attachments})
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[mailer] resend error', res.status, text);
      return {ok: false, error: text};
    }
    return {ok: true};
  } catch (e) {
    console.error('[mailer] fetch failed', e);
    return {ok: false, error: String(e)};
  }
}

function eur(n: number) {
  return new Intl.NumberFormat('it-IT', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0}).format(n);
}

export function renderReport(tool: string, payload: Record<string, unknown>): {subject: string; html: string; attachments?: Attachment[]} {
  const brand = '2erre SRL';
  if (tool === 'paycheck') {
    const r = payload.result as {netMonthly: number; netAnnual: number; irpefAnnual: number; inpsAnnual: number; employerCost: number};
    return {
      subject: `${brand} · Report busta paga`,
      html: `
        <div style="font-family:Inter,system-ui,Arial,sans-serif;background:#050507;color:#e7e7ea;padding:32px">
          <h2 style="margin:0 0 8px">Report busta paga</h2>
          <p style="color:#9aa">Stima indicativa per RAL ${eur(Number(payload.gross))} · ${payload.months} mensilità</p>
          <table style="margin-top:16px;width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;border-bottom:1px solid #222">Netto mensile</td><td align="right"><b>${eur(r.netMonthly)}</b></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #222">Netto annuale</td><td align="right">${eur(r.netAnnual)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #222">IRPEF annuale</td><td align="right">${eur(r.irpefAnnual)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #222">INPS annuale</td><td align="right">${eur(r.inpsAnnual)}</td></tr>
            <tr><td style="padding:8px 0">Costo azienda</td><td align="right"><b>${eur(r.employerCost)}</b></td></tr>
          </table>
          <p style="color:#888;font-size:12px;margin-top:24px">Stima non vincolante — per un calcolo personalizzato contatta 2erre.</p>
        </div>
      `
    };
  }
  if (tool === 'quote') {
    const r = payload.result as {min: number; max: number; weeks: number};
    return {
      subject: `${brand} · Stima preventivo`,
      html: `
        <div style="font-family:Inter,system-ui,Arial,sans-serif;background:#050507;color:#e7e7ea;padding:32px">
          <h2 style="margin:0 0 8px">Stima preventivo</h2>
          <p style="color:#9aa">${payload.type} · ${payload.complexity} · ${payload.urgency} · integrazioni: ${payload.integrations}</p>
          <div style="font-size:28px;font-weight:600;margin-top:16px">${eur(r.min)} — ${eur(r.max)}</div>
          <div style="color:#7ee7d6;margin-top:4px">~${r.weeks} settimane</div>
          <p style="color:#888;font-size:12px;margin-top:24px">Stima indicativa — per un preventivo dettagliato contatta 2erre.</p>
        </div>
      `
    };
  }
  if (tool === 'qr') {
    const target = String(payload.target ?? '');
    const dataUrl = typeof payload.dataUrl === 'string' ? payload.dataUrl : '';
    const base64 = dataUrl.startsWith('data:image/png;base64,') ? dataUrl.slice('data:image/png;base64,'.length) : '';
    const attachments: Attachment[] = base64
      ? [{filename: '2erre-qr.png', content: base64, content_type: 'image/png'}]
      : [];
    return {
      subject: `${brand} · Il tuo QR code`,
      html: `
        <div style="font-family:Inter,system-ui,Arial,sans-serif;background:#050507;color:#e7e7ea;padding:32px">
          <h2 style="margin:0 0 8px">Il tuo QR code</h2>
          <p style="color:#9aa">Destinazione: ${target}</p>
          <p style="color:#e7e7ea;margin-top:16px">Il QR è allegato a questa email come <b>2erre-qr.png</b>.</p>
          <p style="color:#888;font-size:12px;margin-top:24px">Generato con 2erre · tools.</p>
        </div>
      `,
      attachments
    };
  }
  return {
    subject: `${brand} · Report ${tool}`,
    html: `<pre style="font-family:monospace">${JSON.stringify(payload, null, 2)}</pre>`
  };
}
