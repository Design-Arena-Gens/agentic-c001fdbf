import { NextRequest, NextResponse } from 'next/server';
import { generateDraftReply } from '@/lib/ai';
import { getEmailById } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { emailId } = await request.json();
    const email = await getEmailById(emailId);

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    const draft = await generateDraftReply(email);
    return NextResponse.json({ draft });
  } catch (error: any) {
    console.error('Error generating draft:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate draft' }, { status: 500 });
  }
}
