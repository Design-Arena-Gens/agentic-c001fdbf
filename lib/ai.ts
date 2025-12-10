import Anthropic from '@anthropic-ai/sdk';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: Date;
  draft?: string;
  replied?: boolean;
}

export async function generateDraftReply(email: Email): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are an AI email assistant. Generate a professional and helpful reply to the following email:

From: ${email.from}
Subject: ${email.subject}

Email body:
${email.body}

Generate a concise, professional reply that addresses the sender's needs or questions. Keep it friendly but professional.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const response = message.content[0];
  return response.type === 'text' ? response.text : '';
}

export async function isBasicEmail(email: Email): Promise<boolean> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Analyze this email and determine if it's a "basic" email that can be safely auto-replied to without human review.

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

A basic email is one that:
- Is a simple inquiry or question with a straightforward answer
- Is a thank you or acknowledgment
- Is a simple confirmation or update
- Does NOT require complex decision-making
- Does NOT involve sensitive topics (legal, financial, personal issues)
- Does NOT contain urgent or critical information

Reply with ONLY "YES" if this is a basic email that can be auto-replied, or "NO" if it requires human review.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 10,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const response = message.content[0];
  const answer = response.type === 'text' ? response.text.trim().toUpperCase() : 'NO';

  return answer === 'YES';
}
