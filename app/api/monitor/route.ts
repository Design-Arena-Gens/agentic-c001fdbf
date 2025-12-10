import { NextResponse } from 'next/server';
import { fetchEmailsFromIMAP } from '@/lib/email';
import { generateDraftReply, isBasicEmail } from '@/lib/ai';
import { sendEmailReply } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const emails = await fetchEmailsFromIMAP();
    const autoReplyEnabled = process.env.AUTO_REPLY_ENABLED === 'true';

    let autoReplied = 0;

    if (autoReplyEnabled && emails.length > 0) {
      for (const email of emails) {
        if (!email.replied && !email.draft) {
          const draft = await generateDraftReply(email);
          email.draft = draft;

          const isBasic = await isBasicEmail(email);
          if (isBasic) {
            await sendEmailReply(email);
            email.replied = true;
            autoReplied++;
          }
        }
      }
    }

    return NextResponse.json({
      newEmails: emails.length,
      autoReplied,
    });
  } catch (error: any) {
    console.error('Error monitoring emails:', error);
    return NextResponse.json({ error: error.message || 'Monitoring failed' }, { status: 500 });
  }
}
