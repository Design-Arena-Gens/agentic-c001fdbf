import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), '.env.local');

export async function GET() {
  try {
    const exists = fs.existsSync(CONFIG_FILE);
    return NextResponse.json({ configured: exists });
  } catch (error) {
    return NextResponse.json({ configured: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    const envContent = `ANTHROPIC_API_KEY=${config.anthropicKey}
EMAIL_HOST=${config.emailHost}
EMAIL_PORT=${config.emailPort}
EMAIL_USER=${config.emailUser}
EMAIL_PASSWORD=${config.emailPassword}
SMTP_HOST=${config.smtpHost}
SMTP_PORT=${config.smtpPort}
AUTO_REPLY_ENABLED=${config.autoReplyEnabled}
`;

    fs.writeFileSync(CONFIG_FILE, envContent);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
