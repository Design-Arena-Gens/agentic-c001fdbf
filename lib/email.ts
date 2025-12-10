import Imap from 'imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: Date;
  draft?: string;
  replied?: boolean;
}

let emailCache: Email[] = [];

export async function fetchEmailsFromIMAP(): Promise<Email[]> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASSWORD || '',
      host: process.env.EMAIL_HOST || '',
      port: parseInt(process.env.EMAIL_PORT || '993'),
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    const emails: Email[] = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Fetch last 20 emails
        const fetchRange = `${Math.max(1, box.messages.total - 19)}:${box.messages.total}`;

        if (box.messages.total === 0) {
          imap.end();
          resolve([]);
          return;
        }

        const f = imap.seq.fetch(fetchRange, {
          bodies: '',
          struct: true,
        });

        f.on('message', (msg, seqno) => {
          msg.on('body', (stream: any, info) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) {
                console.error('Parse error:', err);
                return;
              }

              const email: Email = {
                id: `${seqno}`,
                from: parsed.from?.text || 'Unknown',
                subject: parsed.subject || 'No Subject',
                body: parsed.text || parsed.html || 'No content',
                date: parsed.date || new Date(),
              };

              emails.push(email);
            });
          });
        });

        f.once('error', (err) => {
          reject(err);
        });

        f.once('end', () => {
          imap.end();
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.once('end', () => {
      emailCache = emails.sort((a, b) => b.date.getTime() - a.date.getTime());
      resolve(emailCache);
    });

    imap.connect();
  });
}

export async function getEmailById(id: string): Promise<Email | undefined> {
  if (emailCache.length === 0) {
    await fetchEmailsFromIMAP();
  }
  return emailCache.find((e) => e.id === id);
}

export async function sendEmailReply(email: Email): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const recipientEmail = email.from.match(/<(.+)>/)?.[1] || email.from;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: `Re: ${email.subject}`,
    text: email.draft,
  });
}
