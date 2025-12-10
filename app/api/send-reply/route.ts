import { NextRequest, NextResponse } from 'next/server';
import { sendEmailReply } from '@/lib/email';
import { getEmailById } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { emailId } = await request.json();
    const email = await getEmailById(emailId);

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    if (!email.draft) {
      return NextResponse.json({ error: 'No draft available' }, { status: 400 });
    }

    await sendEmailReply(email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending reply:', error);
    return NextResponse.json({ error: error.message || 'Failed to send reply' }, { status: 500 });
  }
}
