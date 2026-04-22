import {NextResponse} from 'next/server';
import {leadSchema} from '@/lib/schemas';
import {getServerClient} from '@/lib/supabase';
import {renderReport, sendEmail} from '@/lib/mailer';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({error: 'invalid'}, {status: 400});

  const supabase = await getServerClient();
  if (supabase) {
    const {error} = await supabase.from('leads').insert({
      type: 'tool',
      tool: parsed.data.tool,
      email: parsed.data.email,
      payload: parsed.data.payload ?? null,
      created_at: new Date().toISOString()
    });
    if (error) return NextResponse.json({error: 'db'}, {status: 500});
  } else {
    console.log('[lead] (stub — no Supabase configured)', parsed.data);
  }

  const {subject, html, attachments} = renderReport(parsed.data.tool, parsed.data.payload ?? {});
  const mail = await sendEmail({to: parsed.data.email, subject, html, attachments});

  return NextResponse.json({ok: true, emailed: mail.ok && !mail.skipped});
}
