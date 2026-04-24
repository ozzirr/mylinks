import {NextResponse} from 'next/server';
import {leadSchema} from '@/lib/schemas';
import {getServerClient} from '@/lib/supabase';
import {renderReport, sendEmail} from '@/lib/mailer';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({error: 'invalid'}, {status: 400});

  const supabase = await getServerClient();
  if (!supabase) {
    console.log('[lead] (stub — no Supabase configured)', parsed.data);
    return NextResponse.json({error: 'unavailable'}, {status: 503});
  }

  const {data: userData, error: userErr} = await supabase.auth.getUser();
  if (userErr || !userData.user?.email) {
    return NextResponse.json({error: 'unauthorized'}, {status: 401});
  }

  // Only allow sending to the authenticated user's email.
  const recipient = userData.user.email;

  const {error} = await supabase.from('leads').insert({
    type: 'tool',
    tool: parsed.data.tool,
    email: recipient,
    payload: parsed.data.payload ?? null,
    created_at: new Date().toISOString()
  });
  if (error) return NextResponse.json({error: 'db'}, {status: 500});

  const {subject, html, attachments} = renderReport(parsed.data.tool, parsed.data.payload ?? {});
  const mail = await sendEmail({to: recipient, subject, html, attachments});

  return NextResponse.json({ok: true, emailed: mail.ok && !mail.skipped});
}
