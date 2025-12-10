'use client';

import { useState, useEffect } from 'react';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: Date;
  draft?: string;
  replied?: boolean;
}

export default function Home() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [config, setConfig] = useState({
    emailHost: '',
    emailPort: '993',
    emailUser: '',
    emailPassword: '',
    smtpHost: '',
    smtpPort: '587',
    anthropicKey: '',
    autoReplyEnabled: false
  });
  const [monitoring, setMonitoring] = useState(false);
  const [status, setStatus] = useState('');

  const checkConfig = async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    setConfigured(data.configured);
  };

  useEffect(() => {
    checkConfig();
  }, []);

  const saveConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setConfigured(true);
        setStatus('Configuration saved successfully!');
      } else {
        setStatus('Failed to save configuration');
      }
    } catch (error) {
      setStatus('Error saving configuration');
    }
    setLoading(false);
  };

  const fetchEmails = async () => {
    setLoading(true);
    setStatus('Fetching emails...');
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      if (data.error) {
        setStatus(`Error: ${data.error}`);
      } else {
        setEmails(data.emails || []);
        setStatus(`Fetched ${data.emails?.length || 0} emails`);
      }
    } catch (error) {
      setStatus('Error fetching emails');
    }
    setLoading(false);
  };

  const generateDraft = async (emailId: string) => {
    setStatus(`Generating draft for email ${emailId}...`);
    try {
      const res = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId })
      });
      const data = await res.json();
      if (data.draft) {
        setEmails(prev => prev.map(e =>
          e.id === emailId ? { ...e, draft: data.draft } : e
        ));
        setStatus('Draft generated successfully!');
      } else {
        setStatus('Failed to generate draft');
      }
    } catch (error) {
      setStatus('Error generating draft');
    }
  };

  const sendReply = async (emailId: string) => {
    setStatus(`Sending reply for email ${emailId}...`);
    try {
      const res = await fetch('/api/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId })
      });
      const data = await res.json();
      if (data.success) {
        setEmails(prev => prev.map(e =>
          e.id === emailId ? { ...e, replied: true } : e
        ));
        setStatus('Reply sent successfully!');
      } else {
        setStatus('Failed to send reply');
      }
    } catch (error) {
      setStatus('Error sending reply');
    }
  };

  const startMonitoring = async () => {
    setMonitoring(true);
    setStatus('Monitoring started. Checking for new emails every 30 seconds...');

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/monitor');
        const data = await res.json();
        if (data.newEmails > 0) {
          setStatus(`Found ${data.newEmails} new emails!`);
          fetchEmails();
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  };

  if (!configured) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Email Agent Configuration</h1>
        <div style={styles.form}>
          <h2 style={styles.subtitle}>Email Settings (IMAP)</h2>
          <input
            style={styles.input}
            placeholder="IMAP Host (e.g., imap.gmail.com)"
            value={config.emailHost}
            onChange={e => setConfig({...config, emailHost: e.target.value})}
          />
          <input
            style={styles.input}
            placeholder="IMAP Port (usually 993)"
            value={config.emailPort}
            onChange={e => setConfig({...config, emailPort: e.target.value})}
          />
          <input
            style={styles.input}
            placeholder="Email Address"
            value={config.emailUser}
            onChange={e => setConfig({...config, emailUser: e.target.value})}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Email Password / App Password"
            value={config.emailPassword}
            onChange={e => setConfig({...config, emailPassword: e.target.value})}
          />

          <h2 style={styles.subtitle}>SMTP Settings</h2>
          <input
            style={styles.input}
            placeholder="SMTP Host (e.g., smtp.gmail.com)"
            value={config.smtpHost}
            onChange={e => setConfig({...config, smtpHost: e.target.value})}
          />
          <input
            style={styles.input}
            placeholder="SMTP Port (usually 587)"
            value={config.smtpPort}
            onChange={e => setConfig({...config, smtpPort: e.target.value})}
          />

          <h2 style={styles.subtitle}>AI Settings</h2>
          <input
            style={styles.input}
            type="password"
            placeholder="Anthropic API Key"
            value={config.anthropicKey}
            onChange={e => setConfig({...config, anthropicKey: e.target.value})}
          />

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.autoReplyEnabled}
              onChange={e => setConfig({...config, autoReplyEnabled: e.target.checked})}
            />
            Enable automatic replies for basic emails
          </label>

          <button style={styles.button} onClick={saveConfig} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
          {status && <p style={styles.status}>{status}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Email Agent Dashboard</h1>

      <div style={styles.controls}>
        <button style={styles.button} onClick={fetchEmails} disabled={loading}>
          Fetch Emails
        </button>
        <button
          style={monitoring ? styles.buttonDanger : styles.button}
          onClick={() => monitoring ? setMonitoring(false) : startMonitoring()}
        >
          {monitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
        <button style={styles.buttonSecondary} onClick={() => setConfigured(false)}>
          Settings
        </button>
      </div>

      {status && <p style={styles.status}>{status}</p>}

      <div style={styles.emailList}>
        {emails.length === 0 && !loading && (
          <p style={styles.emptyState}>No emails loaded. Click "Fetch Emails" to get started.</p>
        )}

        {emails.map((email) => (
          <div key={email.id} style={styles.emailCard}>
            <div style={styles.emailHeader}>
              <strong>From:</strong> {email.from}
            </div>
            <div style={styles.emailSubject}>
              <strong>Subject:</strong> {email.subject}
            </div>
            <div style={styles.emailDate}>
              {new Date(email.date).toLocaleString()}
            </div>
            <div style={styles.emailBody}>
              {email.body.substring(0, 200)}...
            </div>

            {email.draft && (
              <div style={styles.draft}>
                <strong>Draft Reply:</strong>
                <div style={styles.draftText}>{email.draft}</div>
              </div>
            )}

            <div style={styles.emailActions}>
              {!email.draft && (
                <button
                  style={styles.buttonSmall}
                  onClick={() => generateDraft(email.id)}
                >
                  Generate Draft
                </button>
              )}
              {email.draft && !email.replied && (
                <button
                  style={styles.buttonSmallSuccess}
                  onClick={() => sendReply(email.id)}
                >
                  Send Reply
                </button>
              )}
              {email.replied && (
                <span style={styles.repliedBadge}>✓ Replied</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '20px',
    color: '#333',
  },
  subtitle: {
    fontSize: '1.5rem',
    marginTop: '20px',
    marginBottom: '10px',
    color: '#555',
  },
  form: {
    backgroundColor: '#f9f9f9',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  checkbox: {
    display: 'block',
    marginBottom: '20px',
    fontSize: '1rem',
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    padding: '12px 24px',
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  buttonDanger: {
    padding: '12px 24px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  buttonSmall: {
    padding: '8px 16px',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  buttonSmallSuccess: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  status: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#e7f3ff',
    borderRadius: '4px',
    color: '#0070f3',
  },
  emailList: {
    marginTop: '20px',
  },
  emptyState: {
    textAlign: 'center',
    color: '#999',
    fontSize: '1.1rem',
    padding: '40px',
  },
  emailCard: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  emailHeader: {
    marginBottom: '8px',
    fontSize: '1rem',
  },
  emailSubject: {
    marginBottom: '8px',
    fontSize: '1.1rem',
    color: '#333',
  },
  emailDate: {
    fontSize: '0.85rem',
    color: '#999',
    marginBottom: '10px',
  },
  emailBody: {
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '15px',
  },
  draft: {
    backgroundColor: '#f0f8ff',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '15px',
    borderLeft: '4px solid #0070f3',
  },
  draftText: {
    marginTop: '8px',
    whiteSpace: 'pre-wrap',
    color: '#333',
  },
  emailActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  repliedBadge: {
    color: '#28a745',
    fontWeight: 'bold',
  },
};
