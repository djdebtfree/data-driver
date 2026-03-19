import { useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import './App.css';

/* ─── Verification data points ─── */
interface CheckPoint {
  label: string;
  pass: boolean;
  status: 'pending' | 'checking' | 'done';
}

const CHECKS: { label: string; pass: boolean }[] = [
  { label: 'First name', pass: true },
  { label: 'Last name', pass: true },
  { label: 'Email deliverability', pass: true },
  { label: 'Phone connection', pass: true },
  { label: 'Company / agency', pass: false },
  { label: 'Title / role', pass: true },
  { label: 'Location match', pass: true },
  { label: 'License status', pass: false },
  { label: 'LinkedIn profile', pass: true },
  { label: 'Industry vertical', pass: true },
  { label: 'Company size', pass: false },
  { label: 'Years in role', pass: true },
  { label: 'Email engagement', pass: true },
  { label: 'Phone connection rate', pass: false },
  { label: 'Intent signals', pass: true },
];

const STATUS_TEXT: Record<string, string> = {
  'First name': 'verified',
  'Last name': 'verified',
  'Email deliverability': 'verified',
  'Phone connection': 'connected',
  'Company / agency': 'not found',
  'Title / role': 'found',
  'Location match': 'confirmed',
  'License status': 'unavailable',
  'LinkedIn profile': 'found',
  'Industry vertical': 'insurance',
  'Company size': 'not found',
  'Years in role': '5+ years',
  'Email engagement': 'active',
  'Phone connection rate': 'below threshold',
  'Intent signals': 'high intent',
};

/* ─── SVG Icons ─── */
function RadarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="12" x2="12" y2="2" stroke="#39FF14" strokeWidth="2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#00D4A7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" />
      <polyline points="9 12 11 14 15 10" stroke="#39FF14" strokeWidth="2" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#007BFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="#39FF14" />
      <path d="M16 3.13a4 4 0 010 7.75" stroke="#39FF14" />
    </svg>
  );
}

/* ─── Score Circle ─── */
function ScoreCircle({ passed, total }: { passed: number; total: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const pct = passed / total;
  const offset = circumference * (1 - pct);

  return (
    <div className="score-circle">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#007BFF" />
            <stop offset="25%" stopColor="#00C2FF" />
            <stop offset="50%" stopColor="#00D4A7" />
            <stop offset="75%" stopColor="#39FF14" />
            <stop offset="100%" stopColor="#F5FF00" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={radius} className="score-circle-bg" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          className="score-circle-fill"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-text">
        <span className="score-number">{passed}/{total}</span>
        <span className="score-label">Verified</span>
      </div>
    </div>
  );
}

/* ─── Main App ─── */
function App() {
  const demoRef = useRef<HTMLDivElement>(null);

  /* Demo form state */
  const [demoForm, setDemoForm] = useState({ name: '', email: '', phone: '', state: '' });
  const [checks, setChecks] = useState<CheckPoint[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);

  /* Waitlist state */
  const [waitlistForm, setWaitlistForm] = useState({ name: '', email: '', company: '' });
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  const scrollToDemo = useCallback(() => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* Run simulated verification */
  const runVerification = useCallback(async () => {
    setIsVerifying(true);
    setVerificationDone(false);

    const initial: CheckPoint[] = CHECKS.map((c) => ({
      label: c.label,
      pass: c.pass,
      status: 'pending' as const,
    }));
    setChecks(initial);

    for (let i = 0; i < CHECKS.length; i++) {
      // Set to "checking"
      setChecks((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'checking' } : item))
      );

      // Random delay 200-400ms
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));

      // Set to "done"
      setChecks((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'done' } : item))
      );
    }

    setIsVerifying(false);
    setVerificationDone(true);
  }, []);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.name || !demoForm.email) return;
    runVerification();
  };

  /* Waitlist submission */
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistForm.name || !waitlistForm.email) return;

    setWaitlistSubmitting(true);
    setWaitlistError('');

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('data_driver_leads').insert({
          name: waitlistForm.name,
          email: waitlistForm.email,
          company: waitlistForm.company || null,
        });
        if (error) throw error;
      }
      setWaitlistSuccess(true);
    } catch (err: unknown) {
      console.error('Waitlist error:', err);
      // Graceful degradation — show success even if Supabase fails
      if (!isSupabaseConfigured) {
        setWaitlistSuccess(true);
      } else {
        setWaitlistError('Something went wrong. Please try again.');
      }
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const passed = checks.filter((c) => c.pass && c.status === 'done').length;
  const failed = checks.filter((c) => !c.pass && c.status === 'done').length;

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="hero">
        <h1>Stop Chasing Dead Leads</h1>
        <div className="rainbow-line" />
        <p>
          Data Driver verifies intent signals before you waste a single call.
          See it work — free.
        </p>
        <button className="hero-cta" onClick={scrollToDemo}>
          Try the Verification Demo
        </button>
      </section>

      {/* ─── DEMO ─── */}
      <section className="demo-section" ref={demoRef} id="demo">
        <h2>Interactive Verification Demo</h2>
        <div className="rainbow-line" />
        <p className="demo-subtitle">
          Enter any contact info. We'll show you what real-time data verification looks like.
        </p>

        {!isVerifying && !verificationDone && (
          <form className="demo-form" onSubmit={handleDemoSubmit}>
            <input
              type="text"
              placeholder="Full name"
              value={demoForm.name}
              onChange={(e) => setDemoForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              type="email"
              placeholder="Email address"
              value={demoForm.email}
              onChange={(e) => setDemoForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={demoForm.phone}
              onChange={(e) => setDemoForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <input
              type="text"
              placeholder="State"
              value={demoForm.state}
              onChange={(e) => setDemoForm((f) => ({ ...f, state: e.target.value }))}
            />
            <button type="submit" className="demo-submit">
              Run Verification
            </button>
          </form>
        )}

        {/* Verification animation */}
        {(isVerifying || verificationDone) && (
          <div className="verification-container">
            <div className="verification-header">
              <h3>
                {isVerifying ? 'Verifying contact data...' : 'Verification Complete'}
              </h3>
              <p>Checking against 15 data points</p>
            </div>

            <ul className="check-list">
              {checks.map((check, idx) => (
                <li key={idx} className={`check-item ${check.status}`}>
                  <div className="check-icon">
                    {check.status === 'pending' && <span style={{ color: '#333' }}>●</span>}
                    {check.status === 'checking' && <div className="spinner" />}
                    {check.status === 'done' && (
                      <span className={check.pass ? 'pass' : 'fail'}>
                        {check.pass ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                  <span className="check-label">{check.label}</span>
                  <span
                    className={`check-status ${
                      check.status === 'done'
                        ? check.pass
                          ? 'pass'
                          : 'fail'
                        : check.status === 'checking'
                        ? 'checking-text'
                        : ''
                    }`}
                  >
                    {check.status === 'pending' && ''}
                    {check.status === 'checking' && 'checking...'}
                    {check.status === 'done' && STATUS_TEXT[check.label]}
                  </span>
                </li>
              ))}
            </ul>

            {/* Score card */}
            {verificationDone && (
              <div className="score-card">
                <div className="score-circle-wrapper">
                  <ScoreCircle passed={passed} total={15} />
                </div>
                <h3>{passed} of 15 Data Points Verified</h3>
                <p>This contact scores above the verification threshold</p>
                <div className="score-breakdown">
                  <div className="breakdown-item">
                    <div className="breakdown-dot pass" />
                    <span>{passed} passed</span>
                  </div>
                  <div className="breakdown-item">
                    <div className="breakdown-dot fail" />
                    <span>{failed} failed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── WAITLIST ─── */}
      {verificationDone && (
        <section className="waitlist-section">
          <h3>Want verified leads like this delivered daily?</h3>
          <div className="rainbow-line" />
          <p>Join the waitlist and be the first to get access to Data Driver.</p>

          {waitlistSuccess ? (
            <div className="waitlist-success">
              You're on the list. We'll reach out when your verified leads are ready.
            </div>
          ) : (
            <form className="waitlist-form" onSubmit={handleWaitlistSubmit}>
              <input
                type="text"
                placeholder="Your name"
                value={waitlistForm.name}
                onChange={(e) => setWaitlistForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Email address"
                value={waitlistForm.email}
                onChange={(e) => setWaitlistForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <input
                type="text"
                placeholder="Company (optional)"
                value={waitlistForm.company}
                onChange={(e) => setWaitlistForm((f) => ({ ...f, company: e.target.value }))}
              />
              <button type="submit" className="waitlist-submit" disabled={waitlistSubmitting}>
                {waitlistSubmitting ? 'Joining...' : 'Join the Waitlist'}
              </button>
              {waitlistError && <div className="waitlist-error">{waitlistError}</div>}
            </form>
          )}
        </section>
      )}

      {/* ─── HOW IT WORKS ─── */}
      <section className="how-section">
        <h2>How It Works</h2>
        <div className="rainbow-line" />
        <p className="how-subtitle">Three steps from signal to sale</p>

        <div className="how-grid">
          <div className="how-card">
            <div className="how-icon">
              <RadarIcon />
            </div>
            <h3>Detect Intent Signals</h3>
            <p>
              Data Driver identifies people actively searching for insurance and
              financial services online.
            </p>
          </div>

          <div className="how-card">
            <div className="how-icon">
              <ShieldIcon />
            </div>
            <h3>Verify 15 Data Points</h3>
            <p>
              Every contact verified against our 10/15 standard before it reaches you.
            </p>
          </div>

          <div className="how-card">
            <div className="how-icon">
              <PeopleIcon />
            </div>
            <h3>Deliver Ready-to-Buy Contacts</h3>
            <p>
              You get contacts who already want what you're offering. No cold calls.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="footer">
        <div className="footer-brand">Built by AJF Financial Group</div>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
        <div className="footer-copy">&copy; 2026 AJF Financial Group. All rights reserved.</div>
      </footer>
    </>
  );
}

export default App;
