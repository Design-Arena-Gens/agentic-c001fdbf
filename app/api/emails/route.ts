import { NextResponse } from 'next/server';
import { fetchEmailsFromIMAP } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const emails = await fetchEmailsFromIMAP();
    return NextResponse.json({ emails });
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch emails' }, { status: 500 });
  }
}
